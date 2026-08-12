import { useQueryClient } from "@tanstack/react-query"

import { trpc } from "@/services/trpc/client"

import type { GetUserDocumentsInput } from "./documents.schemas"

export interface UseDocumentsProps {
	status?: GetUserDocumentsInput["status"]
	limit?: number
	offset?: number
}

export const useDocuments = (props: UseDocumentsProps = {}) => {
	const queryClient = useQueryClient()
	const { status = "all", limit = 50, offset = 0 } = props

	// Fetch shared documents query (documents where user is recipient)
	const documentsQuery = trpc.documents.getUserSharedDocuments.useQuery({
		status: status === "all" ? undefined : status,
		limit,
		offset
	})

	// Delete document mutation
	const deleteDocumentMutation = trpc.documents.deleteDocument.useMutation({
		onSuccess: async () => {
			// Invalidate and refetch documents after deletion
			await queryClient.invalidateQueries({
				queryKey: [["documents", "getUserSharedDocuments"]]
			})
		}
	})

	// Download document mutation
	const downloadDocumentMutation = trpc.documents.downloadDocument.useMutation({
		onSuccess: (data) => {
			// Open download URL in new tab
			if (data.downloadUrl) {
				window.open(data.downloadUrl, "_blank")
			}
		}
	})

	const refetch = async () => {
		await documentsQuery.refetch()
	}

	return {
		documents: documentsQuery.data?.documents ?? [],
		total: documentsQuery.data?.total ?? 0,
		isLoading: documentsQuery.isLoading,
		error: documentsQuery.error,
		refetch,
		deleteDocument: deleteDocumentMutation.mutate,
		downloadDocument: downloadDocumentMutation.mutate,
		isDeleting: deleteDocumentMutation.isPending,
		isDownloading: downloadDocumentMutation.isPending
	}
}
