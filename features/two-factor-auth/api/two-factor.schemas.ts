import { z } from "zod"

export const enableTwoFactorSchema = z.object({
	password: z.string().min(1, "Password is required")
})

export const verifyTwoFactorSchema = z.object({
	code: z
		.string()
		.length(6, "Code must be 6 digits")
		.regex(/^\d+$/, "Code must contain only numbers")
})

export const disableTwoFactorSchema = z.object({
	password: z.string().min(1, "Password is required")
})

export type EnableTwoFactorInput = z.infer<typeof enableTwoFactorSchema>
export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>
export type DisableTwoFactorInput = z.infer<typeof disableTwoFactorSchema>
