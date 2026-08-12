import { Role } from "@prisma/client"
import { z } from "zod"

const phoneRegex = new RegExp(
	/^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
)

// Base validation schemas - Single responsibility principle
const nameSchema = z
	.string({ required_error: "Name is required" })
	.trim()
	.min(1, "Name cannot be empty")
	.trim()

const emailSchema = z
	.string({ required_error: "Email is required" })
	.email("Please enter a valid email address")
	.trim()
	.toLowerCase()

const passwordSchema = z
	.string({ required_error: "Password is required" })
	.trim()
	.min(6, "Password must be at least 6 characters long")

const confirmPasswordSchema = z
	.string({ required_error: "Please confirm your password" })
	.trim()
	.min(6, "Password confirmation must be at least 6 characters long")

const phoneSchema = z
	.string()
	.optional()
	.or(z.literal(""))
	.refine((val) => !val || phoneRegex.test(val), "Invalid phone number!")

const roleSchema = z.nativeEnum(Role, {
	errorMap: () => ({ message: "Please select a valid role" })
})

const organizationSchema = z.string().trim().optional().or(z.literal(""))

export const profileSchema = z.object({
	name: nameSchema,
	email: emailSchema,
	role: roleSchema,
	organization: organizationSchema
})

// Simplified personal info schema – only keep working, persisted fields for now
export const personalInformationSchema = z.object({
	name: nameSchema,
	email: emailSchema,
	phone: phoneSchema,
	organization: organizationSchema
})

export const notaryInformationSchema = z.object({
	notaryId: z.string(),
	state: z.string(),
	expiration: z.date().optional()
})

export const notificationSettingsSchema = z.object({
	emailNotifications: z.boolean(),
	documentUpdates: z.boolean(),
	signingReminders: z.boolean(),
	systemAlerts: z.boolean(),
	marketingEmails: z.boolean()
})

export const changePasswordSchema = z
	.object({
		currentPassword: passwordSchema,
		newPassword: passwordSchema,
		confirmPassword: confirmPasswordSchema
	})
	.superRefine((data, ctx) => {
		// Password confirmation validation
		if (data.newPassword !== data.confirmPassword) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Passwords do not match",
				path: ["confirmPassword"]
			})
		}
	})

export const twoFASchema = z.object({
	twoFactorEnabled: z.boolean().default(false)
})

export const recoveryOptionsSchema = z.object({
	recoveryEmail: z
		.string()
		.optional()
		.or(z.literal(""))
		.refine(
			(val) => !val || z.string().email().safeParse(val).success,
			"Please enter a valid email address"
		),
	phone: phoneSchema
})

export const updateProfileImageSchema = z.object({
	imageUrl: z.string().url("Must be a valid image URL")
})

export const defaultSignatureSchema = z.object({
	signatureData: z.string().min(1, "Signature data is required"),
	signatureType: z.enum(["drawn", "typed", "uploaded"], {
		required_error: "Signature type is required"
	})
})

export type PersonalInformationSchema = z.infer<
	typeof personalInformationSchema
>
export type NotaryInformationSchema = z.infer<typeof notaryInformationSchema>

export type NotificationSettingsSchema = z.infer<
	typeof notificationSettingsSchema
>

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>

export type TwoFASchema = z.infer<typeof twoFASchema>

export type RecoveryOptionsSchema = z.infer<typeof recoveryOptionsSchema>

export type UpdateProfileImageSchema = z.infer<typeof updateProfileImageSchema>

export type DefaultSignatureSchema = z.infer<typeof defaultSignatureSchema>
