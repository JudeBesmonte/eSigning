// File: /app/dashboard/(legal)/clients/api/user.schema.ts
import { z } from "zod"

export const userRoleSchema = z.enum(["CLIENT", "ADMIN", "SUPER_ADMIN"])

export const userSchema = z.object({
	id: z.string(),
	name: z.string().nullable(),
	email: z.string().email().nullable(),
	role: userRoleSchema,
	organization: z.string().nullable(),
	image: z.string().nullable(),
	emailVerified: z.string().datetime().nullable()
})

export type User = z.infer<typeof userSchema>
export type UserRole = z.infer<typeof userRoleSchema>

export const createUserSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	role: userRoleSchema,
	organization: z.string().nullable().optional(),
	password: z.string().min(8, "Password must be at least 8 characters")
})

export const updateUserSchema = z.object({
	id: z.string(),
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	role: userRoleSchema,
	organization: z.string().nullable().optional()
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
