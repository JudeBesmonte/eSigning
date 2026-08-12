import { useEffect, useState } from "react"
import {
	AlertTriangle,
	Building2,
	Calendar,
	CheckCircle,
	Clock,
	Download,
	Eye,
	FileText,
	Mail,
	User,
	XCircle
} from "lucide-react"

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
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import { Label } from "@/core/components/ui/label"
import { ScrollArea } from "@/core/components/ui/scroll-area"
import { Separator } from "@/core/components/ui/separator"
import { Textarea } from "@/core/components/ui/textarea"

import { trpc } from "@/services/trpc/client"

interface EnvelopeDetailsModalProps {
	envelope: {
		id: string
		title: string
		description?: string
		status: string
		createdAt: string
		completedAt?: string | null
		createdBy: {
			id: string
			name: string
			email: string
			role: string
			organization?: string
		}
		documents: Array<{
			id: string
			name: string
			status: string
			size: number
			recipients: Array<{
				id: string
				name: string
				email: string
				role: string
				status: string
				signedAt?: string | null
			}>
		}>
	}
	isOpen: boolean
	onClose: () => void
	onApprove?: (comments: string, reason: string) => void
	onReject?: (comments: string, reason: string) => void
}

const getStatusBadge = (status: string) => {
	switch (status) {
		case "COMPLETED":
			return (
				<Badge
					variant="outline"
					className="border-blue-200 bg-blue-50 text-blue-700"
				>
					<Clock className="mr-1 h-3 w-3" />
					Ready for Review
				</Badge>
			)
		case "PENDING_APPROVAL":
			return (
				<Badge
					variant="outline"
					className="border-yellow-200 bg-yellow-50 text-yellow-700"
				>
					<Clock className="mr-1 h-3 w-3" />
					Pending Approval
				</Badge>
			)
		case "APPROVED":
			return (
				<Badge
					variant="outline"
					className="border-green-200 bg-green-50 text-green-700"
				>
					<CheckCircle className="mr-1 h-3 w-3" />
					Approved
				</Badge>
			)
		case "REJECTED":
			return (
				<Badge
					variant="outline"
					className="border-red-200 bg-red-50 text-red-700"
				>
					<XCircle className="mr-1 h-3 w-3" />
					Rejected
				</Badge>
			)
		case "SIGNED":
			return (
				<Badge
					variant="outline"
					className="border-blue-200 bg-blue-50 text-blue-700"
				>
					<CheckCircle className="mr-1 h-3 w-3" />
					Signed
				</Badge>
			)
		case "PENDING":
			return (
				<Badge
					variant="outline"
					className="border-gray-200 bg-gray-50 text-gray-700"
				>
					<Clock className="mr-1 h-3 w-3" />
					Pending
				</Badge>
			)
		default:
			return <Badge variant="outline">{status}</Badge>
	}
}

