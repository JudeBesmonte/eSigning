import EventEmitter from "events"
import {
	Prisma,
	PrismaClient,
	type AuditEvent,
	type Envelope,
	type User
} from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { observable } from "@trpc/server/observable"
import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

import {
	createNotaryBookEntrySchema,
	listNotaryBookEntriesSchema,
	notaryBookEntryIdSchema
} from "./notary.schema"

// Create a simple event emitter for pubsub
const ee = new EventEmitter()
ee.setMaxListeners(100) // Increase max listeners to avoid memory leak warnings

// Extend the Prisma Client to include the notaryBook model
declare global {
	var prisma: PrismaClient | undefined
}

const prisma =
	global.prisma ??
	new PrismaClient({
		log: ["query", "error", "warn"]
	})

if (process.env.NODE_ENV !== "production") {
	global.prisma = prisma
}

// Export the prisma instance for use in procedures
export const db = prisma

interface MonthData {
	id: string
	name: string
	year: number
	envelopeCount: number
	bgColor: string
}

interface NotaryBookWithRelations {
	id: string
	entryType: string
	title: string
	description: string | null
	metadata: Prisma.JsonValue | null
	envelopeId: string | null
	auditEventId: string | null
	createdById: string
	createdAt: Date
	updatedAt: Date
	entryDate: Date
	envelope?: Envelope | null
	auditEvent?: AuditEvent | null
	createdBy: Pick<User, "id" | "name" | "email">
}

const monthNames = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
] as const

function getMonthData(
	monthIndex: number,
	year: number,
	count: number
): MonthData {
	// Ensure monthIndex is within valid range (0-11)
	const safeMonthIndex = Math.max(0, Math.min(11, monthIndex))
	const monthName = monthNames[safeMonthIndex] ?? "Unknown"

	return {
		id: `${year}-${String(safeMonthIndex + 1).padStart(2, "0")}`,
		name: monthName,
		year,
		envelopeCount: count,
		bgColor: `hsl(${(safeMonthIndex * 30) % 360}, 70%, 85%)`
	}
}

// Helper function to sync envelope data to NotaryBook
async function syncEnvelopesToNotaryBook(userId: string) {
	// Find all envelopes that don't have a corresponding NotaryBook entry
	const envelopes = await db.envelope.findMany({
		where: {
			notaryBookEntries: {
				none: {}
			}
		},
		include: {
			documents: true,
			auditEvents: true
		}
	})

	if (envelopes.length === 0) {
		return []
	}

	// Create NotaryBook entries for each envelope
	const createdEntries = await Promise.all(
		envelopes.map((envelope) =>
			db.notaryBook.create({
				data: {
					entryType: "ENVELOPE",
					title: `Envelope: ${envelope.title || envelope.id}`,
					description: `Envelope created on ${envelope.createdAt.toISOString()}`,
					envelopeId: envelope.id,
					createdById: userId,
					entryDate: envelope.createdAt,
					metadata: {
						status: envelope.status,
						documentCount: envelope.documents.length,
						auditEventCount: envelope.auditEvents.length
					}
				},
				include: {
					envelope: true,
					createdBy: {
						select: { id: true, name: true, email: true }
					}
				}
			})
		)
	)

	return createdEntries
}

// Helper function to sync audit events to NotaryBook
async function syncAuditEventsToNotaryBook(userId: string) {
	try {
		// Find all audit events that don't have a corresponding NotaryBook entry
		const auditEvents = await db.auditEvent.findMany({
			where: {
				// Check for audit events that don't have a related NotaryBook entry
				NOT: {
					notaryBookEntries: { some: {} }
				},
				// Only sync certain types of audit events
				eventType: {
					in: [
						"ENVELOPE_CREATED",
						"ENVELOPE_COMPLETED",
						"DOCUMENT_SIGNED",
						"ENVELOPE_VIEWED"
					]
				}
			},
			include: {
				envelope: true
			}
		})

		if (auditEvents.length === 0) {
			return []
		}

		// Create NotaryBook entries for each audit event
		const createdEntries = await Promise.all(
			auditEvents.map((event) =>
				db.notaryBook.create({
					data: {
						entryType: "AUDIT_EVENT",
						title: `Event: ${event.eventType}`,
						description: event.description || `Audit event: ${event.eventType}`,
						auditEventId: event.id,
						envelopeId: event.envelopeId ?? undefined,
						createdById: userId, // Using the provided userId as the creator
						entryDate: event.timestamp,
						metadata: {
							eventType: event.eventType,
							userEmail: event.userEmail ?? null,
							userName: event.userName ?? null,
							ipAddress: event.ipAddress ?? null,
							userAgent: event.userAgent ?? null,
							...(event.metadata as object)
						}
					},
					include: {
						auditEvent: true,
						envelope: true,
						createdBy: {
							select: { id: true, name: true, email: true }
						}
					}
				})
			)
		)

		return createdEntries
	} catch (error) {
		console.error("Error syncing audit events to notary book:", error)
		throw new Error("Failed to sync audit events to notary book")
	}
}

