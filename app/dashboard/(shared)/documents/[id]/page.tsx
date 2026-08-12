"use client"

import { use, useState } from "react"
import { toast } from "sonner"

import { useDocumentDetail } from "@/features/documents/[id]/api/use-document-detail"
import { DocumentDetailHeader } from "@/features/documents/[id]/components/document-detail-header"
import { DocumentDetailLoading } from "@/features/documents/[id]/components/document-detail-loading"
import { DocumentTabs } from "@/features/documents/[id]/components/document-tabs"

export default function DocumentDetailPage({
	params
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = use(params)
	const [activeTab, setActiveTab] = useState("overview")

	const {
		document,
		isLoading,
		error,
		addComment,
		sendReminders,
		downloadDocument,
		shareDocument,
		isAddingComment,
		isSendingReminders,
		isDownloading,
		isSharing
	} = useDocumentDetail(id)

	const handleViewFullDocument = () => {
		toast.info("Full Document View", {
			description: "Opening document in full view."
		})
	}

	const handleEdit = () => {
		toast.info("Edit Document", {
			description: "Opening document editor."
		})
	}

	const handleDuplicate = () => {
		toast.info("Duplicate Document", {
			description: "Creating a copy of the document."
		})
	}

	const handleSecure = () => {
		toast.info("Secure Document", {
			description: "Opening security settings."
		})
	}

	const handlePrint = () => {
		toast.info("Print Document", {
			description: "Preparing document for printing."
		})
	}

	const handleAddSigner = () => {
		toast.info("Add Signer", {
			description: "Opening add signer dialog."
		})
	}

	if (isLoading) {
		return <DocumentDetailLoading />
	}

	if (error) {
		return (
			<div className="flex h-96 items-center justify-center">
				<div className="text-center">
					<h3 className="text-lg font-medium text-red-600">
						Error Loading Document
					</h3>
					<p className="text-gray-500">Please try again later.</p>
				</div>
			</div>
		)
	}

	if (!document) {
		return (
			<div className="flex h-96 items-center justify-center">
				<div className="text-center">
					<h3 className="text-lg font-medium text-gray-600">
						Document Not Found
					</h3>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<DocumentDetailHeader
				document={document}
				onDownload={downloadDocument}
				onShare={shareDocument}
				isDownloading={isDownloading}
				isSharing={isSharing}
			/>

			<DocumentTabs
				document={document}
				activeTab={activeTab}
				onTabChange={setActiveTab}
				onAddComment={addComment}
				onSendReminders={sendReminders}
				onAddSigner={handleAddSigner}
				onViewFullDocument={handleViewFullDocument}
				onEdit={handleEdit}
				onDuplicate={handleDuplicate}
				onSecure={handleSecure}
				onPrint={handlePrint}
				isAddingComment={isAddingComment}
				isSendingReminders={isSendingReminders}
			/>
		</div>
	)
}
