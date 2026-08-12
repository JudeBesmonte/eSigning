import { Role } from "@prisma/client"
import { z } from "zod"

// Base schema without password confirmation
const baseUserSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.optional(),
	role: z.nativeEnum(Role),
	organization: z.string().nullish(),
	phone: z.string().nullish(),
	image: z.string().nullish()
})

// Schema for creating users with password confirmation
export const userInputSchema = baseUserSchema
	.extend({
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string().min(8, "Please confirm your password")
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"]
	})

// Schema for updating users (without password confirmation)
export const userUpdateSchema = baseUserSchema.partial().extend({
	id: z.string(),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.optional()
})

export type UserInput = z.infer<typeof userInputSchema>

export const userFilterSchema = z.object({
	search: z.string().optional(),
	role: z.nativeEnum(Role).optional(),
	status: z.enum(["active", "suspended"]).optional(),
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(10)
})

export type UserFilter = z.infer<typeof userFilterSchema>

export interface UserWithRelations {
	id: string
	name: string | null
	email: string | null
	emailVerified: Date | null
	image: string | null
	role: Role
	organization: string | null
	phone: string | null
	suspendedAt: Date | null
	twoFactorEnabled: boolean

	// Envelopes created by this user
	envelopes?: Array<{
		id: string
		title: string
		status: string
		createdAt: Date
		updatedAt: Date
		_count: {
			documents: number
		}
	}>

	// Documents created by this user
	documents?: Array<{
		id: string
		name: string
		type: string
		status: string
		createdAt: Date
		envelope: {
			id: string
			title: string
			status: string
		} | null
	}>

	// Documents where user is a recipient
	recipientDocuments?: Array<{
		id: string
		name: string
		type: string
		status: string
		createdAt: Date
		recipientRole: string
		recipientStatus: string
		envelope: {
			id: string
			title: string
			status: string
		} | null
	}>
}
