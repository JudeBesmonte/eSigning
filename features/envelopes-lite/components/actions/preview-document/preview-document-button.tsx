"use client"

import { useState } from "react"
import { Eye } from "lucide-react"

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from "@/core/components/tooltip"
import { Button } from "@/core/components/ui/button"

import { DocumentPreviewDialog } from "../../document-preview-dialog"

type DocumentStatus = "SIGNED" | "PENDING" | "UNSIGNED" | "REJECTED"

interface PreviewDocumentButtonProps {
	documentId: string
	documentName: string
	envelopeId: string
	documentStatus: DocumentStatus
}

export function PreviewDocumentButton({
	documentId,
	documentName,
	envelopeId,
	documentStatus
}: PreviewDocumentButtonProps) {
	const [isPreviewOpen, setIsPreviewOpen] = useState(false)

	const getTooltipText = () => {
		switch (documentStatus) {
			case "SIGNED":
				return "Preview Signed Document"
			case "PENDING":
				return "Preview Pending Document"
			case "REJECTED":
				return "Preview Rejected Document"
			default:
				return "Preview Unsigned Document"
		}
	}

	return (
		<>
			<Tooltip>
				<TooltipTrigger>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 rounded-md rounded-r-none border-r hover:bg-muted"
						onClick={() => setIsPreviewOpen(true)}
					>
						<Eye className="size-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>{getTooltipText()}</TooltipContent>
			</Tooltip>

			<DocumentPreviewDialog
				isOpen={isPreviewOpen}
				onClose={() => setIsPreviewOpen(false)}
				documentId={documentId}
				envelopeId={envelopeId}
				documentName={documentName}
			/>
		</>
	)
}
