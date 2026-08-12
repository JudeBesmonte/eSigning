import type { Prisma } from "@prisma/client"

import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

import {
  approveUserSchema,
  createUserSchema,
  deleteUserSchema,
  getUserByIdSchema,
  suspendUserSchema,
  unsuspendUserSchema,
  updateUserSchema,
  userListInputSchema
} from "./user-management.schema"

export const userManagementRouter = createTRPCRouter({
  // Get all users with optional filtering
  list: protectedProcedure
    .input(userListInputSchema)
    .query(async ({ ctx, input }) => {
      const whereCondition: Prisma.UserWhereInput = {}

      // Apply search filter
      if (input.search) {
        const searchTerm = input.search.toLowerCase()
        whereCondition.OR = [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
          { organization: { contains: searchTerm, mode: "insensitive" } }
        ]
      }

      // Apply role filter
      if (input.role && input.role !== "all") {
        whereCondition.role = input.role
      }

      // Apply status filter
      if (input.status && input.status !== "all") {
        switch (input.status) {
          case "active":
            whereCondition.AND = [
              { emailVerified: { not: null } },
              { suspendedAt: null }
            ]
            break
          case "pending":
            whereCondition.emailVerified = null
            break
          case "suspended":
            whereCondition.suspendedAt = { not: null }
            break
        }
      }

      // Filter out super admin users if current user is admin
      if (ctx.session.user.role === "ADMIN") {
        whereCondition.AND = whereCondition.AND ?? []
        if (Array.isArray(whereCondition.AND)) {
          whereCondition.AND.push({
            role: { not: "SUPER_ADMIN" }
          })
        } else {
          whereCondition.AND = [
            whereCondition.AND,
            {
              role: { not: "SUPER_ADMIN" }
            }
          ]
        }
      }

      // Calculate pagination
      const page = input.page ?? 1
      const limit = input.limit ?? 10
      const skip = (page - 1) * limit

      // Get total count for pagination
      const totalCount = await ctx.db.user.count({
        where: whereCondition
      })

      const users = await ctx.db.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organization: true,
          image: true,
          emailVerified: true,
          suspendedAt: true
        },
        orderBy: {
          id: "desc"
        },
        skip,
        take: limit
      })

      // Transform to match the expected frontend format with activity statistics
      const transformedUsers = await Promise.all(
        users.map(async (user) => {
          // Calculate user activity statistics
          const [documentsCount, signaturesCount] = await Promise.all([
            // Count documents where user is a recipient
            ctx.db.document.count({
              where: {
                recipients: {
                  some: {
                    userId: user.id
                  }
                }
              }
            }),
            // Count signatures by this user
            ctx.db.recipient.count({
              where: {
                userId: user.id,
                status: "SIGNED"
              }
            })
          ])

          return {
            id: user.id,
            name: user.name ?? "Unknown User",
            email: user.email ?? "no-email@example.com",
            role: user.role.toLowerCase().replace("_", "-") as
              | "client"
              | "admin"
              | "super-admin",
            organization: user.organization,
            status: user.suspendedAt
              ? ("suspended" as const)
              : user.emailVerified
                ? ("active" as const)
                : ("pending" as const),
            joinDate:
              user.emailVerified?.toISOString().split("T")[0] ??
              new Date().toISOString().split("T")[0],
            lastActive:
              user.emailVerified?.toISOString() ?? new Date().toISOString(),
            documentsCount: documentsCount,
            signaturesCount: signaturesCount,
            avatar: user.image ?? null
          }
        })
      )

      return {
        users: transformedUsers,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      }
    }),

  // Get user statistics
  stats: protectedProcedure.query(async ({ ctx }) => {
    // Build where condition to exclude super admin users if current user is admin
    const whereCondition: Prisma.UserWhereInput = {}
    if (ctx.session.user.role === "ADMIN") {
      whereCondition.role = { not: "SUPER_ADMIN" }
    }

    // Fetch all counts in a single query using groupBy
    const grouped = await ctx.db.user.groupBy({
      by: ["emailVerified", "suspendedAt"],
      _count: true,
      where: whereCondition
    })

    let total = 0
    let active = 0
    let pending = 0
    let suspended = 0

    for (const group of grouped) {
      const count = group._count
      total += count

      const isEmailVerified = group.emailVerified !== null
      const isSuspended = group.suspendedAt !== null

      if (isSuspended) {
        suspended += count
      } else if (isEmailVerified) {
        active += count
      } else {
        pending += count
      }
    }

    return {
      total,
      active,
      pending,
      suspended
    }
  }),

  // Get single user by ID
  getById: protectedProcedure
    .input(getUserByIdSchema)
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organization: true,
          image: true,
          emailVerified: true,
          suspendedAt: true
        }
      })

      if (!user) {
        throw new Error("User not found")
      }

      // Calculate user activity statistics
      const [documentsCount, signaturesCount] = await Promise.all([
        // Count documents where user is a recipient (documents they need to sign or have signed)
        ctx.db.document.count({
          where: {
            recipients: {
              some: {
                userId: user.id
              }
            }
          }
        }),
        // Count signatures by this user (recipients with SIGNED status)
        ctx.db.recipient.count({
          where: {
            userId: user.id,
            status: "SIGNED"
          }
        })
      ])

      return {
        id: user.id,
        name: user.name ?? "Unknown User",
        email: user.email ?? "no-email@example.com",
        role: user.role.toLowerCase().replace("_", "-") as
          | "client"
          | "admin"
          | "super-admin",
        organization: user.organization,
        status: user.suspendedAt
          ? ("suspended" as const)
          : user.emailVerified
            ? ("active" as const)
            : ("pending" as const),
        joinDate:
          user.emailVerified?.toISOString().split("T")[0] ??
          new Date().toISOString().split("T")[0],
        lastActive:
          user.emailVerified?.toISOString() ?? new Date().toISOString(),
        documentsCount: documentsCount,
        signaturesCount: signaturesCount,
        avatar: user.image ?? null
      }
    }),

  // Create new user
  create: protectedProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email }
      })

      if (existingUser) {
        throw new Error("User with this email already exists")
      }

      const newUser = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          role: input.role,
          password: input.password
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organization: true,
          image: true,
          emailVerified: true,
          suspendedAt: true
        }
      })

      return {
        id: newUser.id,
        name: newUser.name ?? "Unknown User",
        email: newUser.email ?? "no-email@example.com",
        role: newUser.role.toLowerCase().replace("_", "-") as
          | "client"
          | "admin"
          | "super-admin",
        organization: newUser.organization,
        status: newUser.suspendedAt
          ? ("suspended" as const)
          : newUser.emailVerified
            ? ("active" as const)
            : ("pending" as const),
        joinDate:
          newUser.emailVerified?.toISOString().split("T")[0] ??
          new Date().toISOString().split("T")[0],
        lastActive:
          newUser.emailVerified?.toISOString() ?? new Date().toISOString(),
        documentsCount: 0,
        avatar: newUser.image ?? null
      }
    }),

  // Update user
  update: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.user.update({
        where: { id: input.id },
        data: {
          name: input.name,
          email: input.email,
          role: input.role,
          organization: input.organization
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organization: true,
          image: true,
          emailVerified: true,
          suspendedAt: true
        }
      })

      return {
        id: updatedUser.id,
        name: updatedUser.name ?? "Unknown User",
        email: updatedUser.email ?? "no-email@example.com",
        role: updatedUser.role.toLowerCase().replace("_", "-") as
          | "client"
          | "admin"
          | "super-admin",
        organization: updatedUser.organization,
        status: updatedUser.suspendedAt
          ? ("suspended" as const)
          : updatedUser.emailVerified
            ? ("active" as const)
            : ("pending" as const),
        joinDate:
          updatedUser.emailVerified?.toISOString().split("T")[0] ??
          new Date().toISOString().split("T")[0],
        lastActive:
          updatedUser.emailVerified?.toISOString() ?? new Date().toISOString(),
        documentsCount: 0,
        avatar: updatedUser.image ?? null
      }
    }),

  // Delete user
  delete: protectedProcedure
    .input(deleteUserSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.delete({
        where: { id: input.id }
      })

      return { success: true, deletedId: input.id }
    }),

  // Approve user (verify email)
  approve: protectedProcedure
    .input(approveUserSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.id },
        data: {
          emailVerified: new Date()
        }
      })

      return { success: true, userId: input.id, status: "active" }
    }),

  // Suspend user (set suspendedAt)
  suspend: protectedProcedure
    .input(suspendUserSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.id },
        data: {
          suspendedAt: new Date()
        }
      })

      return { success: true, userId: input.id, status: "suspended" }
    }),

  // Unsuspend user (clear suspendedAt)
  unsuspend: protectedProcedure
    .input(unsuspendUserSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.id },
        data: {
          suspendedAt: null
        }
      })

      return { success: true, userId: input.id, status: "active" }
    }),

  // Get current user's default signature
  getDefaultSignature: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        defaultSignature: true
      }
    })

    if (!user) {
      throw new Error("User not found")
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      defaultSignature: user.defaultSignature,
      hasDefaultSignature: !!user.defaultSignature
    }
  })
})
