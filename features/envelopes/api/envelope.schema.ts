import { RecipientRole } from "@prisma/client"
import { z } from "zod/v4"

export const envelopeSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	approverId: z.string().optional()
})

export const deleteEnvelopeSchema = z.object({
	envelopeId: z.string().min(1, "Envelope ID is required")
})

export const recipientSchema = z.object({
	id: z.string().min(1, "User ID is required"),
	name: z.string().min(1, "Name is required"),
	email: z.email({ error: "Invalid email address" }),
	role: z.enum(RecipientRole)
})

export const recordDocumentSchema = z.object({
	envelopeId: z.string(),
	name: z.string(),
	type: z.string(),
	size: z.number(),
	path: z.string(),
	recipients: z.array(recipientSchema)
})

export const documentSchema = z.object({
	file: z
		.custom<File>()
		.refine((file) => file.size <= 4 * 1024 * 1024, {
			message: "File size must be less than 4MB",
			path: ["file"]
		})
		.refine((file) => file.type === "application/pdf", {
			message: "File must be a PDF",
			path: ["file"]
		}),
	recipients: z
		.array(recipientSchema)
		.min(1, "At least one recipient is required")
})

export const documentsSchema = z.object({
	documents: z
		.array(documentSchema)
		.min(1, "You must upload at least one document")
		.max(10, "You can upload a maximum of 10 documents")
})

export const createEnvelopeSchema = z.object({
	...envelopeSchema.shape,
	...documentsSchema.shape
})

export type EnvelopeSchema = z.infer<typeof envelopeSchema>
export type DeleteEnvelopeSchema = z.infer<typeof deleteEnvelopeSchema>
export type RecordDocumentSchema = z.infer<typeof recordDocumentSchema>
export type RecipientSchema = z.infer<typeof recipientSchema>
export type DocumentsSchema = z.infer<typeof documentsSchema>
export type CreateEnvelopeSchema = z.infer<typeof createEnvelopeSchema>
