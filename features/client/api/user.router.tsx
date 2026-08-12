// File: /app/dashboard/(legal)/clients/api/user.router.ts
import bcrypt from "bcryptjs"
import { z } from "zod"

import { db } from "@/services/prisma/db"
import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

import { createUserSchema, updateUserSchema, userSchema } from "./user.schema"

export const userRouter = createTRPCRouter({
	getAll: protectedProcedure.output(z.array(userSchema)).query(async () => {
		const users = await db.user.findMany({
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				organization: true,
				image: true,
				emailVerified: true
			},
			orderBy: { name: "desc" }
		})

		return users.map((user) => ({
			...user,
			emailVerified: user.emailVerified?.toISOString() ?? null
		}))
	}),

	create: protectedProcedure
		.input(createUserSchema)
		.output(userSchema)
		.mutation(async ({ input }) => {
			// Check if user with this email already exists
			const existingUser = await db.user.findUnique({
				where: { email: input.email }
			})

			if (existingUser) {
				throw new Error(`A user with email ${input.email} already exists`)
			}

			// Hash the password before storing it
			const hashedPassword = await bcrypt.hash(input.password, 12)

			const user = await db.user.create({
				data: {
					name: input.name,
					email: input.email,
					role: input.role,
					organization: input.organization ?? null,
					password: hashedPassword,
					emailVerified: new Date() // Mark email as verified upon creation
				},
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					organization: true,
					image: true,
					emailVerified: true
				}
			})

			return {
				...user,
				emailVerified: user.emailVerified?.toISOString() ?? null
			}
		}),

	update: protectedProcedure
		.input(updateUserSchema)
		.output(userSchema)
		.mutation(async ({ input }) => {
			// Check if another user with this email already exists (excluding current user)
			const existingUser = await db.user.findFirst({
				where: {
					email: input.email,
					id: { not: input.id }
				}
			})

			if (existingUser) {
				throw new Error(`A user with email ${input.email} already exists`)
			}

			const user = await db.user.update({
				where: { id: input.id },
				data: {
					name: input.name,
					email: input.email,
					role: input.role,
					organization: input.organization ?? null
				},
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					organization: true,
					image: true,
					emailVerified: true
				}
			})

			return {
				...user,
				emailVerified: user.emailVerified?.toISOString() ?? null
			}
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.output(z.object({ success: z.boolean(), message: z.string() }))
		.mutation(async ({ input }) => {
			try {
				// Check if user exists
				const existingUser = await db.user.findUnique({
					where: { id: input.id }
				})

				if (!existingUser) {
					throw new Error("User not found")
				}

				// Delete the user
				await db.user.delete({
					where: { id: input.id }
				})

				return {
					success: true,
					message: "User deleted successfully"
				}
			} catch (error) {
				throw new Error(
					`Failed to delete user: ${error instanceof Error ? error.message : "Unknown error"}`
				)
			}
		})
})
