"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from "@/core/components/tooltip"
import { Button } from "@/core/components/ui/button"

import { trpc } from "@/services/trpc/client"

import { DeleteDocumentDialog } from "./dialog"

interface DeleteDocumentButtonProps {
	documentId: string
	documentName: string
	envelopeId: string
}

export function DeleteDocumentButton({
	documentId,
	documentName,
	envelopeId
}: DeleteDocumentButtonProps) {
	const [isOpen, setIsOpen] = useState(false)
	const queryClient = useQueryClient()

	// Delete document mutation
	const deleteDocument = trpc.envelopeLite.deleteDocument.useMutation({
		onSuccess: async () => {
			toast.success("Document deleted successfully!")
			// Invalidate and refetch envelope documents to update the list
			await queryClient.invalidateQueries({
				queryKey: [["envelopeLite", "getEnvelopeDocuments"]]
			})
			await queryClient.invalidateQueries({
				queryKey: [["envelopeLite", "getEnvelopeById"]]
			})
			setIsOpen(false)
		},
		onError: (error) => {
			console.error("Delete document error:", error)
			toast.error("Failed to delete document. Please try again.")
		}
	})

	const handleConfirm = () => {
		deleteDocument.mutate({ documentId })
	}

	return (
		<DeleteDocumentDialog
			documentName={documentName}
			onConfirm={handleConfirm}
			isDeleting={deleteDocument.isPending}
			isOpen={isOpen}
			onOpenChange={setIsOpen}
		>
			<Tooltip>
				<TooltipTrigger>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 rounded-md rounded-l-none text-red-600 hover:bg-muted hover:text-red-700"
						onClick={() => setIsOpen(true)}
					>
						<Trash2 className="size-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Delete Document</TooltipContent>
			</Tooltip>
		</DeleteDocumentDialog>
	)
}
