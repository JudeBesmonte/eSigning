"use client"

import type { IdInfo } from "@/features/id-info-ocr/api/ocr.schemas"
import { UploadId } from "@/features/id-info-ocr/components/upload-id"

export default function OcrTestPage() {
	const handleExtractComplete = (data: IdInfo) => {
		console.log("Extracted ID information:", data)
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mx-auto max-w-4xl">
				<div className="mb-8 text-center">
					<h1 className="mb-4 text-3xl font-bold">ID Information OCR Test</h1>
					<p className="text-gray-600">
						Upload an ID document to extract information using Tesseract.js OCR
					</p>
				</div>

				<UploadId onExtractComplete={handleExtractComplete} />
			</div>
		</div>
	)
}
