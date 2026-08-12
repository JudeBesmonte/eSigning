import { Mistral } from "@mistralai/mistralai"
import { z } from "zod"

import { createTRPCRouter, publicProcedure } from "@/services/trpc/init"

import { ocrResultSchema } from "./ocr.schemas"

// Initialize Mistral client (optional)
// Lazy initialize Mistral client so build doesn't require the key
let mistralClient: Mistral | null = null
function getMistralClient() {
	const apiKey = process.env.MISTRAL_API_KEY
	if (!apiKey) {
		throw new Error("MISTRAL_API_KEY environment variable is required")
	}
	mistralClient ??= new Mistral({ apiKey })
	return mistralClient
}

export const mistralOcrRouter = createTRPCRouter({
	extractIdInfo: publicProcedure
		.input(
			z.object({
				imageBase64: z.string().min(1, "Image data is required"),
				prompt: z
					.string()
					.default(
						"Extract the following information from this ID document image: full name, ID number, address, and birthdate. Return the information in JSON format with keys: fullName, idNumber, address, birthdate. If any information is not found, use an empty string for that field."
					)
			})
		)
		.output(ocrResultSchema)
		.mutation(async ({ input }) => {
			try {
				console.log("Starting Mistral OCR processing...")

				const client = getMistralClient()

				// Convert base64 to the format Mistral expects
				const imageData = input.imageBase64.startsWith("data:")
					? input.imageBase64
					: `data:image/jpeg;base64,${input.imageBase64}`

				// Create a chat completion with vision capabilities
				const response = await client.chat.complete({
					model: "pixtral-12b-2409", // Mistral's vision model
					messages: [
						{
							role: "user",
							content: [
								{
									type: "text",
									text: input.prompt
								},
								{
									type: "image_url",
									imageUrl: {
										url: imageData
									}
								}
							]
						}
					],
					temperature: 0.1, // Low temperature for consistent extraction
					maxTokens: 500
				})

				console.log("Mistral Response:", response)

				const extractedText =
					typeof response.choices?.[0]?.message?.content === "string"
						? response.choices[0].message.content
						: JSON.stringify(response.choices?.[0]?.message?.content ?? "")

				console.log("Extracted Text:", extractedText)

				// Try to parse JSON response
				let extractedInfo = {
					idNumber: "",
					fullName: "",
					address: "",
					birthdate: "",
					rawText: extractedText
				}

				try {
					// Look for JSON in the response
					const jsonRegex = /\{[\s\S]*\}/
					const jsonMatch = jsonRegex.exec(extractedText)
					if (jsonMatch) {
						const parsedData = JSON.parse(jsonMatch[0]) as Record<
							string,
							unknown
						>

						const safeString = (value: unknown): string => {
							if (typeof value === "string") return value
							if (typeof value === "number") return String(value)
							return ""
						}

						extractedInfo = {
							idNumber: safeString(parsedData.idNumber ?? parsedData.id_number),
							fullName: safeString(
								parsedData.fullName ?? parsedData.full_name ?? parsedData.name
							),
							address: safeString(parsedData.address),
							birthdate: safeString(
								parsedData.birthdate ??
									parsedData.birth_date ??
									parsedData.dateOfBirth
							),
							rawText: extractedText
						}
					} else {
						// Fallback: extract information using patterns from the text response
						const nameRegex = /(?:name|full.*name)[:\s]+([^\n\r,]+)/i
						const idRegex = /(?:id.*number|license.*no)[:\s]+([^\n\r,\s]+)/i
						const addressRegex = /(?:address)[:\s]+([^\n\r]+)/i
						const birthdateRegex =
							/(?:birth.*date|date.*birth|birthdate)[:\s]+([^\n\r,\s]+)/i

						const nameMatch = nameRegex.exec(extractedText)
						const idMatch = idRegex.exec(extractedText)
						const addressMatch = addressRegex.exec(extractedText)
						const birthdateMatch = birthdateRegex.exec(extractedText)

						if (nameMatch?.[1]) extractedInfo.fullName = nameMatch[1].trim()
						if (idMatch?.[1]) extractedInfo.idNumber = idMatch[1].trim()
						if (addressMatch?.[1])
							extractedInfo.address = addressMatch[1].trim()
						if (birthdateMatch?.[1])
							extractedInfo.birthdate = birthdateMatch[1].trim()
					}
				} catch (parseError) {
					console.warn(
						"Failed to parse JSON response, using fallback extraction:",
						parseError
					)
				}

				console.log("Extracted Information:", extractedInfo)

				return {
					success: true,
					data: {
						...extractedInfo,
						confidence: 85 // Mistral typically has high confidence
					}
				}
			} catch (error) {
				console.error("Mistral OCR Error:", error)

				return {
					success: false,
					error:
						error instanceof Error
							? error.message
							: "Mistral OCR processing failed"
				}
			}
		})
})
