import React from "react"

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import { Skeleton } from "@/core/components/ui/skeleton"

import type { UserDocument } from "@/features/dashboard/api/dashboard.types"

import { DocumentCard } from "./document-card"

interface DocumentsListProps {
	documents: UserDocument[]
	isLoading: boolean
	onDownload?: (documentId: string) => void
	onDelete?: (documentId: string) => void
}

export const DocumentsList: React.FC<DocumentsListProps> = ({
	documents,
	isLoading,
	onDownload,
	onDelete
}) => {
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Your Documents</CardTitle>
					<CardDescription>
						<Skeleton className="h-4 w-32" />
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<div
								key={i}
								className="flex items-center justify-between rounded-lg border p-4"
							>
								<div className="flex flex-1 items-center space-x-4">
									<Skeleton className="h-12 w-12 rounded-lg" />
									<div className="min-w-0 flex-1">
										<Skeleton className="mb-2 h-4 w-64" />
										<Skeleton className="mb-2 h-3 w-96" />
										<div className="flex items-center space-x-2">
											<Skeleton className="h-6 w-20" />
											<Skeleton className="h-3 w-24" />
										</div>
									</div>
								</div>
								<div className="flex items-center space-x-2">
									<Skeleton className="h-8 w-8" />
									<Skeleton className="h-8 w-8" />
									<Skeleton className="h-8 w-8" />
									<Skeleton className="h-8 w-8" />
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Your Documents</CardTitle>
				<CardDescription>{documents.length} document(s) found</CardDescription>
			</CardHeader>
			<CardContent>
				{documents.length === 0 ? (
					<div className="py-8 text-center text-gray-500">
						No documents found
					</div>
				) : (
					<div className="space-y-4">
						{documents.map((document) => (
							<DocumentCard
								key={document.id}
								document={document}
								onDownload={onDownload}
								onDelete={onDelete}
							/>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
