import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

import { saveDefaultSignatureSchema } from "./signature-registration.schemas"

export const signatureRegistrationRouter = createTRPCRouter({
	saveDefaultSignature: protectedProcedure
		.input(saveDefaultSignatureSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id
			const { signatureData, signatureType } = input

			// Validate and clean the base64 signature data
			const cleanedSignatureData = signatureData.startsWith("data:")
				? signatureData
				: `data:image/png;base64,${signatureData}`

			try {
				// Update the user's default signature
				const updatedUser = await ctx.db.user.update({
					where: { id: userId },
					data: {
						defaultSignature: cleanedSignatureData,
						defaultSignatureType: signatureType
					},
					select: {
						id: true,
						name: true,
						email: true,
						defaultSignature: true,
						defaultSignatureType: true
					}
				})

				return {
					success: true,
					message: "Default signature saved successfully",
					user: updatedUser
				}
			} catch (error) {
				console.error("Error saving default signature:", error)
				throw new Error("Failed to save default signature")
			}
		})
})
