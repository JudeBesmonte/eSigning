import { TRPCError } from "@trpc/server"
import { compare } from "bcryptjs"

import { emailService } from "@/services/email/service"
import { prepareTwoFactorEmail } from "@/services/email/templates/two-factor-auth/service"
import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

import { createNotificationForUser } from "@/features/notification/api/notification.router"

import {
	disableTwoFactorSchema,
	enableTwoFactorSchema,
	verifyTwoFactorSchema
} from "./two-factor.schemas"

export const twoFactorRouter = createTRPCRouter({
	// Enable 2FA
	enable: protectedProcedure
		.input(enableTwoFactorSchema)
		.mutation(async ({ ctx, input }) => {
			const { password } = input
			const userId = ctx.session.user.id

			// Verify current password
			const user = await ctx.db.user.findUnique({
				where: { id: userId },
				select: { password: true, twoFactorEnabled: true, email: true }
			})

			if (!user) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			if (user.twoFactorEnabled) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Two-factor authentication is already enabled"
				})
			}

			const isValidPassword = await compare(password, user.password)
			if (!isValidPassword) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Invalid password"
				})
			}

			// Generate verification code
			const code = Math.floor(100000 + Math.random() * 900000).toString()
			const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

			// Store code in database
			try {
				await ctx.db.twoFactorCode.create({
					data: {
						userId,
						code,
						expires
					}
				})

				// Send email with code using professional template
				if (user.email) {
					const emailData = await prepareTwoFactorEmail({
						user: {
							name: ctx.session.user.name,
							email: user.email
						},
						code,
						type: "enable"
					})

					await emailService.sendEmail(emailData)
				}

				return {
					success: true,
					message: "Verification code sent to your email"
				}
			} catch {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create verification code"
				})
			}
		}), // Verify code and enable 2FA
	verify: protectedProcedure
		.input(verifyTwoFactorSchema)
		.mutation(async ({ ctx, input }) => {
			const { code } = input
			const userId = ctx.session.user.id

			// Find valid code
			const twoFactorCode = await ctx.db.twoFactorCode.findFirst({
				where: {
					userId,
					code,
					used: false,
					expires: { gt: new Date() }
				}
			})

			if (!twoFactorCode) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid or expired verification code"
				})
			}

			// Mark code as used and enable 2FA
			await ctx.db.$transaction([
				ctx.db.twoFactorCode.update({
					where: { id: twoFactorCode.id },
					data: { used: true }
				}),
				ctx.db.user.update({
					where: { id: userId },
					data: { twoFactorEnabled: true }
				})
			])

			// In-app notification: 2FA enabled
			try {
				await createNotificationForUser({
					ctx,
					userId: userId,
					title: "Two-factor authentication enabled",
					message: "Your account now requires a 2FA code on sign-in.",
					type: "success",
					link: "/settings"
				})
			} catch (e) {
				console.error("Failed to create 2FA enabled notification", e)
			}

			return {
				success: true,
				message: "Two-factor authentication enabled successfully"
			}
		}),

	// Disable 2FA
	disable: protectedProcedure
		.input(disableTwoFactorSchema)
		.mutation(async ({ ctx, input }) => {
			const { password } = input
			const userId = ctx.session.user.id

			// Verify current password
			const user = await ctx.db.user.findUnique({
				where: { id: userId },
				select: { password: true, twoFactorEnabled: true, email: true }
			})

			if (!user) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			if (!user.twoFactorEnabled) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Two-factor authentication is not enabled"
				})
			}

			const isValidPassword = await compare(password, user.password)
			if (!isValidPassword) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Invalid password"
				})
			}

			// Disable 2FA and clean up codes
			await ctx.db.$transaction([
				ctx.db.user.update({
					where: { id: userId },
					data: { twoFactorEnabled: false }
				}),
				ctx.db.twoFactorCode.deleteMany({
					where: { userId }
				})
			])

			// Send security notification email
			if (user.email) {
				try {
					const emailData = await prepareTwoFactorEmail({
						user: {
							name: ctx.session.user.name,
							email: user.email
						},
						code: "DISABLED",
						type: "disable"
					})

					await emailService.sendEmail(emailData)
				} catch {
					// Don't fail the operation if email fails
					console.error("Failed to send 2FA disable notification email")
				}
			}

			// In-app notification: 2FA disabled
			try {
				await createNotificationForUser({
					ctx,
					userId: userId,
					title: "Two-factor authentication disabled",
					message: "2FA has been turned off for your account.",
					type: "warning",
					link: "/settings"
				})
			} catch (e) {
				console.error("Failed to create 2FA disabled notification", e)
			}

			return {
				success: true,
				message: "Two-factor authentication disabled successfully"
			}
		}),

	// Check 2FA status
	status: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.db.user.findUnique({
			where: { id: ctx.session.user.id },
			select: { twoFactorEnabled: true }
		})

		return { twoFactorEnabled: Boolean(user?.twoFactorEnabled ?? false) }
	})
})
