import React from "react"
import { MessageSquare } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from "@/core/components/ui/tabs"

import { DocumentMessageSheet } from "@/features/to-sign/components/document-message-sheet"

import type { DocumentDetail } from "../api/use-document-detail"
import { DocumentComments } from "./document-comments"
import { DocumentDetailsSidebar } from "./document-details-sidebar"
import { DocumentHistory } from "./document-history"
import { DocumentPreview } from "./document-preview"
import { DocumentSigners } from "./document-signers"
import { SigningStatus } from "./signing-status"

interface DocumentTabsProps {
	document: DocumentDetail
	activeTab: string
	onTabChange: (tab: string) => void
	onAddComment: (comment: string) => void
	onSendReminders: () => void
	onAddSigner?: () => void
	onViewFullDocument?: () => void
	onEdit?: () => void
	onDuplicate?: () => void
	onSecure?: () => void
	onPrint?: () => void
	isAddingComment?: boolean
	isSendingReminders?: boolean
}

export const DocumentTabs: React.FC<DocumentTabsProps> = ({
	document,
	activeTab,
	onTabChange,
	onAddComment,
	onSendReminders,
	onAddSigner,
	onViewFullDocument,
	onEdit,
	onDuplicate,
	onSecure,
	onPrint,
	isAddingComment,
	isSendingReminders
}) => {
	return (
		<Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
			<TabsList className="grid grid-cols-5 md:w-[750px]">
				<TabsTrigger value="overview">Overview</TabsTrigger>
				<TabsTrigger value="signers">Signers</TabsTrigger>
				<TabsTrigger value="history">History</TabsTrigger>
				<TabsTrigger value="comments">Comments</TabsTrigger>
				<TabsTrigger value="messages">Messages</TabsTrigger>
			</TabsList>

			{/* Overview Tab */}
			<TabsContent value="overview" className="space-y-6">
				<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
					<DocumentPreview
						document={document}
						onViewFullDocument={onViewFullDocument}
					/>

					<DocumentDetailsSidebar
						document={document}
						onEdit={onEdit}
						onDuplicate={onDuplicate}
						onSecure={onSecure}
						onPrint={onPrint}
					/>
				</div>
			</TabsContent>
			{/* Overview Tab */}
			<TabsContent value="overview" className="space-y-6">
				<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
					<DocumentPreview
						document={document}
						onViewFullDocument={onViewFullDocument}
					/>

					<DocumentDetailsSidebar
						document={document}
						onEdit={onEdit}
						onDuplicate={onDuplicate}
						onSecure={onSecure}
						onPrint={onPrint}
					/>
				</div>

				<SigningStatus
					document={document}
					onSendReminders={onSendReminders}
					isSendingReminders={isSendingReminders}
				/>
			</TabsContent>

			{/* Signers Tab */}
			<TabsContent value="signers" className="space-y-6">
				<DocumentSigners
					document={document}
					onSendReminders={onSendReminders}
					onAddSigner={onAddSigner}
					isSendingReminders={isSendingReminders}
				/>
			</TabsContent>

			{/* History Tab */}
			<TabsContent value="history" className="space-y-6">
				<DocumentHistory document={document} />
			</TabsContent>

			{/* Comments Tab */}
			<TabsContent value="comments" className="space-y-6">
				<DocumentComments
					document={document}
					onAddComment={onAddComment}
					isAddingComment={isAddingComment}
				/>
			</TabsContent>

			{/* Comments Tab */}
			<TabsContent value="comments" className="space-y-6">
				<DocumentComments
					document={document}
					onAddComment={onAddComment}
					isAddingComment={isAddingComment}
				/>
			</TabsContent>

			{/* Messages Tab */}
			<TabsContent value="messages" className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-lg font-semibold">Document Messages</h3>
						<p className="text-sm text-muted-foreground">
							Chat with participants about this document
						</p>
					</div>
					<DocumentMessageSheet
						documentId={document.id}
						documentName={document.title}
						envelopeId="envelope-1"
						envelopeTitle="Document Envelope"
						trigger={
							<Button>
								<MessageSquare className="mr-2 h-4 w-4" />
								Open Chat
							</Button>
						}
					/>
				</div>

				<div className="rounded-lg border p-4 text-center text-muted-foreground">
					<MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
					<p>
						Click &quot;Open Chat&quot; to start messaging about this document
					</p>
				</div>
			</TabsContent>
		</Tabs>
	)
}
