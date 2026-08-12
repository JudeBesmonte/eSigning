"use client"

import { AddSignersButton } from "@/features/envelopes-lite/components/actions/add-signers/add-signers-button"
import { DeleteDocumentButton } from "@/features/envelopes-lite/components/actions/delete-document/delete-document-button"
import { DisclosureTriggerButton } from "@/features/envelopes-lite/components/actions/disclosure-trigger/disclosure-trigger-button"
import { DocumentCommentsSheet } from "@/features/envelopes-lite/components/actions/document-comments/document-comments-sheet"
import { PreviewDocumentButton } from "@/features/envelopes-lite/components/actions/preview-document/preview-document-button"

type DocumentStatus = "SIGNED" | "PENDING" | "UNSIGNED" | "REJECTED"

interface Document {
	id: string
	name: string
}

interface EnvelopeActionsProps {
	document: Document
	envelopeId: string
	documentStatus: DocumentStatus
	showAddSigners: boolean
	showDisclosure: boolean
}

export function EnvelopeActions({
	document,
	envelopeId,
	documentStatus,
	showAddSigners,
	showDisclosure
}: EnvelopeActionsProps) {
	return (
		<div className="flex items-center rounded-md border bg-background">
			<PreviewDocumentButton
				documentId={document.id}
				documentName={document.name}
				envelopeId={envelopeId}
				documentStatus={documentStatus}
			/>

			{showAddSigners && (
				<AddSignersButton envelopeId={envelopeId} documentId={document.id} />
			)}

			<DocumentCommentsSheet document={document} envelopeId={envelopeId} />

			{showDisclosure && <DisclosureTriggerButton />}

			<DeleteDocumentButton
				documentId={document.id}
				documentName={document.name}
				envelopeId={envelopeId}
			/>
		</div>
	)
}
