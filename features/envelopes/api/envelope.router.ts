import type { Role } from "@prisma/client"
import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

import {
	notifyApproverAssignment,
	notifyRecipientAssignment
} from "../../../services/email/email-notifications"
import {
	deleteEnvelopeSchema,
	envelopeSchema,
	recordDocumentSchema
} from "./envelope.schema"

export const envelopeRouter = createTRPCRouter({
	createEnvelope: protectedProcedure
		.input(envelopeSchema)
		.mutation(async ({ ctx, input }) => {
			const envelope = await ctx.db.envelope.create({
				data: {
					title: input.title,
					description: input.description ?? "",
					status: "DRAFT",
					userId: ctx.session.user.id
				}
			})

			// Create audit event for envelope creation
			await ctx.db.auditEvent.create({
				data: {
					eventType: "ENVELOPE_CREATED",
					description: `Envelope "${envelope.title}" was created`,
					userEmail: ctx.session.user.email,
					userName: ctx.session.user.name,
					envelopeId: envelope.id,
					timestamp: new Date()
				}
			})

			// If an approver is assigned, create an envelope-level approver recipient
			if (input.approverId) {
				const approver = await ctx.db.user.findUnique({
					where: { id: input.approverId },
					select: { id: true, name: true, email: true, role: true }
				})

				if (approver) {
					// Verify the user is eligible to be an approver
					const eligibleRoles = ["ADMIN", "SUPER_ADMIN"] as Role[]
					if (eligibleRoles.includes(approver.role)) {
						const approverRecipient = await ctx.db.recipient.create({
							data: {
								envelopeId: envelope.id,
								userId: approver.id,
								role: "APPROVER",
								status: "PENDING"
							}
						})

						// Create audit event for approver assignment
						await ctx.db.auditEvent.create({
							data: {
								eventType: "RECIPIENT_ADDED",
								description: `Approver ${approver.name} (${approver.email}) was assigned to envelope`,
								userEmail: ctx.session.user.email,
								userName: ctx.session.user.name,
								envelopeId: envelope.id,
								recipientId: approverRecipient.id,
								metadata: {
									recipientEmail: approver.email,
									recipientName: approver.name,
									recipientRole: "APPROVER",
									isEnvelopeApprover: true
								},
								timestamp: new Date()
							}
						})
					}
				}
			}

			return envelope
		}),

	createManyDocuments: protectedProcedure
		.input(recordDocumentSchema)
		.mutation(async ({ ctx, input }) => {
			const document = await ctx.db.document.create({
				data: {
					envelopeId: input.envelopeId,
					name: input.name,
					type: input.type,
					size: input.size,
					path: input.path
				}
			})

			// Create audit event for document upload
			await ctx.db.auditEvent.create({
				data: {
					eventType: "DOCUMENT_UPLOADED",
					description: `Document "${document.name}" was uploaded`,
					userEmail: ctx.session.user.email,
					userName: ctx.session.user.name,
					envelopeId: input.envelopeId,
					documentId: document.id,
					timestamp: new Date()
				}
			})

			for (const recipient of input.recipients) {
				const createdRecipient = await ctx.db.recipient.create({
					data: {
						documentId: document.id,
						envelopeId: input.envelopeId,
						userId: recipient.id,
						role: recipient.role,
						status: "PENDING"
					}
				})

				// Create audit event for recipient addition
				await ctx.db.auditEvent.create({
					data: {
						eventType: "RECIPIENT_ADDED",
						description: `Recipient ${recipient.name} (${recipient.email}) was added`,
						userEmail: ctx.session.user.email,
						userName: ctx.session.user.name,
						envelopeId: input.envelopeId,
						documentId: document.id,
						recipientId: createdRecipient.id,
						metadata: {
							recipientEmail: recipient.email,
							recipientName: recipient.name
						},
						timestamp: new Date()
					}
				})

				// Email notifications will be sent when envelope is published
			}

			return document
		}),

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
			}
		})

		return envelopes
	}),

	validateRecipient: protectedProcedure
		.input(z.object({ email: z.string().email() }))
		.query(async ({ ctx, input }) => {
			const user = await ctx.db.user.findUnique({
				where: { email: input.email },
				select: {
					id: true,
					name: true,
					email: true,
					role: true
				}
			})

			return {
				exists: !!user,
				user: user ?? null
			}
		}),

	searchUsers: protectedProcedure
		.input(
			z.object({
				query: z.string().min(1, "Search query is required"),
				limit: z.number().optional().default(10)
			})
		)
		.query(async ({ ctx, input }) => {
			const searchQuery = input.query.trim()

			const users = await ctx.db.user.findMany({
				where: {
					OR: [
						{
							name: {
								contains: searchQuery,
								mode: "insensitive"
							}
						},
						{
							email: {
								contains: searchQuery,
								mode: "insensitive"
							}
						}
					]
				},
				select: {
					id: true,
					name: true,
					email: true,
					role: true
				},
				take: input.limit,
				orderBy: [{ name: "asc" }, { email: "asc" }]
			})

			return users
		}),

	getApproverById: protectedProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			const user = await ctx.db.user.findUnique({
				where: { id: input.userId },
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					organization: true
				}
			})

			if (!user) {
				throw new Error("User not found")
			}

			// Verify the user is eligible to be an approver
			const eligibleRoles = ["ADMIN", "SUPER_ADMIN"] as Role[]
			if (!eligibleRoles.includes(user.role)) {
				throw new Error("User is not eligible to be an approver")
			}

			return user
		}),

	publishEnvelope: protectedProcedure
		.input(z.object({ envelopeId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Verify the envelope belongs to the current user
			const envelope = await ctx.db.envelope.findFirst({
				where: {
					id: input.envelopeId,
					userId: ctx.session.user.id,
					status: "DRAFT"
				},
				include: {
					documents: {
						select: {
							id: true,
							name: true
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
							},
							document: {
								select: {
									id: true,
									name: true
								}
							}
						}
					}
				}
			})

			if (!envelope) {
				throw new Error("Envelope not found or cannot be published")
			}

			// Update envelope status to PUBLISHED
			const updatedEnvelope = await ctx.db.envelope.update({
				where: {
					id: input.envelopeId
				},
				data: {
					status: "PUBLISHED"
				}
			})

			// Create audit event for envelope publication
			await ctx.db.auditEvent.create({
				data: {
					eventType: "ENVELOPE_PUBLISHED",
					description: `Envelope "${updatedEnvelope.title}" was published`,
					userEmail: ctx.session.user.email,
					userName: ctx.session.user.name,
					envelopeId: updatedEnvelope.id,
					timestamp: new Date()
				}
			})

			// Send email notifications to all recipients when envelope is published
			for (const recipient of envelope.recipient) {
				if (recipient.user?.email) {
					try {
						if (recipient.role === "APPROVER") {
							// Send approver notification
							await notifyApproverAssignment({
								recipient: {
									email: recipient.user.email,
									name: recipient.user.name
								},
								sender: {
									name: ctx.session.user.name,
									email: ctx.session.user.email
								},
								envelope: {
									id: updatedEnvelope.id,
									title: updatedEnvelope.title,
									description: updatedEnvelope.description
								},
								documents: envelope.documents,
								role: "APPROVER"
							})
						} else {
							// Send signer/viewer notification
							const recipientDocuments = recipient.document
								? [recipient.document]
								: envelope.documents // Fallback to all documents if no specific document assigned

							await notifyRecipientAssignment({
								recipient: {
									email: recipient.user.email,
									name: recipient.user.name
								},
								sender: {
									name: ctx.session.user.name,
									email: ctx.session.user.email
								},
								envelope: {
									id: updatedEnvelope.id,
									title: updatedEnvelope.title,
									description: updatedEnvelope.description
								},
								documents: recipientDocuments,
								role: recipient.role
							})
						}
					} catch (emailError) {
						console.error(
							`❌ Failed to send notification to ${recipient.user.email} (${recipient.role}):`,
							emailError
						)
					}
				}
			}
			return updatedEnvelope
		}),

	deleteEnvelope: protectedProcedure
		.input(deleteEnvelopeSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the envelope belongs to the current user
			const envelope = await ctx.db.envelope.findFirst({
				where: {
					id: input.envelopeId,
					userId: ctx.session.user.id
				},
				include: {
					documents: {
						select: {
							id: true,
							name: true
						}
					}
				}
			})

			if (!envelope) {
				throw new Error(
					"Envelope not found or you don't have permission to delete it"
				)
			}

			// Create audit event for envelope deletion
			await ctx.db.auditEvent.create({
				data: {
					eventType: "ENVELOPE_CANCELLED",
					description: `Envelope "${envelope.title}" was deleted`,
					userEmail: ctx.session.user.email,
					userName: ctx.session.user.name,
					envelopeId: envelope.id,
					metadata: {
						documentCount: envelope.documents.length,
						envelopeStatus: envelope.status
					},
					timestamp: new Date()
				}
			})

			// Delete the envelope (this will cascade delete all related data due to Prisma relations)
			await ctx.db.envelope.delete({
				where: {
					id: input.envelopeId
				}
			})

			return { success: true, message: "Envelope deleted successfully" }
		})
})
