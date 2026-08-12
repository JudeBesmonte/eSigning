import { TRPCError } from "@trpc/server"
import { compare, hash } from "bcryptjs"

import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

import {
	changePasswordSchema,
	defaultSignatureSchema,
	notaryInformationSchema,
	notificationSettingsSchema,
	personalInformationSchema,
	recoveryOptionsSchema,
	twoFASchema,
	updateProfileImageSchema
} from "@/features/profile/api/profile.schema"

export const profileRouter = createTRPCRouter({
	getSummary: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.db.user.findUnique({
			where: { id: ctx.session.user.id },
			select: { organization: true }
		})

		return {
			organization: user?.organization
		}
	}),

	getRecentActivity: protectedProcedure.query(async () => {
		return {
			activity: [
				{
					action: "Document Signed",
					document: "Service Agreement - Acme Corporation",
					timestamp: "2 hours ago"
				},
				{
					action: "Document Created",
					document: "NDA - Global Enterprises",
					timestamp: "1 day ago"
				},
				{
					action: "Profile Updated",
					document: null,
					timestamp: "3 days ago"
				},
				{
					action: "Document Viewed",
					document: "Employment Contract - Sarah Johnson",
					timestamp: "5 days ago"
				}
			]
		}
	}),

	getPersonalInformation: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.db.user.findUnique({
			where: { id: ctx.session.user.id },
			select: { name: true, email: true, phone: true, organization: true }
		})

		return {
			name: user?.name ?? "",
			email: user?.email ?? "",
			phone: user?.phone ?? "",
			organization: user?.organization ?? ""
		}
	}),

	updatePersonalInformation: protectedProcedure
		.input(personalInformationSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await ctx.db.user.update({
				where: { id: ctx.session.user.id },
				data: {
					name: input.name,
					email: input.email,
					phone: input.phone && input.phone.trim() !== "" ? input.phone : null,
					organization: input.organization
				},
				select: { name: true, email: true, phone: true, organization: true }
			})

			return { message: "Personal information updated successfully", user }
		}),

	getNotaryInformation: protectedProcedure.query(() => {
		return {
			notaryId: "NY-12345678",
			state: "New York",
			expiration: new Date("2013-04-28")
		}
	}),

	updateNotaryInformation: protectedProcedure
		.input(notaryInformationSchema)
		.mutation(async () => {
			return { message: "Notary information updated successfully" }
		}),

	getNotificationSettings: protectedProcedure.query(() => {
		return {
			emailNotifications: true,
			documentUpdates: true,
			signingReminders: true,
			systemAlerts: true,
			marketingEmails: false
		}
	}),

	updateNotificationSettings: protectedProcedure
		.input(notificationSettingsSchema)
		.mutation(async () => {
			return { message: "Notification settings updated successfully" }
		}),

	updateProfileImage: protectedProcedure
		.input(updateProfileImageSchema)
		.mutation(async ({ ctx, input }) => {
			// Get user's current image to potentially delete it later
			const currentUser = await ctx.db.user.findUnique({
				where: { id: ctx.session.user.id },
				select: { image: true }
			})

			// Update user in database with the new image URL
			const updatedUser = await ctx.db.user.update({
				where: { id: ctx.session.user.id },
				data: { image: input.imageUrl },
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					role: true
				}
			})

			// Optionally delete old image if it exists and is different
			if (currentUser?.image && currentUser.image !== input.imageUrl) {
				try {
					const { getSupabaseClient } = await import("@/services/supabase")
					const supabase = getSupabaseClient()

					// Extract old file path from URL
					const oldUrl = new URL(currentUser.image)
					const oldPath = oldUrl.pathname.split("/avatar/")[1]
					if (oldPath) {
						await supabase.storage.from("avatar").remove([oldPath])
					}
				} catch (error) {
					console.error("Failed to delete old image:", error)
					// Don't throw error, just log it
				}
			}

			return {
				message: "Profile image updated successfully",
				imageUrl: input.imageUrl,
				user: updatedUser
			}
		}),

	security: {
		updatePassword: protectedProcedure
			.input(changePasswordSchema)
			.mutation(async ({ ctx, input }) => {
				const user = await ctx.db.user.findUnique({
					where: { id: ctx.session.user.id }
				})

				if (!user) {
					throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
				}

				const isPasswordValid = await compare(
					input.currentPassword,
					user.password
				)

				if (!isPasswordValid) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "Invalid password"
					})
				}

				const hashedNewPassword = await hash(input.newPassword, 10)

				await ctx.db.user.update({
					where: { id: ctx.session.user.id },
					data: { password: hashedNewPassword }
				})

				return { message: "Password updated successfully" }
			}),

		getTwoFactorStatus: protectedProcedure.query(async () => {
			return {
				twoFactorEnabled: false
			}
		}),

		updateTwoFactorStatus: protectedProcedure
			.input(twoFASchema)
			.mutation(async () => {
				return { message: "Two factor status updated successfully" }
			}),

		getRecoveryOptions: protectedProcedure.query(async ({ ctx }) => {
			const user = await ctx.db.user.findUnique({
				where: { id: ctx.session.user.id },
				select: {
					recoveryEmail: true,
					phone: true
				}
			})

			return {
				recoveryEmail: user?.recoveryEmail ?? "",
				phone: user?.phone ?? ""
			}
		}),

		updateRecoveryOptions: protectedProcedure
			.input(recoveryOptionsSchema)
			.mutation(async ({ ctx, input }) => {
				await ctx.db.user.update({
					where: { id: ctx.session.user.id },
					data: {
						recoveryEmail:
							input.recoveryEmail && input.recoveryEmail.trim() !== ""
								? input.recoveryEmail
								: null,
						phone: input.phone && input.phone.trim() !== "" ? input.phone : null
					}
				})

				return { message: "Recovery options updated successfully" }
			}),

		getUserSessions: protectedProcedure.query(async () => {
			return {
				activeSessions: 10
			}
		}),

		getDefaultSignature: protectedProcedure.query(async ({ ctx }) => {
			const user = await ctx.db.user.findUnique({
				where: { id: ctx.session.user.id },
				select: {
					defaultSignature: true,
					defaultSignatureType: true
				}
			})

			return {
				signature: user?.defaultSignature ?? null,
				signatureType: user?.defaultSignatureType ?? null
			}
		}),

		updateDefaultSignature: protectedProcedure
			.input(defaultSignatureSchema)
			.mutation(async ({ ctx, input }) => {
				await ctx.db.user.update({
					where: { id: ctx.session.user.id },
					data: {
						defaultSignature: input.signatureData,
						defaultSignatureType: input.signatureType
					}
				})

				return { message: "Default signature updated successfully" }
			}),

		removeDefaultSignature: protectedProcedure.mutation(async ({ ctx }) => {
			await ctx.db.user.update({
				where: { id: ctx.session.user.id },
				data: {
					defaultSignature: null,
					defaultSignatureType: null
				}
			})

			return { message: "Default signature removed successfully" }
		})
	}
})
