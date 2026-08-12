import { z } from "zod"

export const saveDefaultSignatureSchema = z.object({
	signatureData: z.string().min(1, "Signature is required"),
	signatureType: z.enum(["drawn", "typed", "uploaded", "default"], {
		errorMap: () => ({ message: "Invalid signature type" })
	})
})

export type SaveDefaultSignatureSchema = z.infer<
	typeof saveDefaultSignatureSchema
>
