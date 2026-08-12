import type { Prisma } from "@prisma/client"

import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

import {
  createAuditEventSchema,
  getAuditEventByIdSchema,
  getAuditEventsSchema,
  deleteAuditEventSchema,
  deleteAuditEventsByTypeSchema
} from "./audit.schema"

export const auditEventRouter = createTRPCRouter({
  // Create a new audit event
  create: protectedProcedure
    .input(createAuditEventSchema)
    .mutation(async ({ ctx, input }) => {
      const auditEvent = await ctx.db.auditEvent.create({
        data: {
          eventType: input.eventType,
          description: input.description,
          userEmail: input.userEmail ?? ctx.session.user.email,
          userName: input.userName ?? ctx.session.user.name,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          metadata: input.metadata,
          envelopeId: input.envelopeId,
          documentId: input.documentId,
          recipientId: input.recipientId,
          timestamp: new Date()
        },
        include: {
          envelope: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          document: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          recipient: {
            select: {
              id: true,
              role: true,
              status: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      return auditEvent
    }),

  // Get audit events with filtering
  getAll: protectedProcedure
    .input(getAuditEventsSchema)
    .query(async ({ ctx, input }) => {
      const whereClause: Prisma.AuditEventWhereInput = {}

      // Apply filters
      if (input.envelopeId) {
        whereClause.envelopeId = input.envelopeId
      }
      if (input.documentId) {
        whereClause.documentId = input.documentId
      }
      if (input.recipientId) {
        whereClause.recipientId = input.recipientId
      }
      if (input.eventType) {
        whereClause.eventType = input.eventType
      }
      if (input.startDate || input.endDate) {
        whereClause.timestamp = {}
        if (input.startDate) {
          whereClause.timestamp.gte = input.startDate
        }
        if (input.endDate) {
          whereClause.timestamp.lte = input.endDate
        }
      }

      const [auditEvents, total] = await Promise.all([
        ctx.db.auditEvent.findMany({
          where: whereClause,
          include: {
            envelope: {
              select: {
                id: true,
                title: true,
                status: true
              }
            },
            document: {
              select: {
                id: true,
                name: true,
                type: true
              }
            },
            recipient: {
              select: {
                id: true,
                role: true,
                status: true,
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          },
          orderBy: {
            timestamp: "desc"
          },
          take: input.limit,
          skip: input.offset
        }),
        ctx.db.auditEvent.count({
          where: whereClause
        })
      ])

      return {
        data: auditEvents,
        total,
        hasMore: input.offset + input.limit < total
      }
    }),

  // Get audit events for envelopes user has access to
  getMyEnvelopeEvents: protectedProcedure
    .input(getAuditEventsSchema.omit({ envelopeId: true }))
    .query(async ({ ctx, input }) => {
      // First get envelopes the user has access to (created by them or is a recipient)
      const userEnvelopes = await ctx.db.envelope.findMany({
        where: {
          OR: [
            { userId: ctx.session.user.id },
            {
              recipient: {
                some: {
                  userId: ctx.session.user.id
                }
              }
            }
          ]
        },
        select: { id: true }
      })

      const envelopeIds = userEnvelopes.map((env) => env.id)

      if (envelopeIds.length === 0) {
        return {
          data: [],
          total: 0,
          hasMore: false
        }
      }

      const whereClause: Prisma.AuditEventWhereInput = {
        envelopeId: {
          in: envelopeIds
        }
      }

      // Apply other filters
      if (input.documentId) {
        whereClause.documentId = input.documentId
      }
      if (input.recipientId) {
        whereClause.recipientId = input.recipientId
      }
      if (input.eventType) {
        whereClause.eventType = input.eventType
      }
      if (input.startDate || input.endDate) {
        whereClause.timestamp = {}
        if (input.startDate) {
          whereClause.timestamp.gte = input.startDate
        }
        if (input.endDate) {
          whereClause.timestamp.lte = input.endDate
        }
      }

      const [auditEvents, total] = await Promise.all([
        ctx.db.auditEvent.findMany({
          where: whereClause,
          include: {
            envelope: {
              select: {
                id: true,
                title: true,
                status: true
              }
            },
            document: {
              select: {
                id: true,
                name: true,
                type: true
              }
            },
            recipient: {
              select: {
                id: true,
                role: true,
                status: true,
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          },
          orderBy: {
            timestamp: "desc"
          },
          take: input.limit,
          skip: input.offset
        }),
        ctx.db.auditEvent.count({
          where: whereClause
        })
      ])

      return {
        data: auditEvents,
        total,
        hasMore: input.offset + input.limit < total
      }
    }),

  // Get a specific audit event by ID
  getById: protectedProcedure
    .input(getAuditEventByIdSchema)
    .query(async ({ ctx, input }) => {
      const auditEvent = await ctx.db.auditEvent.findUnique({
        where: {
          id: input.id
        },
        include: {
          envelope: {
            select: {
              id: true,
              title: true,
              status: true,
              createdBy: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          document: {
            select: {
              id: true,
              name: true,
              type: true,
              size: true
            }
          },
          recipient: {
            select: {
              id: true,
              role: true,
              status: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      if (!auditEvent) {
        throw new Error("Audit event not found")
      }

      return auditEvent
    }),

  // Get audit event statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [totalEvents, recentEvents, eventsByType, todayEvents] =
      await Promise.all([
        ctx.db.auditEvent.count(),
        ctx.db.auditEvent.count({
          where: {
            timestamp: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        }),
        ctx.db.auditEvent.groupBy({
          by: ["eventType"],
          _count: {
            eventType: true
          },
          orderBy: {
            _count: {
              eventType: "desc"
            }
          }
        }),
        ctx.db.auditEvent.count({
          where: {
            timestamp: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
            }
          }
        })
      ])

    return {
      totalEvents,
      recentEvents,
      todayEvents,
      eventsByType: eventsByType.map((item) => ({
        eventType: item.eventType,
        count: item._count.eventType
      }))
    }
  }),

  // Delete a specific audit event by ID
  delete: protectedProcedure
    .input(deleteAuditEventSchema)
    .mutation(async ({ ctx, input }) => {
      const auditEvent = await ctx.db.auditEvent.findUnique({
        where: { id: input.id }
      })

      if (!auditEvent) {
        throw new Error("Audit event not found")
      }

      await ctx.db.auditEvent.delete({
        where: { id: input.id }
      })

      return { success: true, deletedId: input.id }
    }),

  // Delete audit events by type or description (for cleaning up test events)
  deleteByType: protectedProcedure
    .input(deleteAuditEventsByTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const whereClause: Prisma.AuditEventWhereInput = {}

      if (input.eventType) {
        whereClause.eventType = input.eventType as any
      }

      if (input.description) {
        whereClause.description = {
          contains: input.description,
          mode: 'insensitive'
        }
      }

      // Find events to delete first
      const eventsToDelete = await ctx.db.auditEvent.findMany({
        where: whereClause,
        select: { id: true, description: true }
      })

      if (eventsToDelete.length === 0) {
        return { success: true, deletedCount: 0, deletedIds: [] }
      }

      // Delete the events
      await ctx.db.auditEvent.deleteMany({
        where: whereClause
      })

      return {
        success: true,
        deletedCount: eventsToDelete.length,
        deletedIds: eventsToDelete.map(event => event.id)
      }
    })
})