export const notaryBookRouter = createTRPCRouter({
	// Subscribe to notary book updates
	onUpdate: protectedProcedure.subscription(() => {
		return observable<{ type: "update" }>((emit) => {
			const onUpdate = () => emit.next({ type: "update" })

			ee.on("notaryBook:update", onUpdate)

			// Cleanup subscription on client disconnect
			return () => {
				ee.off("notaryBook:update", onUpdate)
			}
		})
	}),

	// Manually trigger a sync and notify subscribers
	triggerUpdate: protectedProcedure.mutation(async ({ ctx: _ctx }) => {
		try {
			// Emit update event to notify all subscribers
			ee.emit("notaryBook:update", { type: "update" })
			return { success: true }
		} catch (error) {
			console.error("Error triggering update:", error)
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to trigger update"
			})
		}
	}),

	// Publish an update to all subscribers
	publishUpdate: protectedProcedure.mutation(() => {
		ee.emit("notaryBook:update")
		return { success: true }
	}),

	// Sync data from Envelope and AuditEvent tables to NotaryBook
	syncNotaryBook: protectedProcedure.mutation(async ({ ctx }) => {
		try {
			const [envelopeEntries, auditEntries] = await Promise.all([
				syncEnvelopesToNotaryBook(ctx.session.user.id),
				syncAuditEventsToNotaryBook(ctx.session.user.id)
			])

			// Emit update event after successful sync
			if (envelopeEntries.length > 0 || auditEntries.length > 0) {
				ee.emit("notaryBook:update", { type: "update" })
			}

			return {
				success: true,
				envelopeEntries: envelopeEntries.length,
				auditEntries: auditEntries.length
			}
		} catch (error) {
			console.error("Error syncing notary book:", error)
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to sync notary book"
			})
		}
	}),

	// Get all notary book entries
	getNotaryBookEntries: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).optional().default(50),
				cursor: z.string().optional(),
				entryType: z
					.enum([
						"ENVELOPE",
						"AUDIT_EVENT",
						"DOCUMENT",
						"SIGNATURE",
						"NOTARIZATION"
					])
					.optional()
			})
		)
		.query(async ({ input, ctx: _ctx }) => {
			const { limit, cursor, entryType } = input

			const entries = await db.notaryBook.findMany({
				take: limit + 1, // Get one extra for the cursor
				where: entryType ? { entryType } : {},
				cursor: cursor ? { id: cursor } : undefined,
				orderBy: {
					entryDate: "desc"
				},
				include: {
					envelope: {
						include: {
							documents: {
								include: {
									recipients: {
										include: {
											user: true
										}
									}
								}
							}
						}
					},
					auditEvent: true,
					createdBy: {
						select: { id: true, name: true, email: true }
					}
				}
			})

			let nextCursor: string | undefined = undefined
			if (entries.length > limit) {
				const nextItem = entries.pop()
				nextCursor = nextItem?.id
			}

			return {
				entries,
				nextCursor
			}
		}),

	// Get months with envelope counts for the notary book
	getMonths: protectedProcedure
		.input(
			z.object({
				year: z.number().optional()
			})
		)
		.query(async ({ input }) => {
			const currentYear = new Date().getFullYear()
			const year = input.year ?? currentYear

			// Get the first and last day of the year
			const startDate = new Date(year, 0, 1)
			const endDate = new Date(year, 11, 31, 23, 59, 59)

			try {
				// Get envelope counts by month for the year using raw SQL
				const monthCounts: { month: number; count: number }[] =
					await prisma.$queryRaw`
          SELECT 
            EXTRACT(MONTH FROM "createdAt")::int as month,
            COUNT(*)::int as count
          FROM "Envelope"
          WHERE "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
          GROUP BY EXTRACT(MONTH FROM "createdAt")
          ORDER BY month
        `

				// Initialize all months with count 0
				const monthData = Array.from({ length: 12 }, (_, index) => ({
					month: index + 1,
					count: 0
				}))

				// Update counts for months that have envelopes
				monthCounts.forEach(({ month, count }) => {
					const monthIndex = Math.max(0, Math.min(11, month - 1)) // Convert to 0-based index
					;(monthData[monthIndex] as { month: number; count: number }).count =
						count
				})

				// Create month data objects
				return monthData.map(
					({ month, count }) => getMonthData(month - 1, year, count) // Convert back to 0-based for getMonthData
				)
			} catch (error) {
				console.error("Error fetching months data:", error)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch months data"
				})
			}
		}),

	// Get envelopes for a specific month
	getEnvelopesByMonth: protectedProcedure
		.input(
			z.object({
				month: z
					.string()
					.regex(
						/^(\d{4})-(0[1-9]|1[0-2])$/,
						"Month must be in YYYY-MM format (e.g., 2023-01)"
					)
			})
		)
		.query(async ({ ctx, input }) => {
			try {
				// The regex ensures the format is correct
				const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(input.month)
				if (!match) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message:
							"Invalid month format. Must be in YYYY-MM format (e.g., 2023-01)"
					})
				}

				// Extract year and month from the regex match
				// We can safely assert these as strings because the regex ensures they exist
				const year = parseInt(match[1]!, 10)
				const month = parseInt(match[2]!, 10)

				// Additional validation
				if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message:
							"Invalid month values. Year must be a valid year and month must be between 01-12"
					})
				}

				// Create dates with explicit UTC to avoid timezone issues
				const startDate = new Date(Date.UTC(year, month - 1, 1))
				const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

				const envelopes = await ctx.db.envelope.findMany({
					where: {
						createdAt: {
							gte: startDate,
							lte: endDate
						}
					},
					include: {
						documents: {
							select: {
								id: true,
								name: true,
								path: true,
								createdAt: true,
								updatedAt: true
							}
						},
						auditEvents: {
							orderBy: {
								timestamp: "desc"
							},
							take: 1, // Get only the most recent audit event
							select: {
								id: true,
								eventType: true,
								description: true,
								timestamp: true,
								userEmail: true,
								userName: true
							}
						}
					},
					orderBy: {
						createdAt: "desc"
					}
				})

				return envelopes
			} catch (error) {
				console.error("Error fetching envelopes by month:", error)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch envelopes"
				})
			}
		}),

	// Get all notary book entries
	getAll: protectedProcedure.query(async () => {
		try {
			// Use Prisma's query builder for type safety
			const entries = (await prisma.notaryBook.findMany({
				include: {
					envelope: true,
					auditEvent: true,
					createdBy: {
						select: {
							id: true,
							name: true,
							email: true
						}
					}
				},
				orderBy: {
					entryDate: "desc"
				}
			})) as unknown as NotaryBookWithRelations[]

			return entries || []
		} catch (error) {
			console.error("Error fetching notary book entries:", error)
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch notary book entries"
			})
		}
	}),

	// Get documents for a specific envelope
	getDocumentsByEnvelope: protectedProcedure
		.input(
			z.object({
				envelopeId: z.string().min(1, "Envelope ID is required")
			})
		)
		.query(async ({ ctx, input }) => {
			try {
				const documents = await ctx.db.document.findMany({
					where: {
						envelopeId: input.envelopeId
					},
					select: {
						id: true,
						name: true,
						path: true,
						createdAt: true,
						updatedAt: true,
						recipients: {
							select: {
								id: true,
								role: true,
								status: true,
								user: {
									select: {
										email: true
									}
								}
							}
						}
					},
					orderBy: {
						createdAt: "asc"
					}
				})

				if (!documents || documents.length === 0) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "No documents found for this envelope"
					})
				}

				return documents
			} catch (error) {
				console.error("Error fetching documents by envelope:", error)

				if (error instanceof TRPCError) {
					throw error
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch documents"
				})
			}
		}),

	// Get audit events for a specific envelope
	getAuditEventsByEnvelope: protectedProcedure
		.input(
			z.object({
				envelopeId: z.string().min(1, "Envelope ID is required")
			})
		)
		.query(async ({ ctx, input }) => {
			try {
				const auditEvents = await ctx.db.auditEvent.findMany({
					where: {
						envelopeId: input.envelopeId
					},
					select: {
						id: true,
						eventType: true,
						description: true,
						timestamp: true,
						ipAddress: true,
						userAgent: true,
						userEmail: true,
						userName: true
					},
					orderBy: {
						timestamp: "desc"
					}
				})

				if (!auditEvents || auditEvents.length === 0) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "No audit events found for this envelope"
					})
				}

				return auditEvents
			} catch (error) {
				console.error("Error fetching audit events by envelope:", error)

				if (error instanceof TRPCError) {
					throw error
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch audit events"
				})
			}
		}),

	// Create a new notary book entry
	create: protectedProcedure
		.input(createNotaryBookEntrySchema)
		.mutation(async ({ ctx, input }) => {
			try {
				// Verify the user has permission to create notary book entries
				if (
					ctx.session.user.role !== "ADMIN" &&
					ctx.session.user.role !== "SUPER_ADMIN"
				) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You do not have permission to create notary book entries"
					})
				}

				// Prepare the entry data
				const entryData = {
					entryType: input.entryType,
					title: input.title,
					description: input.description ?? null,
					metadata: input.metadata ?? {},
					envelopeId: input.envelopeId ?? null,
					auditEventId: input.auditEventId ?? null,
					createdById: ctx.session.user.id,
					entryDate: input.entryDate ?? new Date(),
					createdAt: new Date(),
					updatedAt: new Date()
				}

				// Use raw SQL to insert the new entry
				const result = await prisma.$queryRaw<NotaryBookWithRelations[]>`
          WITH inserted AS (
            INSERT INTO "NotaryBook" (
              "entryType",
              "title",
              "description",
              "metadata",
              "envelopeId",
              "auditEventId",
              "createdById",
              "entryDate",
              "createdAt",
              "updatedAt"
            ) VALUES (
              ${entryData.entryType},
              ${entryData.title},
              ${entryData.description},
              ${entryData.metadata}::jsonb,
              ${entryData.envelopeId},
              ${entryData.auditEventId},
              ${entryData.createdById},
              ${entryData.entryDate},
              ${entryData.createdAt},
              ${entryData.updatedAt}
            )
            RETURNING *
          )
          SELECT 
            i.*,
            json_build_object(
              'id', u.id,
              'name', u.name,
              'email', u.email
            ) as "createdBy",
            CASE 
              WHEN i."envelopeId" IS NOT NULL THEN (
                SELECT to_jsonb(e.*) 
                FROM "Envelope" e 
                WHERE e.id = i."envelopeId"
              )
              ELSE NULL 
            END as envelope,
            CASE 
              WHEN i."auditEventId" IS NOT NULL THEN (
                SELECT to_jsonb(ae.*) 
                FROM "AuditEvent" ae 
                WHERE ae.id = i."auditEventId"
              )
              ELSE NULL 
            END as "auditEvent"
          FROM inserted i
          LEFT JOIN "User" u ON i."createdById" = u.id
        `

				const entry = result?.[0]
				if (!entry) {
					throw new Error("Failed to create notary book entry")
				}

				return entry
			} catch (error) {
				console.error("Error creating notary book entry:", error)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create notary book entry"
				})
			}
		}),

	// Get a notary book entry by ID
	getById: protectedProcedure
		.input(
			z.object({
				id: z.string().min(1, "ID is required")
			})
		)
		.query(async ({ ctx: _ctx, input }) => {
			try {
				const entry = await prisma.notaryBook.findUnique({
					where: { id: input.id },
					include: {
						envelope: true,
						auditEvent: true,
						createdBy: {
							select: { id: true, name: true, email: true }
						}
					}
				})

				if (!entry) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Notary book entry not found"
					})
				}

				return entry as NotaryBookWithRelations
			} catch (error) {
				console.error("Error fetching notary book entry:", error)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch notary book entry"
				})
			}
		}),

	// List all notary book entries with pagination and filtering
	list: protectedProcedure
		.input(listNotaryBookEntriesSchema)
		.query(async ({ ctx: _ctx, input }) => {
			const {
				skip = 0,
				take = 10,
				entryType,
				envelopeId,
				auditEventId,
				startDate,
				endDate
			} = input

			// Build the WHERE clause dynamically based on input
			const whereClauses: string[] = []
			const params: (string | Date | number)[] = []
			let paramIndex = 1

			if (entryType) {
				whereClauses.push(`nb."entryType" = $${paramIndex}`)
				params.push(entryType)
				paramIndex++
			}

			if (envelopeId) {
				whereClauses.push(`nb."envelopeId" = $${paramIndex}`)
				params.push(envelopeId)
				paramIndex++
			}

			if (auditEventId) {
				whereClauses.push(`nb."auditEventId" = $${paramIndex}`)
				params.push(auditEventId)
				paramIndex++
			}

			if (startDate) {
				whereClauses.push(`nb."entryDate" >= $${paramIndex}`)
				params.push(startDate)
				paramIndex++
			}

			if (endDate) {
				whereClauses.push(`nb."entryDate" <= $${paramIndex}`)
				params.push(endDate)
				paramIndex++
			}

			const whereClause =
				whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""

			try {
				// Get total count
				const countResult = await prisma.$queryRaw<{ count: string }[]>`
          SELECT COUNT(*)::text as count 
          FROM "NotaryBook" nb
          ${whereClause ? Prisma.sql([whereClause]) : Prisma.empty}
        `

				const total = parseInt(countResult[0]?.count ?? "0", 10)

				// Get paginated items
				const items = await prisma.$queryRaw<NotaryBookWithRelations[]>`
          SELECT 
            nb.*,
            json_build_object(
              'id', u.id,
              'name', u.name,
              'email', u.email
            ) as "createdBy",
            CASE 
              WHEN nb."envelopeId" IS NOT NULL THEN (
                SELECT json_build_object(
                  'id', e.id,
                  'title', e.title,
                  'status', e.status
                )
                FROM "Envelope" e 
                WHERE e.id = nb."envelopeId"
              )
              ELSE NULL 
            END as envelope,
            CASE 
              WHEN nb."auditEventId" IS NOT NULL THEN (
                SELECT json_build_object(
                  'id', ae.id,
                  'eventType', ae."eventType",
                  'timestamp', ae.timestamp
                )
                FROM "AuditEvent" ae 
                WHERE ae.id = nb."auditEventId"
              )
              ELSE NULL 
            END as "auditEvent"
          FROM "NotaryBook" nb
          LEFT JOIN "User" u ON nb."createdById" = u.id
          ${whereClause ? Prisma.sql([whereClause]) : Prisma.empty}
          ORDER BY nb."entryDate" DESC
          LIMIT ${take} OFFSET ${skip}
        `

				return { total, items }
			} catch (error) {
				console.error("Error listing notary book entries:", error)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to list notary book entries"
				})
			}
		}),

	// Delete a notary book entry (soft delete via metadata)
	delete: protectedProcedure
		.input(notaryBookEntryIdSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				// Check if entry exists and user has permission
				const [entry] = await prisma.$queryRaw<
					{ id: string; createdById: string }[]
				>`
          SELECT id, "createdById" 
          FROM "NotaryBook" 
          WHERE id = ${input.id}
        `

				if (!entry) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Notary book entry not found"
					})
				}

				// Verify permissions
				if (
					ctx.session.user.role !== "ADMIN" &&
					entry.createdById !== ctx.session.user.id
				) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You don't have permission to delete this entry"
					})
				}

				// Soft delete by updating metadata
				const [deletedEntry] = await prisma.$queryRaw<
					NotaryBookWithRelations[]
				>`
          WITH updated AS (
            UPDATE "NotaryBook"
            SET 
              "metadata" = COALESCE("metadata"::jsonb, '{}'::jsonb) || jsonb_build_object(
                'deletedAt', to_jsonb(now() at time zone 'utc'),
                'deletedBy', ${ctx.session.user.id}
              )
            WHERE id = ${input.id}
            RETURNING *
          )
          SELECT 
            u.*,
            json_build_object(
              'id', u2.id,
              'name', u2.name,
              'email', u2.email
            ) as "createdBy",
            CASE 
              WHEN u."envelopeId" IS NOT NULL THEN (
                SELECT to_jsonb(e.*) 
                FROM "Envelope" e 
                WHERE e.id = u."envelopeId"
              )
              ELSE NULL 
            END as envelope,
            CASE 
              WHEN u."auditEventId" IS NOT NULL THEN (
                SELECT to_jsonb(ae.*) 
                FROM "AuditEvent" ae 
                WHERE ae.id = u."auditEventId"
              )
              ELSE NULL 
            END as "auditEvent"
          FROM updated u
          LEFT JOIN "User" u2 ON u."createdById" = u2.id
        `

				if (!deletedEntry) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to delete notary book entry"
					})
				}

				return deletedEntry
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error
				}
				console.error("Error deleting notary book entry:", error)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete notary book entry"
				})
			}
		})
})
