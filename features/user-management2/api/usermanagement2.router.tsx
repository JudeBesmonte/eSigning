import { Prisma, Role } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

import { userInputSchema, userUpdateSchema } from "./user.schema"

// Types for the procedures
export type UserWithRelations = {
	id: string
	name: string | null
	email: string | null
	emailVerified: Date | null
	suspendedAt: Date | null
	twoFactorEnabled: boolean
	role: Role
	organization: string | null
	image: string | null
	phone: string | null
}

type PaginatedUsers = {
	data: UserWithRelations[]
	pagination: {
		total: number
		page: number
		limit: number
		totalPages: number
	}
}

const userFilterSchema = z.object({
	search: z.string().optional(),
	role: z.nativeEnum(Role).optional(),
	status: z.enum(["active", "suspended"]).optional(),
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(10),
	sortBy: z
		.enum(["name", "email", "role", "status", "createdAt"])
		.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc")
})

type UserOrderByInput = Prisma.UserOrderByWithRelationInput

export const usermanagement2Router = createTRPCRouter({
	// Get all users with pagination, filtering, and sorting
	getAll: protectedProcedure
		.input(userFilterSchema)
		.query(async ({ ctx, input }): Promise<PaginatedUsers> => {
			try {
				const { search, role, status, page, limit, sortBy, sortOrder } = input

				// Define sort mapping with proper Prisma types
				const sortFieldMap: Record<string, UserOrderByInput> = {
					name: { name: sortOrder },
					email: { email: sortOrder },
					role: { role: sortOrder },
					status: { suspendedAt: sortOrder },
					// Default to sorting by ID if created_at is not available
					createdAt: { id: sortOrder }
				}
				const where = {
					...(search && {
						OR: [
							{
								name: { contains: search, mode: Prisma.QueryMode.insensitive }
							},
							{
								email: { contains: search, mode: Prisma.QueryMode.insensitive }
							}
						]
					}),
					...(role && { role }),
					...(status === "suspended"
						? { suspendedAt: { not: null } }
						: status === "active"
							? { suspendedAt: null }
							: {})
				}

				// Get total count for pagination
				const total = await ctx.db.user.count({
					where: where
				})

				// Get paginated users with sorting
				const users = await ctx.db.user.findMany({
					where,
					skip: (page - 1) * limit,
					take: limit,
					orderBy: {
						...(sortBy === "status"
							? { suspendedAt: sortOrder }
							: sortFieldMap[sortBy]),
						id: "asc"
					},
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
						image: true,
						suspendedAt: true,
						organization: true,
						phone: true,
						emailVerified: true,
						twoFactorEnabled: true
					}
				})

				return {
					data: users,
					pagination: {
						total,
						page,
						limit,
						totalPages: Math.ceil(total / limit)
					}
				}
			} catch (error) {
				console.error("Error in userManagement2.getAll:", error)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch users",
					cause: error
				})
			}
		}),

	// Get single user by ID with related data
	getById: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input: id }) => {
			// First get the user with basic info
			const user = await ctx.db.user.findUnique({
				where: { id },
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					image: true,
					suspendedAt: true,
					organization: true,
					phone: true,
					emailVerified: true,
					twoFactorEnabled: true
				}
			})

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found"
				})
			}

			// Get envelopes created by this user
			const envelopes = await ctx.db.envelope.findMany({
				where: { userId: id },
				select: {
					id: true,
					title: true,
					status: true,
					createdAt: true,
					updatedAt: true,
					_count: {
						select: { documents: true }
					}
				},
				orderBy: { createdAt: "desc" },
				take: 5 // Limit to 5 most recent
			})

			// Define document type for better type safety
			type DocumentWithEnvelope = {
				id: string
				name: string | null
				type: string
				status?: string
				createdAt: Date
				envelope: {
					id: string
					title: string | null
					status: string
				} | null
			}

			// Get documents where user is the owner (via envelope)
			const ownedDocuments = await ctx.db.document.findMany({
				where: {
					envelope: {
						userId: id
					}
				},
				select: {
					id: true,
					name: true,
					type: true,
					createdAt: true,
					envelope: {
						select: {
							id: true,
							title: true,
							status: true
						}
					}
				},
				orderBy: { createdAt: "desc" },
				take: 5
			})

			// Get documents where user is a recipient
			const recipientDocs = await ctx.db.recipient.findMany({
				where: {
					userId: id,
					documentId: { not: null }
				},
				include: {
					document: {
						include: {
							envelope: {
								select: {
									id: true,
									title: true,
									status: true
								}
							}
						}
					}
				},
				orderBy: { document: { createdAt: "desc" } },
				take: 5
			})

			// Process and combine documents
			const processedOwnedDocs: DocumentWithEnvelope[] = ownedDocuments.map(
				(doc) => ({
					...doc,
					name: doc.name || "Untitled Document",
					type: doc.type || "document",
					status: "PENDING",
					envelope: doc.envelope
						? {
								id: doc.envelope.id,
								title: doc.envelope.title,
								status: doc.envelope.status
							}
						: null
				})
			)

			const processedRecipientDocs: DocumentWithEnvelope[] = recipientDocs
				.filter(
					(rd) =>
						rd.document &&
						!processedOwnedDocs.some((doc) => doc.id === rd.documentId)
				)
				.map((rd) => ({
					id: rd.document!.id,
					name: rd.document!.name || "Untitled Document",
					type: rd.document!.type || "document",
					status: rd.status || "PENDING",
					createdAt: rd.document!.createdAt,
					envelope: rd.document!.envelope
						? {
								id: rd.document!.envelope.id,
								title: rd.document!.envelope.title,
								status: rd.document!.envelope.status
							}
						: null
				}))

			// Combine and limit to 5 most recent
			const documents = [...processedOwnedDocs, ...processedRecipientDocs]
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
				.slice(0, 5)

			// Define interfaces for the additional properties
			interface EnvelopeWithCount
				extends Omit<(typeof envelopes)[number], "_count"> {
				_count: {
					documents: number
				}
			}

			// Transform the data for easier consumption
			const result: UserWithRelations & {
				envelopes?: EnvelopeWithCount[]
				documents?: Array<(typeof documents)[number]>
			} = {
				...user,
				envelopes: envelopes.map((env) => ({
					...env,
					_count: {
						documents: 1 // This needs to be updated with actual count if needed
					}
				})),
				documents: documents
			}

			return result
		}),

	// Create a new user
	create: protectedProcedure
		.input(userInputSchema)
		.mutation(async ({ ctx, input }): Promise<UserWithRelations> => {
			const { user: currentUser } = ctx.session

			// Check if user already exists
			const existingUser = await ctx.db.user.findUnique({
				where: { email: input.email }
			})

			if (existingUser) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "User with this email already exists"
				})
			}

			// Enforce role-based access control
			if (currentUser.role === "ADMIN" && input.role !== "CLIENT") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to create users with this role"
				})
			}

			// Prevent creating SUPER_ADMIN users unless explicitly allowed
			if (input.role === "SUPER_ADMIN" && currentUser.role !== "SUPER_ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to create SUPER_ADMIN users"
				})
			}

			// Validate password exists before hashing
			if (!input.password) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Password is required"
				})
			}

			// Hash the password before saving to the database
			const hashedPassword = await bcrypt.hash(input.password, 10)

			// Automatically verify email for all users created through admin interface
			const emailVerified = new Date()

			const user = await ctx.db.user.create({
				data: {
					name: input.name,
					email: input.email.toLowerCase().trim(),
					password: hashedPassword,
					role: input.role,
					organization: input.organization?.trim() ?? null,
					emailVerified: emailVerified,
					image: input.image ? String(input.image).trim() : null,
					phone: input.phone ? String(input.phone).trim() : null
				},
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					suspendedAt: true,
					organization: true,
					emailVerified: true,
					twoFactorEnabled: true,
					image: true,
					phone: true
				}
			})

			return user
		}),

	// Update an existing user
	update: protectedProcedure
		.input(userUpdateSchema)
		.mutation(async ({ ctx, input: { id, ...data } }) => {
			const user = await ctx.db.user.update({
				where: { id },
				data,
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					image: true,
					suspendedAt: true,
					organization: true,
					phone: true,
					emailVerified: true,
					twoFactorEnabled: true
				}
			})

			return user as UserWithRelations
		}),

	// Delete a user
	delete: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input: id }) => {
			const user = await ctx.db.user.delete({
				where: { id },
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					image: true,
					suspendedAt: true,
					organization: true,
					phone: true,
					emailVerified: true,
					twoFactorEnabled: true
				}
			})

			return user as UserWithRelations
		}),

	// Toggle user suspension
	toggleSuspension: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				suspend: z.boolean()
			})
		)
		.mutation(async ({ ctx, input: { id, suspend } }) => {
			const user = await ctx.db.user.update({
				where: { id },
				data: {
					suspendedAt: suspend ? new Date() : null
				},
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					image: true,
					suspendedAt: true,
					organization: true,
					phone: true,
					emailVerified: true,
					twoFactorEnabled: true
				}
			})

			return user as UserWithRelations
		})
})
