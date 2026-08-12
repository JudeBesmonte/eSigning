import { EventEmitter, on } from "events"
import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

// Proper TypeScript interfaces
interface MessageSender {
	id: string
	name: string | null
	email: string | null
	image: string | null
}

interface Message {
	id: string
	content: string
	messageType: "DOCUMENT" | "ENVELOPE"
	envelopeId: string
	documentId?: string | null
	senderId: string
	sender: MessageSender
	createdAt: string
}

interface RecipientWithUser {
	id: string
	role: string
	status: string
	userId: string | null
	envelopeId: string | null
	documentId: string | null
	user: {
		id: string
		name: string | null
		email: string | null
		image: string | null
	} | null
}

interface EnvelopeWithRecipients {
	id: string
	title: string
	description: string | null
	status: string
	createdAt: Date
	updatedAt: Date
	userId: string
	recipient: RecipientWithUser[]
	messages: {
		id: string
		content: string
		messageType: string
		envelopeId: string
		documentId: string | null
		senderId: string
		createdAt: Date
		sender: {
			id: string
			name: string | null
			email: string | null
			image: string | null
		}
	}[]
}

interface RecipientWithEnvelope {
	id: string
	role: string
	status: string
	userId: string | null
	envelopeId: string | null
	documentId: string | null
	envelope: EnvelopeWithRecipients | null
}

// EventEmitter for real-time messages
const ee = new EventEmitter()

