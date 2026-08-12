import { TRPCError } from "@trpc/server"

import {
	notifySignatureApproved,
	notifySignatureRejected
} from "@/services/email/email-notifications"
import { db } from "@/services/prisma/db"
import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

import {
	approveEnvelopeSchema,
	getApprovalEnvelopesSchema,
	getDocumentForApprovalSchema,
	getEnvelopeDetailsSchema
} from "./approval.schema"

export const approvalRouter = createTRPCRouter({
	getEnvelopesForApproval: protectedProcedure
		.input(getApprovalEnvelopesSchema)
		.query(async ({ ctx, input }) => {
			const { user } = ctx.session

			const { limit, cursor, status } = input

			// Simple approach: get envelopes directly without complex type manipulation
			const envelopes = await db.envelope.findMany({
				where: {
					status: status,
					recipient: {
						some: {
							userId: user.id,
							role: "APPROVER"
						}
					}
				},
				include: {
					createdBy: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
							organization: true
						}
					},
					documents: {
						include: {
							recipients: {
								include: {
									user: {
										select: {
											id: true,
											name: true,
											email: true
										}
									}
								}
							}
						}
					}
				},
				orderBy: {
					createdAt: "desc"
				}
			})

			// Apply pagination
			const startIndex = cursor
				? envelopes.findIndex((e) => e.id === cursor) + 1
				: 0
			const paginatedEnvelopes = envelopes.slice(
				startIndex,
				startIndex + limit + 1
			)

			let nextCursor: string | undefined = undefined
			if (paginatedEnvelopes.length > limit) {
				const nextItem = paginatedEnvelopes.pop()
				nextCursor = nextItem?.id
			}

			return {
				envelopes: paginatedEnvelopes,
				nextCursor
			}
		}),

	getEnvelopeDetails: protectedProcedure
		.input(getEnvelopeDetailsSchema)
		.query(async ({ ctx, input }) => {
			const { user } = ctx.session
			const { envelopeId } = input

			const envelope = await db.envelope.findUnique({
				where: { id: envelopeId },
				include: {
					createdBy: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
							organization: true
						}
					},
					documents: {
						include: {
							recipients: {
								include: {
									user: {
										select: {
											id: true,
											name: true,
											email: true
										}
									}
								}
							}
						}
					},
					recipient: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									email: true
								}
							}
						}
					}
				}
			})

			if (!envelope) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Envelope not found"
				})
			}

			// Check if user is an envelope-level approver
			const isEnvelopeApprover = envelope.recipient.some(
				(recipient) =>
					recipient.userId === user.id && recipient.role === "APPROVER"
			)

			if (!isEnvelopeApprover) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not authorized to approve this envelope"
				})
			}

			return envelope
		}),

	approveEnvelope: protectedProcedure
		.input(approveEnvelopeSchema)
		.mutation(async ({ ctx, input }) => {
			const { user } = ctx.session
			const { envelopeId, action } = input

			const envelope = await db.envelope.findUnique({
				where: { id: envelopeId },
				include: {
					recipient: {
						where: {
							userId: user.id,
							role: "APPROVER" as const
						}
					}
				}
			})

			if (!envelope) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Envelope not found"
				})
			}

			// Check if user is an envelope-level approver
			const userRecipient = envelope.recipient.find(
				(r) => r.userId === user.id && r.role === "APPROVER"
			)

			if (!userRecipient) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not authorized to approve this envelope"
				})
			}

			if (envelope.status !== "PENDING_APPROVAL") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Envelope is not ready for approval"
				})
			}

			// Update the recipient status for this specific approver
			await db.recipient.update({
				where: { id: userRecipient.id },
				data: {
					status: action === "approve" ? "APPROVED" : "REJECTED"
				}
			})

			// Create audit event for individual approver action
			const approverAuditEventType =
				action === "approve" ? "ENVELOPE_APPROVED" : "ENVELOPE_REJECTED"
			const approverDescription =
				action === "approve"
					? `Envelope "${envelope.title}" was approved by ${user.name || user.email}`
					: `Envelope "${envelope.title}" was rejected by ${user.name || user.email}`

			await db.auditEvent.create({
				data: {
					eventType: approverAuditEventType,
					description: approverDescription,
					userEmail: user.email,
					userName: user.name,
					envelopeId: envelope.id,
					recipientId: userRecipient.id,
					metadata: {
						approverEmail: user.email,
						approverName: user.name,
						approverRole: user.role,
						action: action,
						comments: input.comments,
						reason: input.reason
					},
					timestamp: new Date()
				}
			})

			// Check if all envelope-level approvers have responded
			const allApprovers = await db.recipient.findMany({
				where: {
					envelopeId: envelopeId,
					role: "APPROVER" as const
				}
			})

			const pendingApprovers = allApprovers.filter(
				(recipient) => recipient.status === "PENDING"
			)
			const rejectedApprovers = allApprovers.filter(
				(recipient) => recipient.status === "REJECTED"
			)

			let newEnvelopeStatus: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" =
				envelope.status

			if (rejectedApprovers.length > 0) {
				// If any approver rejected, mark envelope as rejected
				newEnvelopeStatus = "REJECTED"
			} else if (pendingApprovers.length === 0) {
				// If all approvers have responded and none rejected, mark as approved
				newEnvelopeStatus = "APPROVED"
			}

			if (newEnvelopeStatus !== envelope.status) {
				// Update envelope status
				const updatedEnvelope = await db.envelope.update({
					where: { id: envelopeId },
					data: {
						status: newEnvelopeStatus
					},
					include: {
						createdBy: {
							select: {
								id: true,
								name: true,
								email: true
							}
						},
						documents: {
							select: {
								id: true,
								name: true
							}
						}
					}
				})

				// Create audit event for final envelope status change
				if (
					newEnvelopeStatus === "APPROVED" ||
					newEnvelopeStatus === "REJECTED"
				) {
					const finalEventType =
						newEnvelopeStatus === "APPROVED"
							? "ENVELOPE_APPROVED"
							: "ENVELOPE_REJECTED"
					const finalDescription =
						newEnvelopeStatus === "APPROVED"
							? `Envelope "${envelope.title}" has been fully approved by all required approvers`
							: `Envelope "${envelope.title}" has been rejected`

					await db.auditEvent.create({
						data: {
							eventType: finalEventType,
							description: finalDescription,
							userEmail: user.email,
							userName: user.name,
							envelopeId: envelope.id,
							metadata: {
								finalStatus: newEnvelopeStatus,
								totalApprovers: allApprovers.length,
								approvedCount: allApprovers.filter(
									(a) => a.status === "APPROVED"
								).length,
								rejectedCount: rejectedApprovers.length
							},
							timestamp: new Date()
						}
					})

					// Send email notification to envelope creator when approved or rejected
					if (
						newEnvelopeStatus === "APPROVED" &&
						updatedEnvelope.createdBy?.email
					) {
						try {
							await notifySignatureApproved({
								recipient: {
									email: updatedEnvelope.createdBy.email,
									name: updatedEnvelope.createdBy.name
								},
								approver: {
									name: user.name,
									email: user.email
								},
								envelope: {
									id: updatedEnvelope.id,
									title: updatedEnvelope.title,
									description: updatedEnvelope.description
								},
								documents: updatedEnvelope.documents,
								approvalDate: new Date()
							})
						} catch (emailError) {
							console.error(
								`❌ Failed to send approval notification to envelope creator ${updatedEnvelope.createdBy.email}:`,
								emailError
							)
							// Don't throw error to prevent failing the approval process
						}
					} else if (
						newEnvelopeStatus === "REJECTED" &&
						updatedEnvelope.createdBy?.email
					) {
						try {
							await notifySignatureRejected({
								recipient: {
									email: updatedEnvelope.createdBy.email,
									name: updatedEnvelope.createdBy.name
								},
								rejector: {
									name: user.name,
									email: user.email
								},
								envelope: {
									id: updatedEnvelope.id,
									title: updatedEnvelope.title,
									description: updatedEnvelope.description
								},
								documents: updatedEnvelope.documents,
								rejectionDate: new Date(),
								rejectionReason: input.reason,
								comments: input.comments
							})
						} catch (emailError) {
							console.error(
								`❌ Failed to send rejection notification to envelope creator ${updatedEnvelope.createdBy.email}:`,
								emailError
							)
							// Don't throw error to prevent failing the rejection process
						}
					}
				}
			}

			return { success: true, action }
		}),

	getDocumentForApproval: protectedProcedure
		.input(getDocumentForApprovalSchema)
		.query(async ({ ctx, input }) => {
			const { user } = ctx.session
			const { documentId } = input

			const document = await db.document.findUnique({
				where: { id: documentId },
				include: {
					signedDoc: true, // Include the signed version
					envelope: {
						include: {
							recipient: {
								where: {
									userId: user.id,
									role: "APPROVER"
								}
							}
						}
					}
				}
			})

			if (!document) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document not found"
				})
			}

			if (!document.envelope) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document envelope not found"
				})
			}

			// Check if user is an approver for this envelope
			const isApprover = document.envelope.recipient.length > 0

			if (!isApprover) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not authorized to view this document"
				})
			}

			// Use the signed document path if it exists, otherwise fall back to unsigned
			const documentToView = document.signedDoc ?? document
			// Get document URL using the document ID instead of path
			const documentUrl = `/api/documents/${documentToView.id}/view`

			return {
				...documentToView,
				url: documentUrl
			}
		})
})
