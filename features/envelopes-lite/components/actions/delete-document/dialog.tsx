"use client"

import React, { useState } from "react"
import { AlertTriangle, Trash2 } from "lucide-react"

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from "@/core/components/tooltip"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from "@/core/components/ui/alert-dialog"
import { Button } from "@/core/components/ui/button"

interface DeleteDocumentDialogProps {
	documentName: string
	onConfirm: () => void
	children: React.ReactNode
	isDeleting?: boolean
	isOpen?: boolean
	onOpenChange?: (open: boolean) => void
}

export function DeleteDocumentDialog({
	documentName,
	onConfirm,
	children,
	isDeleting = false,
	isOpen: externalIsOpen,
	onOpenChange: externalOnOpenChange
}: DeleteDocumentDialogProps) {
	const [internalIsOpen, setInternalIsOpen] = useState(false)

	const isOpen = externalIsOpen ?? internalIsOpen
	const setIsOpen = externalOnOpenChange ?? setInternalIsOpen

	const handleConfirm = () => {
		onConfirm()
		setIsOpen(false)
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				{children ?? (
					<Tooltip>
						<TooltipTrigger>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 rounded-md rounded-l-none text-red-600 hover:bg-muted hover:text-red-700"
								onClick={() => setIsOpen(true)}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Delete Document</TooltipContent>
					</Tooltip>
				)}
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-2">
						<AlertTriangle className="h-5 w-5 text-destructive" />
						Delete Document
					</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete &quot;{documentName}&quot;? This
						action cannot be undone and will permanently remove the document and
						all associated signatures.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						disabled={isDeleting}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isDeleting ? (
							<>
								<Trash2 className="animate-spin" />
								Deleting...
							</>
						) : (
							<>
								<Trash2 />
								Delete Document
							</>
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
