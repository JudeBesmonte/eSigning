"use client"

import { FileText } from "lucide-react"

import { Button } from "@/core/components/ui/button"

import { trpc } from "@/services/trpc/client"

import { SimplePdfViewer } from "./simple-pdf-viewer-alt"

interface DocumentPreviewPageProps {
	envelopeId: string
	documentId: string
	documentName?: string
}

export function DocumentPreviewPage({
	envelopeId,
	documentId,
	documentName
}: DocumentPreviewPageProps) {
	const {
		data: documentData,
		isPending,
		error
	} = trpc.envelopeLite.getDocumentForViewing.useQuery({
		documentId,
		envelopeId
	})

	return (
		<div className="min-h-screen bg-muted dark:bg-background">
			{/* Header */}
			<div className="border-b bg-background backdrop-blur dark:bg-muted/60">
				<div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
					<div className="flex items-center gap-3">
						<div className="rounded-lg bg-muted p-2">
							<FileText className="h-5 w-5 text-muted-foreground" />
						</div>
						<div className="min-w-0 text-left">
							<h2 className="truncate text-lg font-medium text-foreground">
								{documentName ?? documentData?.name ?? "Document Preview"}
							</h2>
							<p className="text-sm text-muted-foreground">Document Preview</p>
						</div>
					</div>
				</div>
			</div>

			{/* Content container matching EnvelopesPage */}
			<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				<div className="flex flex-col overflow-hidden">
					{isPending && (
						<div className="flex h-full items-center justify-center">
							<div className="flex flex-col items-center justify-center text-center">
								<div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
								<p className="text-sm text-muted-foreground">
									Loading document...
								</p>
							</div>
						</div>
					)}

					{error && (
						<div className="flex h-full items-center justify-center">
							<div className="text-center">
								<p className="mb-4 text-sm text-destructive">
									Failed to load document
								</p>
								<p className="text-xs text-muted-foreground">{error.message}</p>
								<Button
									variant="outline"
									size="sm"
									onClick={() => window.location.reload()}
									className="mt-4"
								>
									Try Again
								</Button>
							</div>
						</div>
					)}

					{documentData?.url && !isPending && !error && (
						<div className="w-full flex-1 overflow-hidden">
							<SimplePdfViewer
								fileUrl={documentData.url}
								documentName={documentData.name}
							/>
						</div>
					)}

					{!documentData?.url && !isPending && !error && (
						<div className="flex h-full items-center justify-center">
							<div className="text-center">
								<p className="text-sm text-muted-foreground">
									No document URL available
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
