"use client"

import React, { useState } from "react"

import type { UserDocument } from "@/features/dashboard/api/dashboard.types"
import { useDocuments } from "@/features/documents/api/use-documents"
import { DocumentsFilters } from "@/features/documents/components/documents-filters"
import { DocumentsHeader } from "@/features/documents/components/documents-header"
import { DocumentsList } from "@/features/documents/components/documents-list"

type StatusFilter = "all" | "pending" | "completed" | "draft" | "review"

export default function DocumentsPage() {
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

	const { documents, isLoading, refetch, deleteDocument, downloadDocument } =
		useDocuments({
			status: statusFilter,
			limit: 50,
			offset: 0
		})

	// Refetch when status filter changes
	React.useEffect(() => {
		void refetch()
	}, [statusFilter, refetch])

	// Filter documents based on search term
	const filteredDocuments = documents.filter((doc: UserDocument) => {
		const matchesSearch =
			doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			doc.type.toLowerCase().includes(searchTerm.toLowerCase())
		return matchesSearch
	})

	const handleDownload = (documentId: string) => {
		downloadDocument({ documentId })
	}

	const handleDelete = (documentId: string) => {
		if (window.confirm("Are you sure you want to delete this document?")) {
			deleteDocument({ documentId })
		}
	}

	const handleStatusChange = (value: string) => {
		setStatusFilter(value as StatusFilter)
	}

	return (
		<div className="space-y-6">
			<DocumentsHeader />

			<DocumentsFilters
				searchTerm={searchTerm}
				statusFilter={statusFilter}
				onSearchChange={setSearchTerm}
				onStatusChange={handleStatusChange}
			/>

			<DocumentsList
				documents={filteredDocuments}
				isLoading={isLoading}
				onDownload={handleDownload}
				onDelete={handleDelete}
			/>
		</div>
	)
}
