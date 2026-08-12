import { z } from "zod"

export const createMessageSchema = z.object({
	documentId: z.string().optional(),
	envelopeId: z.string(),
	content: z.string().min(1, "Message cannot be empty"),
	messageType: z.enum(["DOCUMENT", "ENVELOPE"]).default("DOCUMENT"),
	recipientId: z.string().optional() // Add recipient ID for direct messages
})

export const getMessagesSchema = z.object({
	documentId: z.string().optional(),
	envelopeId: z.string(),
	messageType: z.enum(["DOCUMENT", "ENVELOPE"]).default("DOCUMENT"),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0)
})

export const createConversationSchema = z.object({
	title: z.string(),
	participantIds: z.array(z.string())
})

export const createOrGetConversationSchema = z.object({
	participantId: z.string(),
	title: z.string().optional()
})

export const searchUsersSchema = z.object({
	query: z.string(),
	limit: z.number().min(1).max(50).default(10)
})

export const getParticipantsSchema = z.object({
	envelopeId: z.string()
})

export const markAsReadSchema = z.object({
	envelopeId: z.string()
})

export type CreateMessageInput = z.infer<typeof createMessageSchema>
export type GetMessagesInput = z.infer<typeof getMessagesSchema>
export type CreateConversationInput = z.infer<typeof createConversationSchema>
export type CreateOrGetConversationInput = z.infer<
	typeof createOrGetConversationSchema
>
export type SearchUsersInput = z.infer<typeof searchUsersSchema>
export type GetParticipantsInput = z.infer<typeof getParticipantsSchema>
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>
