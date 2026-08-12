import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

const searchSchema = z.object({ query: z.string().min(1) })

export const homeRouter = createTRPCRouter({
	search: protectedProcedure
		.input(searchSchema)
		.query(async ({ ctx, input }) => {
			const q = input.query

			// Search envelopes that the user owns or is recipient of
			const envelopes = await ctx.db.envelope.findMany({
				where: {
					OR: [
						{
							title: { contains: q, mode: "insensitive" },
							userId: ctx.session.user.id
						},
						{
							description: { contains: q, mode: "insensitive" },
							userId: ctx.session.user.id
						},
						{
							title: { contains: q, mode: "insensitive" },
							recipient: { some: { userId: ctx.session.user.id } }
						},
						{
							description: { contains: q, mode: "insensitive" },
							recipient: { some: { userId: ctx.session.user.id } }
						}
					]
				},
				select: { id: true, title: true, description: true, updatedAt: true }
			})

			// Search documents the user can access (documents inside envelopes they own or are recipient of)
			const documents = await ctx.db.document.findMany({
				where: {
					OR: [
						{
							name: { contains: q, mode: "insensitive" },
							envelope: { userId: ctx.session.user.id }
						},
						{
							name: { contains: q, mode: "insensitive" },
							envelope: { recipient: { some: { userId: ctx.session.user.id } } }
						}
					]
				},
				select: { id: true, name: true, envelopeId: true, createdAt: true }
			})

			return {
				envelopes,
				documents
			}
		}),
	recent: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id

		const envelopes = await ctx.db.envelope.findMany({
			where: {
				OR: [{ userId }, { recipient: { some: { userId } } }]
			},
			orderBy: { updatedAt: "desc" },
			take: 3,
			select: { id: true, title: true, description: true, updatedAt: true }
		})

		const documents = await ctx.db.document.findMany({
			where: {
				OR: [
					{ envelope: { userId } },
					{ envelope: { recipient: { some: { userId } } } }
				]
			},
			orderBy: { createdAt: "desc" },
			take: 3,
			select: { id: true, name: true, envelopeId: true, createdAt: true }
		})

		return { envelopes, documents }
	})
})
