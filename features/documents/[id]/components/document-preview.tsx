import React, { useState } from "react"
import { AlertCircle, Download, Eye, FileText, Loader2 } from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"

interface DocumentPreviewProps {
	document?: {
		id: string
		title: string
		documents: Array<{
			id: string
			name: string
			size: number
			fileUrl: string
			mimeType: string
		}>
	}
	onViewFullDocument?: () => void
}

const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes"
	const k = 1024
	const sizes = ["Bytes", "KB", "MB", "GB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const FilePreview: React.FC<{
	file: {
		id: string
		name: string
		size: number
		fileUrl: string
		mimeType: string
	}
}> = ({ file }) => {
	const [isLoading, setIsLoading] = useState(true)
	const [hasError, setHasError] = useState(false)

	const handleLoad = () => setIsLoading(false)
	const handleError = () => {
		setIsLoading(false)
		setHasError(true)
	}

	const downloadFile = () => {
		window.open(file.fileUrl, "_blank")
	}

	// PDF Preview
	if (file.mimeType === "application/pdf") {
		return (
			<div className="relative h-full">
				{isLoading && (
					<div className="absolute inset-0 flex items-center justify-center bg-gray-50">
						<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
					</div>
				)}
				{hasError ? (
					<div className="flex h-full items-center justify-center">
						<div className="text-center">
							<AlertCircle className="mx-auto mb-2 h-12 w-12 text-gray-400" />
							<p className="text-sm text-gray-500">Unable to preview PDF</p>
							<Button
								variant="outline"
								size="sm"
								className="mt-2"
								onClick={downloadFile}
							>
								<Download className="mr-2 h-4 w-4" />
								Download to View
							</Button>
						</div>
					</div>
				) : (
					<iframe
						src={`${file.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
						className="h-full w-full rounded border"
						onLoad={handleLoad}
						onError={handleError}
						title={file.name}
					/>
				)}
			</div>
		)
	}

	// Image Preview
	if (file.mimeType.startsWith("image/")) {
		return (
			<div className="relative h-full">
				{isLoading && (
					<div className="absolute inset-0 flex items-center justify-center bg-gray-50">
						<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
					</div>
				)}
				{hasError ? (
					<div className="flex h-full items-center justify-center">
						<div className="text-center">
							<AlertCircle className="mx-auto mb-2 h-12 w-12 text-gray-400" />
							<p className="text-sm text-gray-500">Unable to load image</p>
						</div>
					</div>
				) : (
					<img
						src={file.fileUrl}
						alt={file.name}
						className="h-full w-full rounded object-contain"
						onLoad={handleLoad}
						onError={handleError}
					/>
				)}
			</div>
		)
	}

	// Text Preview
	if (
		file.mimeType.startsWith("text/") ||
		file.mimeType === "application/json"
	) {
		return (
			<div className="relative h-full">
				{isLoading && (
					<div className="absolute inset-0 flex items-center justify-center bg-gray-50">
						<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
					</div>
				)}
				<iframe
					src={file.fileUrl}
					className="h-full w-full rounded border bg-white"
					onLoad={handleLoad}
					onError={handleError}
					title={file.name}
				/>
			</div>
		)
	}

	// Unsupported file type
	return (
		<div className="flex h-full items-center justify-center">
			<div className="text-center">
				<FileText className="mx-auto mb-4 h-16 w-16 text-gray-300" />
				<p className="mb-2 text-gray-500">
					Preview not available for this file type
				</p>
				<Badge variant="secondary" className="mb-4">
					{file.mimeType}
				</Badge>
				<Button variant="outline" size="sm" onClick={downloadFile}>
					<Download className="mr-2 h-4 w-4" />
					Download File
				</Button>
			</div>
		</div>
	)
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
	document,
	onViewFullDocument
}) => {
	// Get the first document file for preview
	const previewFile = document?.documents?.[0]

	return (
		<Card className="md:col-span-2">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
				<CardTitle className="flex items-center space-x-2">
					<FileText className="h-5 w-5" />
					<span>Document Preview</span>
				</CardTitle>
				{previewFile && (
					<div className="flex items-center space-x-2 text-sm text-gray-500">
						<span>{previewFile.name}</span>
						<Badge variant="outline">{formatFileSize(previewFile.size)}</Badge>
					</div>
				)}
			</CardHeader>
			<CardContent>
				<div className="h-[500px] rounded-lg border bg-gray-50">
					{!document ? (
						<div className="flex h-full items-center justify-center">
							<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
						</div>
					) : !previewFile ? (
						<div className="flex h-full items-center justify-center">
							<div className="text-center">
								<FileText className="mx-auto mb-4 h-16 w-16 text-gray-300" />
								<p className="text-gray-500">No document files found</p>
							</div>
						</div>
					) : (
						<div className="h-full p-4">
							<FilePreview file={previewFile} />
						</div>
					)}
				</div>
				{previewFile && onViewFullDocument && (
					<div className="mt-4 flex justify-center">
						<Button variant="outline" onClick={onViewFullDocument}>
							<Eye className="mr-2 h-4 w-4" />
							View Full Document
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
