import { useRouter } from "next/navigation"
import React from "react"
import { CheckCircle, Download, Share2 } from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"

import type { DocumentDetail } from "../api/use-document-detail"

interface DocumentDetailHeaderProps {
	document: DocumentDetail
	onDownload: () => void
	onShare: () => void
	isDownloading?: boolean
	isSharing?: boolean
}

export const DocumentDetailHeader: React.FC<DocumentDetailHeaderProps> = ({
	document,
	onDownload,
	onShare,
	isDownloading,
	isSharing
}) => {
	const router = useRouter()

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case "signed":
				return "bg-green-100 text-green-800"
			case "pending":
				return "bg-orange-100 text-orange-800"
			case "in progress":
				return "bg-blue-100 text-blue-800"
			case "completed":
				return "bg-green-100 text-green-800"
			case "expired":
				return "bg-red-100 text-red-800"
			default:
				return "bg-gray-100 text-gray-800"
		}
	}

	return (
		<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<div className="flex items-center space-x-2">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
						{document.title}
					</h1>
					<Badge className={getStatusColor(document.status)}>
						{document.status}
					</Badge>
				</div>
				<p className="text-gray-600 dark:text-gray-400">
					{document.type} • Created on {document.created} • Due{" "}
					{document.dueDate}
				</p>
			</div>
			<div className="flex flex-wrap gap-2">
				<Button variant="outline" onClick={onDownload} disabled={isDownloading}>
					<Download className="mr-2 h-4 w-4" />
					{isDownloading ? "Downloading..." : "Download"}
				</Button>
				<Button variant="outline" onClick={onShare} disabled={isSharing}>
					<Share2 className="mr-2 h-4 w-4" />
					{isSharing ? "Sharing..." : "Share"}
				</Button>
				<Button
					onClick={() =>
						router.push(`/dashboard/documents/${document.id}/sign`)
					}
				>
					<CheckCircle className="mr-2 h-4 w-4" />
					Sign
				</Button>
			</div>
		</div>
	)
}
