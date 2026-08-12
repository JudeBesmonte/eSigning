"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

import { trpc } from "@/services/trpc/client"

import type { IdInfo } from "../api/ocr.schemas"

export function useMistralOcrExtraction() {
	const [isProcessing, setIsProcessing] = useState(false)

	const mistralOcr = trpc.mistralOcr.extractIdInfo.useMutation({
		onSuccess: (data) => {
			if (data.success) {
				toast.success("ID information extracted successfully!")
			} else {
				toast.error(data.error ?? "Failed to extract ID information")
			}
		},
		onError: (error) => {
			console.error("Mistral OCR Error:", error)
			toast.error(`OCR Error: ${error.message}`)
		}
	})

	const extractIdInfo = useCallback(
		async (imageFile: File): Promise<IdInfo | null> => {
			setIsProcessing(true)

			try {
				console.log("Starting Mistral OCR processing...")

				// Convert file to base64
				const base64 = await new Promise<string>((resolve, reject) => {
					const reader = new FileReader()
					reader.onload = () => {
						const result = reader.result as string
						// Remove the data URL prefix to get just the base64 data
						const base64Data = result.split(",")[1]
						if (base64Data) {
							resolve(base64Data)
						} else {
							reject(new Error("Failed to convert image to base64"))
						}
					}
					reader.onerror = reject
					reader.readAsDataURL(imageFile)
				})

				console.log("Image converted to base64, calling Mistral API...")

				// Call Mistral OCR
				const result = await mistralOcr.mutateAsync({
					imageBase64: base64,
					prompt: `Analyze this Philippine ID document image and extract the following information in JSON format:
{
  "fullName": "complete name as shown on the ID",
  "idNumber": "ID or license number",
  "address": "complete address",
  "birthdate": "date of birth in YYYY/MM/DD format",
  "expiresAt": "expiration date in YYYY/MM/DD format, if applicable"
}

Please ensure accuracy and return only the JSON object with the extracted information. If any field cannot be found, use an empty string.`
				})

				if (result.success && result.data) {
					console.log("Mistral OCR successful:", result.data)
					return {
						idNumber: result.data.idNumber ?? "",
						fullName: result.data.fullName ?? "",
						address: result.data.address ?? "",
						birthdate: result.data.birthdate ?? "",
						rawText: result.data.rawText ?? "",
						confidence: result.data.confidence ?? 85
					}
				} else {
					console.error("Mistral OCR failed:", result.error)
					return null
				}
			} catch (error) {
				console.error("Mistral OCR Error:", error)
				toast.error(
					`OCR Error: ${error instanceof Error ? error.message : "Unknown error"}`
				)
				return null
			} finally {
				setIsProcessing(false)
			}
		},
		[mistralOcr]
	)

	return {
		extractIdInfo,
		isProcessing: isProcessing || mistralOcr.isPending
	}
}
