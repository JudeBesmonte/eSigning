import Link from "next/link"
import React from "react"
import {
	AlertCircle,
	CheckCircle,
	Clock,
	Download,
	Eye,
	FileText,
	Trash2
} from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"

import type { UserDocument } from "@/features/dashboard/api/dashboard.types"

interface DocumentCardProps {
	document: UserDocument
	onDownload?: (documentId: string) => void
	onDelete?: (documentId: string) => void
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
	document,
	onDownload,
	onDelete
}) => {
	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "bg-green-100 text-green-800"
			case "pending":
				return "bg-orange-100 text-orange-800"
			case "draft":
				return "bg-gray-100 text-gray-800"
			case "review":
				return "bg-blue-100 text-blue-800"
			default:
				return "bg-gray-100 text-gray-800"
		}
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return <CheckCircle className="h-4 w-4 text-green-600" />
			case "pending":
				return <Clock className="h-4 w-4 text-orange-600" />
			case "review":
				return <Eye className="h-4 w-4 text-blue-600" />
			default:
				return <AlertCircle className="h-4 w-4 text-gray-600" />
		}
	}

	const handleDownload = () => {
		if (onDownload) {
			onDownload(document.id)
		}
	}

	const handleDelete = () => {
		if (onDelete) {
			onDelete(document.id)
		}
	}

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
			<div className="flex flex-1 items-center space-x-4">
				<div className="rounded-lg bg-blue-100 p-2">
					<FileText className="h-6 w-6 text-blue-600" />
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="truncate font-medium text-gray-900 dark:text-white">
						{document.name}
					</h3>
					<div className="mt-1 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
						<span>{document.type}</span>
						<span>•</span>
						<span>{document.size}</span>
						<span>•</span>
						<span>Created: {document.createdDate ?? "N/A"}</span>
						<span>•</span>
						<span>Due: {document.dueDate}</span>
					</div>
					<div className="mt-2 flex items-center space-x-2">
						<Badge className={getStatusColor(document.status)}>
							<div className="flex items-center space-x-1">
								{getStatusIcon(document.status)}
								<span>{document.status}</span>
							</div>
						</Badge>
						<span className="text-sm text-gray-600 dark:text-gray-400">
							{document.completed}/{document.signers} signatures
						</span>
					</div>
				</div>
			</div>
			<div className="flex items-center space-x-2">
				<Button variant="ghost" size="sm" asChild>
					<Link href={`/dashboard/documents/${document.id}`}>
						<Eye className="h-4 w-4" />
					</Link>
				</Button>
				<Button variant="ghost" size="sm" onClick={handleDownload}>
					<Download className="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="sm" onClick={handleDelete}>
					<Trash2 className="h-4 w-4 text-red-600" />
				</Button>
			</div>
		</div>
	)
}
