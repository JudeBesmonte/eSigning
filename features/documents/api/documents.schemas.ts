import { z } from "zod"

export const getUserDocumentsSchema = z.object({
	status: z.enum(["all", "pending", "completed", "draft", "review"]).optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0)
})

export const getDocumentByIdSchema = z.object({
	documentId: z.string()
})

export const deleteDocumentSchema = z.object({
	documentId: z.string()
})

export const downloadDocumentSchema = z.object({
	documentId: z.string()
})

export const addCommentSchema = z.object({
	documentId: z.string(),
	comment: z.string().min(1).max(1000)
})

export const sendRemindersSchema = z.object({
	documentId: z.string()
})

export type GetUserDocumentsInput = z.infer<typeof getUserDocumentsSchema>
export type GetDocumentByIdInput = z.infer<typeof getDocumentByIdSchema>
export type DeleteDocumentInput = z.infer<typeof deleteDocumentSchema>
export type DownloadDocumentInput = z.infer<typeof downloadDocumentSchema>
export type AddCommentInput = z.infer<typeof addCommentSchema>
export type SendRemindersInput = z.infer<typeof sendRemindersSchema>
