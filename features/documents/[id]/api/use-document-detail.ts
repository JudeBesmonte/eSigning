import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { trpc } from "@/services/trpc/client"

export interface DocumentDetail {
	id: string
	title: string
	type: string
	status: string
	created: string | undefined
	updated: string | undefined
	dueDate: string
	description: string
	creator: {
		name: string
		email: string
		avatar?: string
	}
	signers: Array<{
		id: string
		name: string
		email: string
		status: "signed" | "pending"
		signedAt?: string | null
		avatar?: string
		role: string
	}>
	history: Array<{
		id: string
		action: string
		user: string
		timestamp: string
		eventType: string
	}>
	comments: Array<{
		id: string
		text: string
		author: string
		timestamp: string
		avatar?: string
	}>
	documents: Array<{
		id: string
		name: string
		size: number
		fileUrl: string
		mimeType: string
	}>
}

export const useDocumentDetail = (documentId: string) => {
	// const trpc = useTRPC()
	const queryClient = useQueryClient()

	// Fetch document details using the documents router
	const documentQuery = trpc.documents.getDocumentById.useQuery({
		documentId: documentId
	})

	// Add comment mutation
	const addCommentMutation = trpc.documents.addComment.useMutation({
		onSuccess: () => {
			toast.success("Comment Added", {
				description: "Your comment has been added to the document."
			})
			void queryClient.invalidateQueries({
				queryKey: [
					["documents", "getDocumentById"],
					{ input: { documentId: documentId } }
				]
			})
		}
	})

	// Send reminders mutation
	const sendRemindersMutation = trpc.documents.sendReminders.useMutation({
		onSuccess: () => {
			toast.info("Reminders Sent", {
				description: "Reminders have been sent to all pending signers."
			})
		}
	})

	// Download document mutation
	const downloadDocumentMutation = trpc.documents.downloadDocument.useMutation({
		onSuccess: (data) => {
			if (data.downloadUrl) {
				window.open(data.downloadUrl, "_blank")
				toast.info("Download Started", {
					description: "Your document is being downloaded."
				})
			}
		}
	})

	// Share document mutation
	const shareDocumentMutation = useMutation({
		mutationFn: async () => {
			// TODO: Use actual tRPC call when client issues are resolved
			await new Promise((resolve) => setTimeout(resolve, 1000))
			return Promise.resolve({ shareUrl: "#" })
		},
		onSuccess: () => {
			toast.info("Share Options", {
				description: "Document sharing options opened."
			})
		}
	})

	return {
		document: documentQuery.data,
		isLoading: documentQuery.isLoading,
		error: documentQuery.error,
		addComment: (comment: string) =>
			addCommentMutation.mutate({ documentId, comment }),
		sendReminders: () => sendRemindersMutation.mutate({ documentId }),
		downloadDocument: () => downloadDocumentMutation.mutate({ documentId }),
		shareDocument: shareDocumentMutation.mutate,
		isAddingComment: addCommentMutation.isPending,
		isSendingReminders: sendRemindersMutation.isPending,
		isDownloading: downloadDocumentMutation.isPending,
		isSharing: shareDocumentMutation.isPending
	}
}