const formatFileSize = (bytes: number) => {
	if (bytes === 0) return "0 Bytes"
	const k = 1024
	const sizes = ["Bytes", "KB", "MB", "GB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	})
}

export function EnvelopeDetailsModal({
	envelope,
	isOpen,
	onClose,
	onApprove,
	onReject
}: EnvelopeDetailsModalProps) {
	const [comments, setComments] = useState("")
	const [reason, setReason] = useState("")
	const [viewingDocumentId, setViewingDocumentId] = useState<string | null>(
		null
	)

	// Query for document URL when viewing
	const { data: documentData } = trpc.approval.getDocumentForApproval.useQuery(
		{ documentId: viewingDocumentId! },
		{ enabled: !!viewingDocumentId }
	)

	// Open document when data is available
	useEffect(() => {
		if (documentData?.url && viewingDocumentId) {
			window.open(documentData.url, "_blank")
			setViewingDocumentId(null)
		}
	}, [documentData, viewingDocumentId])

	const handleApprovalAction = (action: "approve" | "reject") => {
		if (action === "approve" && onApprove) {
			onApprove(comments, reason)
		} else if (action === "reject" && onReject) {
			onReject(comments, reason)
		}
		setComments("")
		setReason("")
	}

	const handleViewDocument = (documentId: string) => {
		setViewingDocumentId(documentId)
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			<AlertDialogContent className="max-h-[90vh] max-w-4xl">
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center justify-between">
						<span>{envelope.title}</span>
						{getStatusBadge(envelope.status)}
					</AlertDialogTitle>
					<AlertDialogDescription>
						Review envelope details and approve or reject the signature request
					</AlertDialogDescription>
				</AlertDialogHeader>

				<ScrollArea className="max-h-[60vh]">
					<div className="space-y-6">
						{/* Envelope Information */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Envelope Information</h3>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-3">
									<div>
										<Label className="text-sm font-medium">Created by</Label>
										<div className="mt-1 flex items-center space-x-2">
											<User className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm">{envelope.createdBy.name}</span>
										</div>
									</div>
									<div>
										<Label className="text-sm font-medium">Email</Label>
										<div className="mt-1 flex items-center space-x-2">
											<Mail className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm">
												{envelope.createdBy.email}
											</span>
										</div>
									</div>
									{envelope.createdBy.organization && (
										<div>
											<Label className="text-sm font-medium">
												Organization
											</Label>
											<div className="mt-1 flex items-center space-x-2">
												<Building2 className="h-4 w-4 text-muted-foreground" />
												<span className="text-sm">
													{envelope.createdBy.organization}
												</span>
											</div>
										</div>
									)}
								</div>
								<div className="space-y-3">
									<div>
										<Label className="text-sm font-medium">Created Date</Label>
										<div className="mt-1 flex items-center space-x-2">
											<Calendar className="h-4 w-4 text-muted-foreground" />
											<span className="text-sm">
												{formatDate(envelope.createdAt)}
											</span>
										</div>
									</div>
									<div>
										<Label className="text-sm font-medium">Role</Label>
										<div className="mt-1">
											<Badge variant="secondary">
												{envelope.createdBy.role}
											</Badge>
										</div>
									</div>
								</div>
							</div>
							{envelope.description && (
								<div>
									<Label className="text-sm font-medium">Description</Label>
									<p className="mt-1 text-sm text-muted-foreground">
										{envelope.description}
									</p>
								</div>
							)}
						</div>

						<Separator />

						{/* Documents */}
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Documents</h3>
							<div className="space-y-3">
								{envelope.documents
									.filter((document) => !document.name.includes("_signed.pdf"))
									.map((document) => (
										<Card key={document.id}>
											<CardContent className="p-4">
												<div className="flex items-center justify-between">
													<div className="flex items-center space-x-3">
														<FileText className="h-8 w-8 text-blue-500" />
														<div>
															<h4 className="font-medium">{document.name}</h4>
															<div className="flex items-center space-x-2 text-sm text-muted-foreground">
																<span>{formatFileSize(document.size)}</span>
															</div>
														</div>
													</div>
													<div className="flex space-x-2">
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleViewDocument(document.id)}
														>
															<Eye className="mr-2 h-4 w-4" />
															View
														</Button>
														<Button variant="outline" size="sm">
															<Download className="mr-2 h-4 w-4" />
															Download
														</Button>
													</div>
												</div>

												{/* Recipients for this document */}
												{document.recipients.length > 0 && (
													<div className="mt-4">
														<Label className="text-sm font-medium">
															Recipients
														</Label>
														<div className="mt-2 space-y-2">
															{document.recipients.map((recipient) => (
																<div
																	key={recipient.id}
																	className="flex items-center justify-between rounded-lg bg-muted p-2"
																>
																	<div className="flex items-center space-x-2">
																		<User className="h-4 w-4 text-muted-foreground" />
																		<span className="text-sm font-medium">
																			{recipient.name}
																		</span>
																		<span className="text-sm text-muted-foreground">
																			({recipient.email})
																		</span>
																		<Badge
																			variant="outline"
																			className="text-xs"
																		>
																			{recipient.role}
																		</Badge>
																	</div>
																	<div className="flex items-center space-x-2">
																		{getStatusBadge(recipient.status)}
																		{recipient.signedAt && (
																			<span className="text-xs text-muted-foreground">
																				Signed: {formatDate(recipient.signedAt)}
																			</span>
																		)}
																	</div>
																</div>
															))}
														</div>
													</div>
												)}
											</CardContent>
										</Card>
									))}
							</div>
						</div>

						{/* Approval Section - Only show for pending envelopes */}
						{envelope.status === "PENDING_APPROVAL" && (
							<>
								<Separator />
								<div className="space-y-4">
									<h3 className="text-lg font-semibold">
										Administrative Review
									</h3>
									<div className="space-y-3">
										<div>
											<Label htmlFor="comments" className="text-sm font-medium">
												Comments (Optional)
											</Label>
											<Textarea
												id="comments"
												placeholder="Add any comments about this envelope..."
												value={comments}
												onChange={(e) => setComments(e.target.value)}
												className="mt-1"
												rows={3}
											/>
										</div>
										<div>
											<Label htmlFor="reason" className="text-sm font-medium">
												Reason (Optional)
											</Label>
											<Textarea
												id="reason"
												placeholder="Provide a reason for your decision..."
												value={reason}
												onChange={(e) => setReason(e.target.value)}
												className="mt-1"
												rows={2}
											/>
										</div>
									</div>
								</div>
							</>
						)}
					</div>
				</ScrollArea>

				<AlertDialogFooter>
					<AlertDialogCancel>Close</AlertDialogCancel>
					{envelope.status === "PENDING_APPROVAL" && (
						<div className="flex space-x-2">
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="destructive">
										<XCircle className="mr-2 h-4 w-4" />
										Reject
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle className="flex items-center space-x-2">
											<AlertTriangle className="h-5 w-5 text-destructive" />
											<span>Reject Envelope</span>
										</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to reject this envelope? This action
											cannot be undone and will notify all participants.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											className="bg-destructive hover:bg-destructive/90"
											onClick={() => handleApprovalAction("reject")}
										>
											Reject Envelope
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>

							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button className="bg-green-600 hover:bg-green-700">
										<CheckCircle className="mr-2 h-4 w-4" />
										Approve
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle className="flex items-center space-x-2">
											<CheckCircle className="h-5 w-5 text-green-600" />
											<span>Approve Envelope</span>
										</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to approve this envelope? This will
											finalize the approval process.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											className="bg-green-600 hover:bg-green-700"
											onClick={() => handleApprovalAction("approve")}
										>
											Approve Envelope
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					)}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
