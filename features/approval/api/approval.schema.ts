import { z } from "zod"

export const getApprovalEnvelopesSchema = z.object({
	limit: z.number().min(1).max(100).default(10),
	cursor: z.string().optional(),
	status: z.enum(["PENDING_APPROVAL", "APPROVED", "REJECTED"]).optional()
})

export const approveEnvelopeSchema = z.object({
	envelopeId: z.string(),
	action: z.enum(["approve", "reject"]),
	comments: z.string().optional(),
	reason: z.string().optional()
})

export const getEnvelopeDetailsSchema = z.object({
	envelopeId: z.string()
})

export const getDocumentForApprovalSchema = z.object({
	documentId: z.string()
})

export type GetApprovalEnvelopesInput = z.infer<
	typeof getApprovalEnvelopesSchema
>
export type ApproveEnvelopeInput = z.infer<typeof approveEnvelopeSchema>
export type GetEnvelopeDetailsInput = z.infer<typeof getEnvelopeDetailsSchema>
export type GetDocumentForApprovalInput = z.infer<
	typeof getDocumentForApprovalSchema
>
