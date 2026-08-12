import { z } from "zod"

export const extractIdInfoSchema = z.object({
	imageFile: z.instanceof(File, {
		message: "Please upload a valid image file"
	}),
	imageUrl: z.string().url().optional()
})

export const idInfoSchema = z.object({
	idNumber: z.string().optional(),
	fullName: z.string().optional(),
	address: z.string().optional(),
	birthdate: z.string().optional(),
	rawText: z.string(),
	confidence: z.number().min(0).max(100)
})

export const ocrResultSchema = z.object({
	success: z.boolean(),
	data: idInfoSchema.optional(),
	error: z.string().optional()
})

export type ExtractIdInfoInput = z.infer<typeof extractIdInfoSchema>
export type IdInfo = z.infer<typeof idInfoSchema>
export type OcrResult = z.infer<typeof ocrResultSchema>