export const messagesRouter = createTRPCRouter({
	// Create a new conversation (envelope)
	createConversation: protectedProcedure
		.input(
			z.object({
				title: z.string(),
				participantIds: z.array(z.string())
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { title, participantIds } = input
			const userId = ctx.session.user.id

			try {
				// Create new envelope
				const envelope = await ctx.db.envelope.create({
					data: {
						title,
						status: "DRAFT",
						userId,
						recipient: {
							create: [
								// Add current user as recipient
								{
									role: "SIGNER" as const,
									status: "PENDING" as const,
									userId
								},
								// Add other participants
								...participantIds.map((participantId) => ({
									role: "SIGNER" as const,
									status: "PENDING" as const,
									userId: participantId
								}))
							]
						}
					},
					include: {
						recipient: {
							include: {
								user: {
									select: { id: true, name: true, email: true, image: true }
								}
							}
						}
					}
				})

				// created conversation
				return envelope
			} catch (error) {
				console.error("❌ Error creating conversation:", error)
				throw new Error("Failed to create conversation")
			}
		}),

	// Get user's conversations (envelopes they're part of)
	getUserConversations: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id

		try {
			// getting conversations

			// Get all envelopes where user is a recipient
			const userEnvelopes = await ctx.db.recipient.findMany({
				where: {
					userId,
					envelopeId: { not: null }
				},
				include: {
					envelope: {
						include: {
							recipient: {
								include: {
									user: {
										select: {
											id: true,
											name: true,
											email: true,
											image: true
										}
									}
								}
							},
							messages: {
								orderBy: { createdAt: "desc" },
								take: 1,
								include: {
									sender: {
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
					}
				},
				orderBy: {
					envelope: {
						updatedAt: "desc"
					}
				}
			})

			const conversations = userEnvelopes.map(
				(recipient: RecipientWithEnvelope) => {
					const envelope = recipient.envelope!
					const lastMessage = envelope.messages[0]

					// Get other participants (excluding current user)
					const otherParticipants = envelope.recipient
						.filter((r: RecipientWithUser) => r.user && r.user.id !== userId)
						.map((r: RecipientWithUser) => r.user!)

					// Create conversation name from the viewer's perspective
					let conversationName: string
					if (otherParticipants.length === 1) {
						const participant = otherParticipants[0]
						conversationName =
							participant?.name ?? participant?.email ?? "Unknown User"
					} else if (otherParticipants.length > 1) {
						// Prefer a custom title if present, otherwise derive a group label
						conversationName =
							envelope.title && envelope.title !== "New Conversation"
								? envelope.title
								: `${otherParticipants.length} participants`
					} else {
						conversationName = envelope.title ?? "Empty conversation"
					}

					// Calculate unread count: number of recent messages from others since last open (simple heuristic)
					const unreadCount =
						lastMessage && lastMessage.senderId !== userId ? 1 : 0

					return {
						id: envelope.id,
						title: conversationName,
						lastMessage: lastMessage?.content ?? "No messages yet",
						lastMessageTime:
							lastMessage?.createdAt.toISOString() ??
							envelope.updatedAt.toISOString(),
						unreadCount,
						participants: envelope.recipient
							.filter((r: RecipientWithUser) => r.user)
							.map(
								(r: RecipientWithUser) =>
									r.user!.name ?? r.user!.email ?? "Unknown User"
							),
						lastSender: lastMessage?.sender.name ?? "Unknown User"
					}
				}
			)

			// retrieved conversations
			return { envelopes: conversations }
		} catch (error) {
			console.error("❌ Error getting user conversations:", error)
			return { envelopes: [] }
		}
	}),

	// Search for users to chat with
	searchUsers: protectedProcedure
		.input(
			z.object({
				query: z.string(),
				limit: z.number().min(1).max(50).default(10)
			})
		)
		.query(async ({ input, ctx }) => {
			const { query, limit } = input
			const currentUserId = ctx.session.user.id
			const searchQuery = query.trim()

			try {
				// Get total user count for debugging
				const totalUsers = await ctx.db.user.count()
				const currentUser = await ctx.db.user.findUnique({
					where: { id: currentUserId },
					select: { id: true, name: true, email: true }
				})

				// Dynamic database search
				const users = await ctx.db.user.findMany({
					where: {
						id: { not: currentUserId },
						suspendedAt: null,
						...(searchQuery.length > 0
							? {
									OR: [
										{ name: { contains: searchQuery, mode: "insensitive" } },
										{ email: { contains: searchQuery, mode: "insensitive" } },
										{
											organization: {
												contains: searchQuery,
												mode: "insensitive"
											}
										}
									]
								}
							: {})
					},
					select: {
						id: true,
						name: true,
						email: true,
						image: true,
						organization: true,
						role: true
					},
					take: limit,
					orderBy: {
						name: "asc"
					}
				})

				// Also get suspended users for debugging
				const suspendedUsers = await ctx.db.user.findMany({
					where: {
						suspendedAt: { not: null }
					},
					select: {
						id: true,
						name: true,
						email: true,
						suspendedAt: true
					}
				})

				return users
			} catch (error) {
				console.error("❌ Database search error:", error)
				console.error("❌ Error details:", {
					message: error instanceof Error ? error.message : "Unknown error",
					stack: error instanceof Error ? error.stack : undefined
				})
				// Fallback to empty array if database query fails
				return []
			}
		}),

	// Get messages for a specific document or envelope
	getMessages: protectedProcedure
		.input(
			z.object({
				documentId: z.string().optional(),
				envelopeId: z.string(),
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0)
			})
		)
		.query(async ({ input, ctx }) => {
			const { documentId, envelopeId, limit, offset } = input
			const userId = ctx.session.user.id

			// getting messages

			try {
				// First, ensure user has access to this envelope
				const userAccess = await ctx.db.recipient.findFirst({
					where: {
						envelopeId,
						userId
					}
				})

				if (!userAccess) {
					// no access
					return {
						messages: [],
						participants: [],
						envelope: null
					}
				}

				// Get participants (recipients) for the envelope - optimized query
				const participants = await ctx.db.recipient.findMany({
					where: {
						envelopeId
					},
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true
							}
						}
					}
				})

				// Get envelope details - simplified query
				const envelope = await ctx.db.envelope.findUnique({
					where: { id: envelopeId },
					select: {
						id: true,
						title: true,
						status: true,
						createdAt: true,
						updatedAt: true,
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

				// Get messages from database
				const dbMessages = await ctx.db.documentMessage.findMany({
					where: {
						envelopeId,
						...(documentId && { documentId })
					},
					include: {
						sender: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true
							}
						}
					},
					orderBy: { createdAt: "asc" }, // Changed from "desc" to "asc" for normal chat order
					take: limit,
					skip: offset
				})

				// Convert to our Message format with explicit typing
				const messages: Message[] = dbMessages.map(
					(msg: {
						id: string
						content: string
						messageType: string
						envelopeId: string
						documentId: string | null
						senderId: string
						sender: {
							id: string
							name: string | null
							email: string | null
							image: string | null
						}
						createdAt: Date
					}) => ({
						id: msg.id,
						content: msg.content,
						messageType: msg.messageType as "DOCUMENT" | "ENVELOPE",
						envelopeId: msg.envelopeId,
						documentId: msg.documentId,
						senderId: msg.senderId,
						sender: {
							id: msg.sender.id,
							name: msg.sender.name,
							email: msg.sender.email,
							image: msg.sender.image
						},
						createdAt: msg.createdAt.toISOString()
					})
				)

				// retrieved messages

				return {
					messages,
					participants,
					envelope
				}
			} catch (error) {
				console.error("❌ Error getting messages:", error)
				return {
					messages: [],
					participants: [],
					envelope: null
				}
			}
		}),

	// Subscribe to real-time messages
	subscribe: protectedProcedure
		.input(
			z.object({
				envelopeId: z.string(),
				documentId: z.string().optional()
			})
		)
		.subscription(async function* (opts) {
			for await (const [message] of on(ee, "newMessage", {
				signal: opts.signal
			}) as AsyncIterable<[Message]>) {
				// Only yield messages for the specific envelope and document
				const matchesEnvelope = message.envelopeId === opts.input.envelopeId
				const matchesDocument = opts.input.documentId
					? message.documentId === opts.input.documentId
					: true

				if (matchesEnvelope && matchesDocument) {
					yield [message.id, message]
				}
			}
		}),

	// Send a new message
	sendMessage: protectedProcedure
		.input(
			z.object({
				documentId: z.string().optional(),
				envelopeId: z.string(),
				content: z.string().min(1).max(1000),
				messageType: z.enum(["DOCUMENT", "ENVELOPE"]).default("DOCUMENT"),
				recipientId: z.string().optional() // Add recipient ID for direct messages
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { documentId, envelopeId, content, messageType, recipientId } =
				input
			const userId = ctx.session.user.id

			// sending message

			try {
				// Check if envelope exists, if not create it - optimized query
				let envelope = await ctx.db.envelope.findUnique({
					where: { id: envelopeId },
					select: {
						id: true,
						title: true,
						status: true,
						userId: true
					}
				})

				// creating envelope for message if missing
				envelope ??= await ctx.db.envelope.create({
					data: {
						id: envelopeId,
						title: "New Conversation",
						status: "DRAFT",
						userId
					},
					select: {
						id: true,
						title: true,
						status: true,
						userId: true
					}
				})

				// Get current recipients - optimized query
				const currentRecipients = await ctx.db.recipient.findMany({
					where: { envelopeId },
					select: { userId: true }
				})
				const recipientIds = currentRecipients
					.map((r: { userId: string | null }) => r.userId)
					.filter((id): id is string => id !== null)

				// Ensure sender is a recipient
				if (!recipientIds.includes(userId)) {
					await ctx.db.recipient.create({
						data: {
							envelopeId,
							userId,
							role: "SIGNER" as const,
							status: "PENDING" as const
						}
					})
					// added sender as recipient
				}

				// If recipientId is provided and not already a recipient, add them
				if (recipientId && !recipientIds.includes(recipientId)) {
					await ctx.db.recipient.create({
						data: {
							envelopeId,
							userId: recipientId,
							role: "SIGNER" as const,
							status: "PENDING" as const
						}
					})
					// added recipient
				}

				// Create the message
				const savedMessage = await ctx.db.documentMessage.create({
					data: {
						content,
						messageType,
						envelopeId,
						documentId: documentId ?? null,
						senderId: userId
					},
					include: {
						sender: true
					}
				})

				// Convert to our Message format for real-time broadcasting
				const messageForBroadcast: Message = {
					id: savedMessage.id,
					content: savedMessage.content,
					messageType:
						savedMessage.messageType === "DOCUMENT" ? "DOCUMENT" : "ENVELOPE",
					envelopeId: savedMessage.envelopeId,
					documentId: savedMessage.documentId,
					senderId: savedMessage.senderId,
					sender: {
						id: savedMessage.sender.id,
						name: savedMessage.sender.name,
						email: savedMessage.sender.email,
						image: savedMessage.sender.image
					},
					createdAt: savedMessage.createdAt.toISOString()
				}

				// Broadcast to all subscribers (real-time)
				ee.emit("newMessage", messageForBroadcast)

				// message saved
				return messageForBroadcast
			} catch (error) {
				console.error("❌ Error sending message:", error)
				throw new Error("Failed to send message")
			}
		}),

	// Get participants for an envelope
	getParticipants: protectedProcedure
		.input(
			z.object({
				envelopeId: z.string()
			})
		)
		.query(async ({ input, ctx }) => {
			const { envelopeId } = input

			const participants = await ctx.db.recipient.findMany({
				where: {
					envelopeId
				},
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true
						}
					}
				}
			})

			return participants
		}),

	// Create or get conversation between two users
	createOrGetConversation: protectedProcedure
		.input(
			z.object({
				participantId: z.string(),
				title: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { participantId, title } = input
			const currentUserId = ctx.session.user.id

			try {
				// First, get all conversations where current user is a recipient
				const currentUserRecipients = await ctx.db.recipient.findMany({
					where: {
						userId: currentUserId,
						envelopeId: { not: null }
					},
					include: {
						envelope: {
							include: {
								recipient: {
									include: {
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
						}
					}
				})

				// Find existing conversation with the participant
				let existingConversation = null
				for (const recipient of currentUserRecipients) {
					const envelope = recipient.envelope!

					// Check if this envelope has exactly 2 participants (direct conversation)
					if (envelope.recipient.length === 2) {
						// Check if the other participant is the one we're looking for
						const otherParticipant = envelope.recipient.find(
							(r: RecipientWithUser) => r.user && r.user.id !== currentUserId
						)

						if (
							otherParticipant &&
							otherParticipant.user?.id === participantId
						) {
							existingConversation = envelope
							break
						}
					}
				}

				if (existingConversation) {
					// found existing conversation
					return existingConversation
				}

				// Get participant info for better conversation title
				const participant = await ctx.db.user.findUnique({
					where: { id: participantId },
					select: { name: true, email: true }
				})

				// Create new conversation with better title
				const conversationTitle =
					title ?? participant?.name ?? participant?.email ?? "New Conversation"

				const newConversation = await ctx.db.envelope.create({
					data: {
						title: conversationTitle,
						status: "DRAFT",
						userId: currentUserId,
						recipient: {
							create: [
								{
									role: "SIGNER" as const,
									status: "PENDING" as const,
									userId: currentUserId
								},
								{
									role: "SIGNER" as const,
									status: "PENDING" as const,
									userId: participantId
								}
							]
						}
					},
					include: {
						recipient: {
							include: {
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
				})

				// created new conversation
				return newConversation
			} catch (error) {
				console.error("❌ Error creating/getting conversation:", error)
				throw new Error("Failed to create or get conversation")
			}
		}),

	// Clean up duplicate conversations (admin function)
	cleanupDuplicateConversations: protectedProcedure.mutation(
		async ({ ctx }) => {
			const currentUserId = ctx.session.user.id

			try {
				// starting cleanup

				// Get all conversations where current user is a recipient
				const userRecipients = await ctx.db.recipient.findMany({
					where: {
						userId: currentUserId,
						envelopeId: { not: null }
					},
					include: {
						envelope: {
							include: {
								recipient: {
									include: {
										user: {
											select: {
												id: true,
												name: true,
												email: true,
												image: true
											}
										}
									}
								},
								messages: {
									orderBy: { createdAt: "desc" },
									take: 1
								}
							}
						}
					}
				})

				// Group conversations by participant
				const conversationGroups = new Map<
					string,
					{
						id: string
						messages: { createdAt: Date }[]
						createdAt: Date
					}[]
				>()

				for (const recipient of userRecipients) {
					const envelope = recipient.envelope!

					// Only consider direct conversations (2 participants)
					if (envelope.recipient.length === 2) {
						const otherParticipant = envelope.recipient.find(
							(r: RecipientWithUser) => r.user && r.user.id !== currentUserId
						)

						if (otherParticipant && otherParticipant.user) {
							const participantKey = otherParticipant.user.id
							if (!conversationGroups.has(participantKey)) {
								conversationGroups.set(participantKey, [])
							}
							conversationGroups.get(participantKey)!.push({
								id: envelope.id,
								messages: envelope.messages,
								createdAt: envelope.createdAt
							})
						}
					}
				}

				// For each participant, keep only the most recent conversation
				let deletedCount = 0
				for (const [, conversations] of conversationGroups) {
					if (conversations.length > 1) {
						// Sort by last message time or creation time
						conversations.sort((a, b) => {
							const aTime = a.messages[0]?.createdAt ?? a.createdAt
							const bTime = b.messages[0]?.createdAt ?? b.createdAt
							return new Date(bTime).getTime() - new Date(aTime).getTime()
						})

						// Keep the most recent, delete the rest
						const toDelete = conversations.slice(1)
						for (const conversation of toDelete) {
							await ctx.db.envelope.delete({
								where: { id: conversation.id }
							})
							deletedCount++
						}
					}
				}

				// cleanup complete
				return { deletedCount }
			} catch (error) {
				console.error("❌ Error during cleanup:", error)
				throw new Error("Failed to cleanup duplicate conversations")
			}
		}
	),

	// Mark conversation as read
	markAsRead: protectedProcedure
		.input(
			z.object({
				envelopeId: z.string()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { envelopeId } = input
			const userId = ctx.session.user.id

			try {
				// marking as read

				// For now, we'll just log that the conversation was opened
				// In a full implementation, you might store the last read timestamp
				// in a separate table or update a field in the recipient table

				// marked as read
				return { success: true }
			} catch (error) {
				console.error("❌ Error marking conversation as read:", error)
				throw new Error("Failed to mark conversation as read")
			}
		})
})
