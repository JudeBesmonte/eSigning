"use client"

import Image from "next/image"
import React, { useCallback, useState } from "react"
import {
	AlertCircle,
	CheckCircle2,
	FileImage,
	Loader2,
	Upload
} from "lucide-react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { Separator } from "@/core/components/ui/separator"

import type { IdInfo } from "../api/ocr.schemas"
import { useOcrExtraction } from "../hooks/use-ocr-extraction"

interface UploadIdProps {
	onExtractComplete?: (data: IdInfo) => void
	className?: string
}

export function UploadId({ onExtractComplete, className }: UploadIdProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const [extractedData, setExtractedData] = useState<IdInfo | null>(null)

	const { extractIdInfo, isProcessing } = useOcrExtraction()

	const onDrop = useCallback((acceptedFiles: File[]) => {
		const file = acceptedFiles[0]
		if (file) {
			// Check file size (max 10MB)
			if (file.size > 10 * 1024 * 1024) {
				toast.error("File size must be less than 10MB")
				return
			}

			// Check file type
			if (!file.type.startsWith("image/")) {
				toast.error("Please select a valid image file")
				return
			}

			setSelectedFile(file)
			setExtractedData(null)

			// Create preview URL
			const url = URL.createObjectURL(file)
			setPreviewUrl(url)

			toast.success(
				"Image uploaded successfully! Click 'Extract ID Info' to process."
			)
		}
	}, [])

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"]
		},
		multiple: false,
		maxSize: 10 * 1024 * 1024 // 10MB
	})

	const handleExtractId = async () => {
		if (!selectedFile) {
			toast.error("Please select an image first")
			return
		}

		try {
			const result = await extractIdInfo(selectedFile)
			if (result) {
				setExtractedData(result)
				onExtractComplete?.(result)
			}
		} catch (error) {
			console.error("Error processing image:", error)
			toast.error("Failed to process image")
		}
	}

	const handleClearAll = () => {
		setSelectedFile(null)
		setPreviewUrl(null)
		setExtractedData(null)
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl)
		}
	}

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Upload Area */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileImage className="h-5 w-5" />
						Upload ID Document
					</CardTitle>
					<CardDescription>
						Upload a clear image of your ID document (driver&apos;s license,
						passport, etc.)
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div
						{...getRootProps()}
						className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"} ${selectedFile ? "border-green-500 bg-green-50" : ""} `}
					>
						<input {...getInputProps()} />
						<div className="flex flex-col items-center gap-4">
							{selectedFile ? (
								<CheckCircle2 className="h-12 w-12 text-green-600" />
							) : (
								<Upload className="h-12 w-12 text-gray-400" />
							)}

							{selectedFile ? (
								<div className="text-center">
									<p className="text-lg font-medium text-green-700">
										{selectedFile.name}
									</p>
									<p className="text-sm text-gray-600">
										Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
									</p>
									<p className="mt-2 text-sm text-blue-600">
										Ready to extract ID information
									</p>
								</div>
							) : (
								<div className="text-center">
									<p className="text-lg font-medium">
										{isDragActive
											? "Drop the image here"
											: "Drag & drop an image here"}
									</p>
									<p className="text-sm text-gray-600">
										or click to select a file
									</p>
									<p className="mt-2 text-xs text-gray-500">
										Supports: PNG, JPG, JPEG, GIF, BMP, WebP (max 10MB)
									</p>
								</div>
							)}
						</div>
					</div>

					{selectedFile && (
						<div className="mt-4 flex gap-2">
							<Button
								onClick={handleExtractId}
								disabled={isProcessing}
								className="flex-1"
							>
								{isProcessing ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Processing...
									</>
								) : (
									"Extract ID Information"
								)}
							</Button>
							<Button
								variant="outline"
								onClick={handleClearAll}
								disabled={isProcessing}
							>
								Clear
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Image Preview */}
			{previewUrl && (
				<Card>
					<CardHeader>
						<CardTitle>Image Preview</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex justify-center">
							<Image
								src={previewUrl}
								alt="ID Document Preview"
								width={500}
								height={400}
								className="max-h-96 max-w-full rounded-lg border object-contain shadow-sm"
							/>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Extracted Information */}
			{extractedData && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CheckCircle2 className="h-5 w-5 text-green-600" />
							Extracted Information
							<Badge variant="secondary">
								{extractedData.confidence}% confidence
							</Badge>
						</CardTitle>
						<CardDescription>
							Review the extracted information and make corrections if needed
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<Label htmlFor="idNumber">ID Number</Label>
								<Input
									id="idNumber"
									value={extractedData.idNumber ?? ""}
									placeholder="Not detected"
									readOnly
									className="bg-gray-50"
								/>
							</div>
							<div>
								<Label htmlFor="fullName">Full Name</Label>
								<Input
									id="fullName"
									value={extractedData.fullName ?? ""}
									placeholder="Not detected"
									readOnly
									className="bg-gray-50"
								/>
							</div>
							<div>
								<Label htmlFor="birthdate">Date of Birth</Label>
								<Input
									id="birthdate"
									value={extractedData.birthdate ?? ""}
									placeholder="Not detected"
									readOnly
									className="bg-gray-50"
								/>
							</div>
							<div>
								<Label htmlFor="address">Address</Label>
								<Input
									id="address"
									value={extractedData.address ?? ""}
									placeholder="Not detected"
									readOnly
									className="bg-gray-50"
								/>
							</div>
						</div>

						<Separator />

						<div>
							<Label htmlFor="rawText">Raw OCR Text</Label>
							<textarea
								id="rawText"
								value={extractedData.rawText}
								readOnly
								className="h-32 w-full resize-none rounded-md border bg-gray-50 p-3 font-mono text-sm"
								placeholder="Raw extracted text will appear here..."
							/>
						</div>

						{extractedData.confidence < 70 && (
							<div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3">
								<AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
								<div className="text-sm">
									<p className="font-medium text-yellow-800">
										Low Confidence Detection
									</p>
									<p className="text-yellow-700">
										The extraction confidence is below 70%. Please verify the
										information manually and ensure the image is clear and
										well-lit.
									</p>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	)
}
