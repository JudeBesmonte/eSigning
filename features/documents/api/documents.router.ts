import type { Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server"

import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

import type { UserDocument } from "@/features/dashboard/api/dashboard.types"

import {
	addCommentSchema,
	deleteDocumentSchema,
	downloadDocumentSchema,
	getDocumentByIdSchema,
	getUserDocumentsSchema,
	sendRemindersSchema
} from "./documents.schemas"

type DocumentWhereInput = Prisma.DocumentWhereInput

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

export const documentsRouter = createTRPCRouter({
	// Get documents owned by the user (all documents in envelopes created by the user)
	getUserSharedDocuments: protectedProcedure
		.input(getUserDocumentsSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id
			const { limit, offset, status } = input

			// Query documents in envelopes where the user is the owner/creator
			const whereCondition: DocumentWhereInput = {
				envelope: {
					userId: userId
				}
			}

			// Only exclude signed documents if status is not "all"
			if (status !== "all") {
				whereCondition.NOT = {
					name: {
						contains: "_signed.pdf"
					}
				}
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
				// Calculate signature completion stats
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

				// Since user is the owner, set appropriate role and status
				const userRole = "owner"
				const userStatus = "owner"

				// Document status based on envelope status or signature completion
				let documentStatus = "pending"
				if (doc.envelope?.status === "COMPLETED") {
					documentStatus = "completed"
				} else if (doc.envelope?.status === "PUBLISHED") {
					documentStatus = "published"
				} else if (doc.envelope?.status === "DRAFT") {
					documentStatus = "draft"
				}

				return {
					id: doc.id,
					name: doc.name,
					type: doc.type ?? "application/pdf",
					status: documentStatus,
					signers: doc._count.recipients,
					completed: completedSignatures,
					createdDate: doc.createdAt.toISOString(),
					dueDate: doc.envelope?.updatedAt?.toISOString() ?? "N/A",
					size: `${Math.round(doc.size / 1024)} KB`,
					sender,
					userRole,
					userStatus,
					envelopeId: doc.envelope?.id ?? "",
					priority
				}
			})

			return {
				documents: transformedDocuments,
				total: transformedDocuments.length
			}
		}),

	// Get document details by document ID
	getDocumentById: protectedProcedure
		.input(getDocumentByIdSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id
			const { documentId } = input

			// Check if the document exists at all
			const documentExists = await ctx.db.document.findUnique({
				where: { id: documentId },
				select: {
					id: true,
					name: true,
					path: true,
					envelopeId: true,
					envelope: {
						select: {
							id: true,
							userId: true
						}
					},
					recipients: {
						select: {
							id: true,
							userId: true,
							role: true,
							status: true,
							user: {
								select: {
									id: true,
									email: true
								}
							}
						}
					}
				}
			})

			if (!documentExists) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Document with ID ${documentId} not found`
				})
			}

			// Use a simpler access check - just check if user owns envelope OR is a recipient
			const document = await ctx.db.document.findFirst({
				where: {
					id: documentId,
					OR: [
						// User owns the envelope
						{ envelope: { userId: userId } },
						// User is a direct recipient of this specific document
						{
							recipients: {
								some: { userId: userId }
							}
						}
					]
				},
				include: {
					envelope: {
						include: {
							createdBy: {
								select: {
									id: true,
									name: true,
									email: true,
									image: true
								}
							}
						}
					},
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
					},
					signedDoc: true
				}
			})

			if (!document) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document not found or access denied"
				})
			}

			// Get document URL using the document ID instead of path
			const displayDocument = document.signedDoc ?? document
			const publicUrl = `/api/documents/${displayDocument.id}/view`

			// Transform signers data
			const signers = document.recipients.map((recipient) => ({
				id: recipient.id,
				name: recipient.user?.name ?? "Unknown User",
				email: recipient.user?.email ?? "unknown@email.com",
				status: recipient.status.toLowerCase() as "signed" | "pending",
				signedAt: null, // Recipient model doesn't have signedAt field yet
				avatar: recipient.user?.image ?? "/placeholder.svg",
				role: recipient.role
			}))

			// Mock history and comments for now
			const history = [
				{
					id: crypto.randomUUID(),
					action: "Document uploaded",
					user: document.envelope?.createdBy.name ?? "Unknown",
					timestamp: document.createdAt.toISOString(),
					eventType: "DOCUMENT_UPLOADED"
				}
			]

			const comments: Array<{
				id: string
				text: string
				author: string
				timestamp: string
				avatar?: string
			}> = [] // Empty for now

			return {
				id: document.id,
				title: document.name,
				type: document.type ?? "application/pdf",
				status: document.envelope?.status.toLowerCase() ?? "draft",
				created: document.createdAt.toISOString(),
				updated: document.updatedAt?.toISOString(),
				dueDate:
					document.envelope?.updatedAt?.toISOString().split("T")[0] ??
					"No due date",
				description: `Document: ${document.name}`,
				creator: {
					name: document.envelope?.createdBy.name ?? "Unknown",
					email: document.envelope?.createdBy.email ?? "",
					avatar: document.envelope?.createdBy.image ?? "/placeholder.svg"
				},
				signers,
				history,
				comments,
				documents: [
					{
						id: document.id,
						name: document.name,
						size: document.size,
						fileUrl: publicUrl,
						mimeType: document.type ?? "application/pdf"
					}
				]
			}
		}),

	// Add comment to document
	addComment: protectedProcedure
		.input(addCommentSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id
			const { documentId } = input

			// Verify user has access to this document
			const document = await ctx.db.document.findFirst({
				where: {
					id: documentId,
					OR: [
						{ envelope: { userId: userId } },
						{
							envelope: {
								documents: {
									some: {
										recipients: {
											some: { userId: userId }
										}
									}
								}
							}
						}
					]
				}
			})

			if (!document) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document not found or access denied"
				})
			}

			// Comments functionality is temporarily disabled due to schema migration
			// This would require creating an AuditEvent entry once that table is available
			return { success: true }
		}),

	// Send reminders for document signers
	sendReminders: protectedProcedure
		.input(sendRemindersSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id
			const { documentId } = input

			// Verify user is the creator of the envelope containing this document
			const document = await ctx.db.document.findFirst({
				where: {
					id: documentId,
					envelope: { userId: userId }
				},
				include: {
					recipients: {
						where: {
							status: {
								in: ["PENDING", "PUBLISHED", "VIEWED"]
							}
						}
					}
				}
			})

			if (!document) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document not found or access denied"
				})
			}

			// Reminder functionality is temporarily simplified due to schema migration
			// TODO: Implement actual email sending logic here and create audit events
			return {
				success: true,
				remindersSent: document.recipients.length
			}
		}),

	// Delete a document (only if user is the envelope creator)
	deleteDocument: protectedProcedure
		.input(deleteDocumentSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id
			const { documentId } = input

			// Check if user owns the envelope containing this document
			const document = await ctx.db.document.findUnique({
				where: { id: documentId },
				include: {
					envelope: true
				}
			})

			if (!document) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document not found"
				})
			}

			if (document.envelope?.userId !== userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to delete this document"
				})
			}

			// Delete the document and its recipients
			await ctx.db.$transaction(async (tx) => {
				// Delete recipients first
				await tx.recipient.deleteMany({
					where: { documentId }
				})

				// Delete the document
				await tx.document.delete({
					where: { id: documentId }
				})
			})

			return { success: true }
		}),

	// Download a document (if user has access)
	downloadDocument: protectedProcedure
		.input(downloadDocumentSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session.user.id
			const { documentId } = input

			// Check if user has access to this document
			const document = await ctx.db.document.findUnique({
				where: { id: documentId },
				include: {
					envelope: {
						include: {
							documents: {
								include: {
									recipients: {
										where: { userId }
									}
								}
							}
						}
					},
					recipients: {
						where: { userId }
					},
					signedDoc: true // Include signed version if exists
				}
			})

			if (!document) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document not found"
				})
			}

			// Check if user has access:
			// 1. User is the envelope owner
			// 2. User is a direct recipient of this document
			// 3. User is a recipient of any document in the same envelope
			const isEnvelopeOwner = document.envelope?.userId === userId
			const isDirectRecipient = document.recipients.length > 0
			const isEnvelopeRecipient =
				document.envelope?.documents.some((doc) => doc.recipients.length > 0) ??
				false

			const hasAccess =
				isEnvelopeOwner || isDirectRecipient || isEnvelopeRecipient

			if (!hasAccess) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You don't have permission to download this document"
				})
			}

			// Use signed version if it exists and is available
			const downloadDocument = document.signedDoc ?? document
			const publicUrl = `/api/documents/${downloadDocument.id}/view`

			return {
				downloadUrl: publicUrl,
				filename: downloadDocument.name
			}
		})
})
