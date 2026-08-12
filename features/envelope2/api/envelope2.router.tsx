import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

export const envelope2Router = createTRPCRouter({
  // Get all envelopes with basic details with pagination and search
  getLocalEnvelopes: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search } = input
      const isAdmin = ctx.session.user.role === "ADMIN"
      const skip = (page - 1) * limit

      const where = {
        ...(isAdmin
          ? {}
          : {
            OR: [
              { userId: ctx.session.user.id },
              { recipient: { some: { userId: ctx.session.user.id } } }
            ]
          }),
        ...(search
          ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              {
                description: {
                  contains: search,
                  mode: "insensitive" as const
                }
              }
            ]
          }
          : {})
      }

      const [envelopes, total] = await Promise.all([
        ctx.db.envelope.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc"
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            documents: {
              select: {
                id: true,
                name: true,
                type: true,
                size: true,
                createdAt: true,
                path: true // Include path for URL generation
              },
              orderBy: {
                createdAt: "desc"
              }
            },
            recipient: {
              select: {
                id: true,
                role: true,
                status: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true
                  }
                }
              }
            }
          }
        }),
        ctx.db.envelope.count({ where })
      ])

      return {
        data: envelopes,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }),

  // Get a single envelope by ID
  getEnvelope: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "ADMIN"

      const envelope = await ctx.db.envelope.findUnique({
        where: {
          id: input.id,
          ...(isAdmin ? {} : {
            OR: [
              { userId: ctx.session.user.id },
              { recipient: { some: { userId: ctx.session.user.id } } }
            ]
          })
        },
        include: {
          documents: {
            select: {
              id: true,
              name: true,
              type: true,
              size: true,
              createdAt: true,
              path: true,
              recipients: {
                include: {
                  user: true
                }
              }
            }
          },
          recipient: {
            include: {
              user: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      })

      if (!envelope) {
        throw new Error("Envelope not found or access denied")
      }

      return envelope
    }),

  // Get all envelopes for the current user
  getMyEnvelopes: protectedProcedure.query(async ({ ctx }) => {
    const envelopes = await ctx.db.envelope.findMany({
      where: {
        userId: ctx.session.user.id
      },
      include: {
        documents: {
          include: {
            recipients: {
              include: {
                user: true
              }
            }
          }
        },
        recipient: {
          where: {
            role: "APPROVER",
            documentId: null // Envelope-level recipients have no documentId
          },
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return envelopes
  })
})
