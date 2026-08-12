import { EnvelopeStatus } from "@prisma/client"
import { z } from "zod"

// Schema for creating a new notary book entry
export const createNotaryBookEntrySchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	entryType: z.enum([
		"ENVELOPE",
		"AUDIT_EVENT",
		"DOCUMENT",
		"SIGNATURE",
		"NOTARIZATION"
	] as const),
	metadata: z.record(z.any()).optional(),
	envelopeId: z.string().optional(),
	auditEventId: z.string().optional(),
	entryDate: z.date().optional()
})

export type CreateNotaryBookEntryInput = z.infer<
	typeof createNotaryBookEntrySchema
>

// Schema for listing notary book entries with filters
export const listNotaryBookEntriesSchema = z.object({
	skip: z.number().min(0).default(0),
	take: z.number().min(1).max(100).default(10),
	entryType: z
		.enum([
			"ENVELOPE",
			"AUDIT_EVENT",
			"DOCUMENT",
			"SIGNATURE",
			"NOTARIZATION"
		] as const)
		.optional(),
	envelopeId: z.string().optional(),
	auditEventId: z.string().optional(),
	startDate: z.date().optional(),
	endDate: z.date().optional()
})

export type ListNotaryBookEntriesInput = z.infer<
	typeof listNotaryBookEntriesSchema
>

// Schema for operations that require a notary book entry ID
export const notaryBookEntryIdSchema = z.object({
	id: z.string().min(1, "Entry ID is required")
})

export type NotaryBookEntryIdInput = z.infer<typeof notaryBookEntryIdSchema>

// Schema for the full notary book entry (used in responses)
export const notaryBookEntrySchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	entryType: z.enum([
		"ENVELOPE",
		"AUDIT_EVENT",
		"DOCUMENT",
		"SIGNATURE",
		"NOTARIZATION"
	] as const),
	metadata: z.record(z.any()).nullable(),
	entryDate: z.date(),
	createdAt: z.date(),
	updatedAt: z.date(),
	createdById: z.string(),
	envelopeId: z.string().nullable(),
	auditEventId: z.string().nullable(),
	createdBy: z.object({
		id: z.string(),
		name: z.string().nullable(),
		email: z.string().nullable()
	}),
	envelope: z
		.object({
			id: z.string(),
			title: z.string(),
			status: z.nativeEnum(EnvelopeStatus)
		})
		.nullable(),
	auditEvent: z
		.object({
			id: z.string(),
			eventType: z.string(),
			timestamp: z.date()
		})
		.nullable()
})

export type NotaryBookEntry = z.infer<typeof notaryBookEntrySchema>
