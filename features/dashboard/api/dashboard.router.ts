import type { Prisma } from "@prisma/client"

import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

import {
  addCommentSchema,
  getDashboardStatsSchema,
  getDocumentByIdSchema,
  getEnvelopeStatusDistributionSchema,
  getPerformanceMetricsSchema,
  getRecentActivitySchema,
  getUserDocumentsSchema,
  getUserStatsSchema,
  sendRemindersSchema
} from "./dashboard.schemas"
import type {
  PendingDocument,
  RecentActivity,
  UserDocument
} from "./dashboard.types"

type DocumentWhereInput = Prisma.DocumentWhereInput

// Helper function to safely convert status to lowercase
const toLowerCaseOrDefault = (
  status: string | null | undefined,
  defaultValue: string
): string => {
  return status ? status.toLowerCase() : defaultValue
}

// Helper function to ensure string value
const ensureString = (
  value: string | null | undefined,
  defaultValue: string
): string => {
  return value ?? defaultValue
}

// Helper function to determine priority based on due date
const determinePriority = (
  expiresAt: Date | null
): "high" | "medium" | "low" => {
  if (!expiresAt) return "medium"
  const now = new Date()
  const daysUntilExpiry = Math.ceil(
    (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysUntilExpiry <= 3) return "high"
  if (daysUntilExpiry <= 7) return "medium"
  return "low"
}

export const dashboardRouter = createTRPCRouter({
  // Get user documents (both created by user and where user is recipient)
  getUserDocuments: protectedProcedure
    .input(getUserDocumentsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { limit, offset } = input

      // Build where condition to include:
      // 1. Documents in envelopes created by the user
      // 2. Documents where the user is a recipient
      const whereCondition: DocumentWhereInput = {
        OR: [
          // Documents in envelopes created by the user
          {
            envelope: {
              userId: userId
            }
          },
          // Documents where the user is a recipient
          {
            recipients: {
              some: {
                userId: userId
              }
            }
          }
        ]
      }

      const documents = await ctx.db.document.findMany({
        where: whereCondition,
        include: {
          envelope: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          recipients: {
            include: {
              user: true
            }
          },
          _count: {
            select: {
              recipients: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: limit,
        skip: offset
      })

      // Transform documents to match UserDocument type
      const transformedDocuments: UserDocument[] = documents.map((doc) => {
        // Find the current user's recipient record
        const userRecipient = doc.recipients.find((r) => r.user?.id === userId)
        const completedSignatures = doc.recipients.filter(
          (r) => r.status === "SIGNED"
        ).length

        // Ensure we have valid strings for required fields
        const sender = ensureString(
          doc.envelope?.createdBy.name ?? doc.envelope?.createdBy.email,
          "Unknown Sender"
        )

        // Determine priority based on due date (use envelope updatedAt as fallback)
        const priority = determinePriority(doc.envelope?.updatedAt ?? null)

        return {
          id: doc.id,
          name: doc.name,
          type: doc.type ?? "application/pdf",
          status: "ready", // Document model doesn't have status, defaulting to ready
          signers: doc._count.recipients,
          completed: completedSignatures,
          createdDate: doc.createdAt.toISOString(),
          dueDate: doc.envelope?.updatedAt?.toISOString() ?? "N/A",
          size: `${Math.round(doc.size / 1024)} KB`,
          sender,
          userRole: toLowerCaseOrDefault(userRecipient?.role, "owner"),
          userStatus: toLowerCaseOrDefault(userRecipient?.status, "n/a"),
          envelopeId: doc.envelope?.id ?? "",
          priority
        }
      })

      return transformedDocuments
    }),

  // Get user statistics
  getUserStats: protectedProcedure
    .input(getUserStatsSchema)
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id

      // Get documents to sign (where user is recipient and hasn't signed yet)
      const documentsToSign = await ctx.db.document.count({
        where: {
          recipients: {
            some: {
              userId: userId,
              status: {
                in: ["PENDING", "PUBLISHED", "VIEWED"]
              }
            }
          },
          envelope: {
            status: "PUBLISHED"
          }
        }
      })

      // Get completed documents (where user is recipient and has signed)
      const completedDocuments = await ctx.db.document.count({
        where: {
          recipients: {
            some: {
              userId: userId,
              status: "SIGNED"
            }
          }
        }
      })

      // Get user verification status (you might need to adjust this based on your auth setup)
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { emailVerified: true }
      })

      return {
        documentsToSign,
        completedDocuments,
        verificationStatus: user?.emailVerified ? "Verified" : "Pending"
      }
    }),

  // Get pending documents for user (documents they need to sign)
  getPendingDocuments: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const pendingDocuments = await ctx.db.document.findMany({
      where: {
        recipients: {
          some: {
            userId: userId,
            status: {
              in: ["PENDING", "PUBLISHED", "VIEWED"]
            }
          }
        },
        envelope: {
          status: "PUBLISHED"
        }
      },
      include: {
        envelope: {
          include: {
            createdBy: {
              select: {
                name: true,
                email: true,
                organization: true
              }
            }
          }
        },
        recipients: {
          where: {
            userId: userId
          },
          select: {
            status: true,
            role: true
          }
        }
      },
      orderBy: {
        envelope: {
          updatedAt: "asc"
        }
      },
      take: 10
    })

    return pendingDocuments.map((doc): PendingDocument => {
      const envelope = doc.envelope
      const creator = envelope?.createdBy

      return {
        id: doc.id,
        name: doc.name,
        sender:
          creator?.organization ??
          creator?.name ??
          creator?.email ??
          "Unknown Sender",
        dueDate:
          envelope?.updatedAt?.toISOString().split("T")[0] ?? "No due date",
        priority:
          envelope?.updatedAt &&
            new Date(envelope.updatedAt) <
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            ? "high"
            : envelope?.updatedAt &&
              new Date(envelope.updatedAt) <
              new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
              ? "medium"
              : "low",
        envelopeId: envelope?.id ?? ""
      }
    })
  }),

  // Get recent activity - now enabled with audit events
  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    // Get recent audit events from the database
    const recentAuditEvents = await ctx.db.auditEvent.findMany({
      orderBy: {
        timestamp: "desc"
      },
      take: 10,
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
            name: true
          }
        }
      }
    })

    return recentAuditEvents.map(
      (event): RecentActivity => ({
        id: event.id,
        type: event.eventType,
        description: event.description,
        timestamp: event.timestamp.toISOString(),
        documentName:
          event.document?.name ?? event.envelope?.title ?? "Unknown Document"
      })
    )
  }),

  // Get document details by envelope ID
  getDocumentById: protectedProcedure
    .input(getDocumentByIdSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { envelopeId } = input

      const envelope = await ctx.db.envelope.findFirst({
        where: {
          id: envelopeId,
          OR: [
            { userId: userId },
            {
              documents: {
                some: {
                  recipients: {
                    some: { userId: userId }
                  }
                }
              }
            }
          ]
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          documents: {
            include: {
              recipients: {
                include: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                      image: true
                    }
                  }
                },
                orderBy: {
                  status: "asc"
                }
              }
            }
          }
        }
      })

      if (!envelope) {
        throw new Error("Document not found or access denied")
      }

      // Transform signers data - collect all recipients from all documents
      const allRecipients = envelope.documents.flatMap((doc) => doc.recipients)

      // Type the recipient object properly
      type RecipientWithUser = (typeof allRecipients)[0]

      const uniqueRecipients = allRecipients.reduce(
        (acc, recipient) => {
          const key = recipient.user?.email ?? recipient.id
          acc[key] ??= recipient
          return acc
        },
        {} as Record<string, RecipientWithUser>
      )

      const signers = Object.values(uniqueRecipients).map((recipient) => ({
        id: recipient.id,
        name: recipient.user?.name ?? "Unknown User",
        email: recipient.user?.email ?? "unknown@email.com",
        status: recipient.status.toLowerCase() as "signed" | "pending",
        signedAt: null, // Recipient model doesn't have signedAt field yet
        avatar: recipient.user?.image ?? "/placeholder.svg",
        role: recipient.role
      }))

      // History is temporarily empty since auditEvents don't exist in the basic Envelope model
      const history: Array<{
        id: string
        action: string
        user: string
        timestamp: string
        eventType: string
      }> = []

      // For now, comments will be empty since we don't have a comments table
      // You can add a comments table later or use audit events as comments
      const comments: Array<{
        id: string
        text: string
        author: string
        timestamp: string
      }> = []

      return {
        id: envelope.id,
        title: envelope.title,
        type: "Document", // Could be derived from document mime type
        status: envelope.status.toLowerCase().replace("_", " "),
        created:
          envelope.createdAt?.toISOString().split("T")[0] ??
          new Date().toISOString().split("T")[0],
        updated:
          envelope.updatedAt?.toISOString().split("T")[0] ??
          envelope.createdAt?.toISOString().split("T")[0] ??
          new Date().toISOString().split("T")[0],
        dueDate:
          envelope.updatedAt?.toISOString().split("T")[0] ?? "No due date", // Using updatedAt as fallback since expiresAt doesn't exist
        description: envelope.description ?? "No description provided", // Using description field
        creator: {
          name: envelope.createdBy.name ?? "Unknown",
          email: envelope.createdBy.email ?? "",
          avatar: envelope.createdBy.image ?? "/placeholder.svg"
        },
        signers,
        history,
        comments,
        documents: await Promise.all(
          envelope.documents.map(async (doc) => {
            // Get document URL using the document ID instead of path
            const publicUrl = `/api/documents/${doc.id}/view`
            return {
              id: doc.id,
              name: doc.name,
              size: doc.size,
              fileUrl: publicUrl, // Use public URL instead of path
              mimeType: doc.type // Using type field since mimeType doesn't exist
            }
          })
        )
      }
    }),

  // Add comment to document (temporarily disabled due to schema migration)
  addComment: protectedProcedure
    .input(addCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { envelopeId } = input
      // const { comment } = input // Commented out until comments are implemented

      // Verify user has access to this envelope
      const envelope = await ctx.db.envelope.findFirst({
        where: {
          id: envelopeId,
          OR: [
            { userId: userId },
            {
              documents: {
                some: {
                  recipients: {
                    some: { userId: userId }
                  }
                }
              }
            }
          ]
        }
      })

      if (!envelope) {
        throw new Error("Document not found or access denied")
      }

      // Comments functionality is temporarily disabled due to schema migration
      // This would require creating an AuditEvent entry once that table is available
      return { success: true }
    }),

  // Send reminders to pending signers
  sendReminders: protectedProcedure
    .input(sendRemindersSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { envelopeId } = input

      // Verify user is the creator of this envelope
      const envelope = await ctx.db.envelope.findFirst({
        where: {
          id: envelopeId,
          userId: userId
        },
        include: {
          documents: {
            include: {
              recipients: {
                where: {
                  status: {
                    in: ["PENDING", "PUBLISHED", "VIEWED"]
                  }
                }
              }
            }
          }
        }
      })

      if (!envelope) {
        throw new Error("Document not found or access denied")
      }

      // Count total pending recipients across all documents
      const pendingRecipients = envelope.documents.flatMap(
        (doc) => doc.recipients
      )

      // Reminder functionality is temporarily simplified due to schema migration
      // TODO: Implement actual email sending logic here and create audit events
      // For now, just return success

      return {
        success: true,
        remindersSent: pendingRecipients.length
      }
    }),

  getDashboardStats: protectedProcedure
    .input(getDashboardStatsSchema)
    .query(async ({ ctx, input }) => {
      const { timeframe = "month" } = input

      // Calculate date range based on timeframe
      const endDate = new Date()
      const startDate = new Date()

      switch (timeframe) {
        case "week":
          startDate.setDate(startDate.getDate() - 7)
          break
        case "month":
          startDate.setDate(startDate.getDate() - 30)
          break
        case "quarter":
          startDate.setDate(startDate.getDate() - 90)
          break
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }

      const [
        totalEnvelopes,
        totalRecipients,
        totalDocuments,
        signedDocumentsCount,
        envelopesInPeriod
      ] = await Promise.all([
        // Count ALL envelopes in the database, not just user's
        ctx.db.envelope.count(),
        // Count ALL recipients in the database
        ctx.db.recipient.count(),
        // Count only original documents (exclude _signed versions)
        ctx.db.document.count({
          where: {
            NOT: {
              name: {
                contains: "_signed"
              }
            }
          }
        }),
        // Count documents that have signed versions
        ctx.db.document.count({
          where: {
            name: {
              contains: "_signed"
            }
          }
        }),
        // Count envelopes created in the specified timeframe (all users)
        ctx.db.envelope.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        })
      ])

      const completionRate = totalDocuments > 0
        ? (signedDocumentsCount / totalDocuments) * 100
        : 0

      return {
        totalEnvelopes,
        totalRecipients,
        totalDocuments,
        completionRate: Math.round(completionRate * 100) / 100, // Round to 2 decimal places
        trendsData: {
          envelopesThisPeriod: envelopesInPeriod
        }
      }
    }),

  getEnvelopeStatusDistribution: protectedProcedure
    .input(getEnvelopeStatusDistributionSchema)
    .query(async ({ ctx, input }) => {
      const { timeframe = "month" } = input

      const endDate = new Date()
      const startDate = new Date()

      switch (timeframe) {
        case "week":
          startDate.setDate(startDate.getDate() - 7)
          break
        case "month":
          startDate.setDate(startDate.getDate() - 30)
          break
        case "quarter":
          startDate.setDate(startDate.getDate() - 90)
          break
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }

      const statusCounts = await ctx.db.envelope.groupBy({
        by: ["status"],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: {
          status: true
        }
      })

      return statusCounts.map((item) => ({
        status: item.status,
        count: item._count.status
      }))
    }),

  getDashboardActivity: protectedProcedure
    .input(getRecentActivitySchema)
    .query(async ({ ctx, input }) => {
      const { limit = 10, offset = 0, eventType, timeframe = "all", startDate, endDate } = input

      // Build date filter based on timeframe
      let dateFilter = {}
      if (timeframe !== "all") {
        const now = new Date()
        let filterStartDate = new Date()
        let filterEndDate = now

        if (timeframe === "custom" && startDate && endDate) {
          // Use custom date range
          filterStartDate = new Date(startDate)
          filterEndDate = new Date(endDate)
          // Set time to start of day for start date and end of day for end date
          filterStartDate.setHours(0, 0, 0, 0)
          filterEndDate.setHours(23, 59, 59, 999)
        } else {
          // Use predefined timeframes
          switch (timeframe) {
            case "today":
              filterStartDate.setHours(0, 0, 0, 0)
              break
            case "week":
              filterStartDate.setDate(now.getDate() - 7)
              break
            case "month":
              filterStartDate.setDate(now.getDate() - 30)
              break
          }
        }

        dateFilter = {
          timestamp: {
            gte: filterStartDate,
            lte: filterEndDate
          }
        }
      }

      // Build event type filter
      let eventTypeFilter = {}
      if (eventType && eventType !== "all") {
        eventTypeFilter = {
          eventType: eventType
        }
      }

      // Debug logging
      console.log('Dashboard Activity Query Debug:', {
        eventType,
        timeframe,
        startDate,
        endDate,
        dateFilter,
        eventTypeFilter,
        limit,
        offset
      })

      // Get recent audit events from the database
      const recentAuditEvents = await ctx.db.auditEvent.findMany({
        where: {
          ...dateFilter,
          ...eventTypeFilter
        },
        orderBy: {
          timestamp: "desc"
        },
        take: limit,
        skip: offset,
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
              name: true
            }
          },
          recipient: {
            select: {
              id: true,
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

      console.log('Query Results:', {
        foundEvents: recentAuditEvents.length,
        eventTypes: recentAuditEvents.map(e => e.eventType)
      })

      // Debug: Check if there are ANY audit events in the database
      const totalAuditEvents = await ctx.db.auditEvent.count()
      const allEventTypes = await ctx.db.auditEvent.findMany({
        select: { eventType: true },
        distinct: ['eventType']
      })

      console.log('Database Debug:', {
        totalAuditEvents,
        availableEventTypes: allEventTypes.map(e => e.eventType)
      })

      // Get total count for pagination
      const totalCount = await ctx.db.auditEvent.count({
        where: {
          ...dateFilter,
          ...eventTypeFilter
        }
      })

      return {
        activities: recentAuditEvents.map((event) => ({
          id: event.id,
          title: event.description,
          status: event.eventType,
          createdAt: event.timestamp,
          updatedAt: event.timestamp,
          recipientCount: event.recipient ? 1 : 0,
          documentCount: event.document ? 1 : 0
        })),
        totalCount,
        hasMore: offset + limit < totalCount
      }
    }),

  getPerformanceMetrics: protectedProcedure
    .input(getPerformanceMetricsSchema)
    .query(async ({ ctx, input }) => {
      const { timeframe = "month" } = input

      const endDate = new Date()
      const startDate = new Date()

      switch (timeframe) {
        case "week":
          startDate.setDate(startDate.getDate() - 7)
          break
        case "month":
          startDate.setDate(startDate.getDate() - 30)
          break
        case "quarter":
          startDate.setDate(startDate.getDate() - 90)
          break
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }

      const [totalEnvelopes, completedEnvelopes] = await Promise.all([
        // Count ALL envelopes in the timeframe, not just user's
        ctx.db.envelope.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        // Count ALL completed envelopes in the timeframe
        ctx.db.envelope.count({
          where: {
            status: "COMPLETED",
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        })
      ])

      const completionRate =
        totalEnvelopes > 0 ? (completedEnvelopes / totalEnvelopes) * 100 : 0

      return {
        totalEnvelopes,
        completedEnvelopes,
        completionRate,
        avgTimeToComplete: 3.5 // Placeholder - would need actual time calculation
      }
    }),

  // Get detailed admin statistics
  getAdminStats: protectedProcedure.query(async ({ ctx }) => {
    const [
      totalEnvelopes,
      totalRecipients,
      totalDocuments,
      signedDocumentsCount,
      envelopesByStatus,
      recentEnvelopes,
      totalUsers
    ] = await Promise.all([
      // Total envelopes
      ctx.db.envelope.count(),
      // Total recipients
      ctx.db.recipient.count(),
      // Original documents only (exclude _signed)
      ctx.db.document.count({
        where: {
          NOT: {
            name: {
              contains: "_signed"
            }
          }
        }
      }),
      // Signed documents count
      ctx.db.document.count({
        where: {
          name: {
            contains: "_signed"
          }
        }
      }),
      // Envelopes grouped by status
      ctx.db.envelope.groupBy({
        by: ["status"],
        _count: {
          status: true
        }
      }),
      // Recent envelopes (last 7 days)
      ctx.db.envelope.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Total users
      ctx.db.user.count()
    ])

    // Calculate completion rate
    const completionRate = totalDocuments > 0
      ? (signedDocumentsCount / totalDocuments) * 100
      : 0

    // Format envelope status distribution
    const statusDistribution = envelopesByStatus.map(item => ({
      status: item.status,
      count: item._count.status
    }))

    return {
      totalEnvelopes,
      totalRecipients,
      totalDocuments,
      signedDocumentsCount,
      completionRate: Math.round(completionRate * 100) / 100,
      statusDistribution,
      recentEnvelopes,
      totalUsers,
      unsignedDocuments: totalDocuments - signedDocumentsCount
    }
  })
})
