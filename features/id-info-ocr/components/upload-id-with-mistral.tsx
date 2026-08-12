"use client"

import Image from "next/image"
import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import { Label } from "@/core/components/ui/label"
import { Separator } from "@/core/components/ui/separator"
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from "@/core/components/ui/tabs"

import type { IdInfo } from "../api/ocr.schemas"
import { useMistralOcrExtraction } from "../hooks/use-mistral-ocr-extraction"
import { useOcrExtraction } from "../hooks/use-ocr-extraction"

export function UploadIdWithMistral() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [extractedInfo, setExtractedInfo] = useState<IdInfo | null>(null)
	const [activeTab, setActiveTab] = useState<"tesseract" | "mistral">("mistral")

	const tesseractOcr = useOcrExtraction()
	const mistralOcr = useMistralOcrExtraction()

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		accept: {
			"image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"]
		},
		multiple: false,
		onDrop: (acceptedFiles) => {
			const file = acceptedFiles[0]
			if (file) {
				setSelectedFile(file)
				setExtractedInfo(null) // Reset previous results
				toast.success(`File "${file.name}" selected successfully!`)
			}
		},
		onDropRejected: (fileRejections) => {
			const firstRejection = fileRejections[0]
			if (firstRejection) {
				toast.error(`File rejected: ${firstRejection.errors[0]?.message}`)
			}
		}
	})

	const handleExtractInfo = async (method: "tesseract" | "mistral") => {
		if (!selectedFile) {
			toast.error("Please select an image file first")
			return
		}

		try {
			let result: IdInfo | null = null

			if (method === "tesseract") {
				result = await tesseractOcr.extractIdInfo(selectedFile)
			} else {
				result = await mistralOcr.extractIdInfo(selectedFile)
			}

			if (result) {
				setExtractedInfo(result)
				console.log(`${method} OCR Result:`, result)
			} else {
				toast.error(`${method} OCR failed to extract information`)
			}
		} catch (error) {
			console.error(`${method} OCR Error:`, error)
			toast.error(`${method} OCR processing failed`)
		}
	}

	const isProcessing = tesseractOcr.isProcessing || mistralOcr.isProcessing

	return (
		<div className="container mx-auto max-w-4xl space-y-8 p-4">
			<Card>
				<CardHeader>
					<CardTitle>Upload ID Document</CardTitle>
				</CardHeader>
				<CardContent>
					<div
						{...getRootProps()}
						className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"} ${selectedFile ? "border-green-500 bg-green-50" : ""} `}
					>
						<input {...getInputProps()} />
						{isDragActive ? (
							<p className="text-primary">Drop the ID image here...</p>
						) : selectedFile ? (
							<div className="space-y-4">
								<p className="font-medium text-green-600">
									✓ File Selected: {selectedFile.name}
								</p>
								<p className="text-sm text-gray-600">
									Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
								</p>
								{selectedFile.type.startsWith("image/") && (
									<div className="flex justify-center">
										<div className="relative w-full max-w-md">
											<Image
												src={URL.createObjectURL(selectedFile)}
												alt="Selected ID"
												className="h-auto max-h-64 w-full rounded-lg object-contain shadow-md"
												width={400}
												height={256}
												style={{ objectFit: "contain" }}
											/>
										</div>
									</div>
								)}
							</div>
						) : (
							<div className="space-y-2">
								<p>Drag & drop an ID image here, or click to select</p>
								<p className="text-sm text-gray-500">
									Supports PNG, JPG, JPEG, GIF, BMP, WebP
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{selectedFile && (
				<Card>
					<CardHeader>
						<CardTitle>Extract Information</CardTitle>
					</CardHeader>
					<CardContent>
						<Tabs
							value={activeTab}
							onValueChange={(value) =>
								setActiveTab(value as "tesseract" | "mistral")
							}
						>
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="tesseract">Tesseract OCR</TabsTrigger>
								<TabsTrigger value="mistral">Mistral AI</TabsTrigger>
							</TabsList>

							<TabsContent value="tesseract" className="space-y-4">
								<div className="text-sm text-gray-600">
									Uses Tesseract.js for local OCR processing. Good for basic
									text extraction.
								</div>
								<Button
									onClick={() => handleExtractInfo("tesseract")}
									disabled={isProcessing}
									className="w-full"
								>
									{tesseractOcr.isProcessing
										? "Processing with Tesseract..."
										: "Extract with Tesseract"}
								</Button>
							</TabsContent>

							<TabsContent value="mistral" className="space-y-4">
								<div className="text-sm text-gray-600">
									Uses Mistral&apos;s Pixtral vision model for advanced
									AI-powered extraction. More accurate for complex documents.
								</div>
								<Button
									onClick={() => handleExtractInfo("mistral")}
									disabled={isProcessing}
									className="w-full"
									variant="default"
								>
									{mistralOcr.isProcessing
										? "Processing with Mistral AI..."
										: "Extract with Mistral AI"}
								</Button>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			)}

			{extractedInfo && (
				<Card>
					<CardHeader>
						<CardTitle>Extracted Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<Label className="text-sm font-medium text-gray-700">
									Full Name
								</Label>
								<div className="mt-1 rounded-md border bg-gray-50 p-2">
									{extractedInfo.fullName ?? "Not found"}
								</div>
							</div>

							<div>
								<Label className="text-sm font-medium text-gray-700">
									ID Number
								</Label>
								<div className="mt-1 rounded-md border bg-gray-50 p-2">
									{extractedInfo.idNumber ?? "Not found"}
								</div>
							</div>

							<div>
								<Label className="text-sm font-medium text-gray-700">
									Birthdate
								</Label>
								<div className="mt-1 rounded-md border bg-gray-50 p-2">
									{extractedInfo.birthdate ?? "Not found"}
								</div>
							</div>

							<div>
								<Label className="text-sm font-medium text-gray-700">
									Confidence
								</Label>
								<div className="mt-1 rounded-md border bg-gray-50 p-2">
									{extractedInfo.confidence}%
								</div>
							</div>
						</div>

						<div>
							<Label className="text-sm font-medium text-gray-700">
								Address
							</Label>
							<div className="mt-1 rounded-md border bg-gray-50 p-2">
								{extractedInfo.address ?? "Not found"}
							</div>
						</div>

						<Separator />

						<div>
							<Label className="text-sm font-medium text-gray-700">
								Raw Text
							</Label>
							<div className="mt-1 max-h-32 overflow-y-auto rounded-md border bg-gray-50 p-2 text-xs">
								<pre className="whitespace-pre-wrap">
									{extractedInfo.rawText}
								</pre>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
