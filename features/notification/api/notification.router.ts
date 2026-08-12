/*
 * Notification TRPC router
 * Provides CRUD + lightweight subscription. Also exports a helper for other server modules
 * (e.g. envelope routers) to create notifications without importing Prisma directly.
 */
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
import { EventEmitter, on } from "events"
import type { Notification as NotificationModel, Prisma } from "@prisma/client"
import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

import {
	createNotificationSchema,
	type NotificationSchema
} from "@/features/notification/api/notification.schema"

// Simple emitter for subscription (in-process)
const ee = new EventEmitter()

// Reusable mapper (avoids repeating casts inline)
function mapRow(r: NotificationModel): NotificationSchema {
	return {
		id: r.id,
		title: r.title,
		message: r.message,
		type: (r.type as NotificationSchema["type"]) || "info",
		read: Boolean(r.readAt),
		timestamp: r.createdAt,
		link: r.link
	}
}

// Helper (internal) to create a notification for a specific user id
// Narrow minimal ctx type (only what we use). We deliberately avoid importing full context type to keep dependency surface small.
// Keep minimal and permissive to avoid cross-package type coupling
interface MinimalCtx {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	db: any
}

export async function createNotificationForUser(opts: {
	ctx: MinimalCtx
	userId: string
	title: string
	message: string
	type?: NotificationSchema["type"]
	link?: string | null
}) {
	const created: NotificationModel = await opts.ctx.db.notification.create({
		data: {
			userId: opts.userId,
			title: opts.title,
			message: opts.message,
			type: opts.type ?? "info",
			link: opts.link,
			meta: {} as Prisma.JsonObject
		}
	})
	ee.emit("notify", created.id)
	return mapRow(created)
}

export const notificationRouter = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx }) => {
		const rows: NotificationModel[] = await ctx.db.notification.findMany({
			where: { userId: ctx.session.user.id },
			orderBy: { createdAt: "desc" },
			take: 100
		})
		return rows.map(mapRow)
	}),
	unreadCount: protectedProcedure.query(async ({ ctx }): Promise<number> => {
		const c = await ctx.db.notification.count({
			where: { userId: ctx.session.user.id, readAt: null }
		})
		return Number(c)
	}),
	subscribe: protectedProcedure.subscription(async function* (opts) {
		for await (const [payload] of on(ee, "notify", {
			signal: opts.signal
		}) as AsyncIterable<[string]>) {
			yield payload
		}
	}),
	// Standard add (self user)
	add: protectedProcedure
		.input(createNotificationSchema)
		.mutation(async ({ input, ctx }) => {
			return createNotificationForUser({
				ctx,
				userId: ctx.session.user.id,
				title: input.title,
				message: input.message,
				type: input.type,
				link: input.link ?? null
			})
		}),
	// Allow system modules to create notifications for arbitrary user ids (auth still required)
	createForUser: protectedProcedure
		.input(
			z.object({
				userId: z.string().min(1),
				title: z.string().min(1),
				message: z.string().min(1),
				type: z
					.string()
					.optional()
					.refine(
						(v) => !v || ["info", "success", "warning", "error"].includes(v),
						"invalid type"
					),
				link: z.string().nullable().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			// Basic authorization: only allow creating for self or if user is envelope creator etc.
			// For now allow any authenticated user to create (can tighten later with roles)
			return createNotificationForUser({
				ctx,
				userId: input.userId,
				title: input.title,
				message: input.message,
				type: (input.type as NotificationSchema["type"]) || "info",
				link: input.link ?? null
			})
		}),
	markAsRead: protectedProcedure
		.input(z.string())
		.mutation(async ({ input, ctx }) => {
			const updated: NotificationModel = await ctx.db.notification.update({
				where: { id: input },
				data: { readAt: new Date() }
			})
			return mapRow(updated)
		}),
	markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
		await ctx.db.notification.updateMany({
			where: { userId: ctx.session.user.id, readAt: null },
			data: { readAt: new Date() }
		})
		return true
	}),
	clear: protectedProcedure
		.input(z.string())
		.mutation(async ({ input, ctx }) => {
			await ctx.db.notification.delete({ where: { id: input } })
			return true
		}),
	clearAll: protectedProcedure.mutation(async ({ ctx }) => {
		await ctx.db.notification.deleteMany({
			where: { userId: ctx.session.user.id }
		})
		return true
	})
})
