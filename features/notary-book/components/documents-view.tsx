import { useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
	Check,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Clock,
	Download,
	FileSignature,
	FileText,
	Mail,
	User,
	X,
	XCircle
} from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
// Import necessary components
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"

import type { Document } from "../types"
import { RecipientRole, RecipientStatus } from "../types"

interface Signer {
	id: string
	name: string
	email: string
	status: RecipientStatus
	role: RecipientRole
}

type DocumentsViewProps = {
	documents: Document[]
	onDocumentClick?: (documentId: string) => void
}

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes"
	const k = 1024
	const sizes = ["Bytes", "KB", "MB", "GB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const getStatusVariant = (status?: RecipientStatus | null) => {
	if (!status) return "outline"

	switch (status) {
		case RecipientStatus.SIGNED:
		case RecipientStatus.APPROVED:
			return "default" // Changed from 'success' to 'default'
		case RecipientStatus.DECLINED:
		case RecipientStatus.REJECTED:
		case RecipientStatus.EXPIRED:
			return "destructive"
		case RecipientStatus.PENDING:
			return "secondary"
		case RecipientStatus.VIEWED:
		case RecipientStatus.PUBLISHED:
			return "default"
		default:
			return "outline"
	}
}

const getStatusInfo = (status?: string | null) => {
	// Handle undefined, null, or empty status
	if (!status) {
		return {
			color: "bg-muted text-muted-foreground",
			icon: FileText,
			label: "Unknown"
		}
	}

	const statusLower = status.toLowerCase()
	if (statusLower === "signed") {
		return {
			color: "bg-green-500/10 text-green-600 dark:text-green-400",
			icon: CheckCircle2,
			label: "Signed"
		}
	} else if (statusLower === "pending") {
		return {
			color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
			icon: Clock,
			label: "Pending"
		}
	} else if (statusLower === "declined" || statusLower === "rejected") {
		return {
			color: "bg-destructive/10 text-destructive",
			icon: XCircle,
			label: statusLower.charAt(0).toUpperCase() + statusLower.slice(1)
		}
	} else if (statusLower === "approved") {
		return {
			color: "bg-green-500/10 text-green-600 dark:text-green-400",
			icon: Check,
			label: "Approved"
		}
	} else if (statusLower === "viewed") {
		return {
			color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
			icon: FileText,
			label: "Viewed"
		}
	} else {
		return {
			color: "bg-muted text-muted-foreground",
			icon: FileText,
			label: statusLower.charAt(0).toUpperCase() + statusLower.slice(1)
		}
	}
}

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50] as const

// Move PaginationControls component outside to avoid hoisting issues
const PaginationControls = ({
	currentPage,
	totalPages,
	itemsPerPage,
	totalItems,
	onPageChange,
	onItemsPerPageChange
}: {
	currentPage: number
	totalPages: number
	itemsPerPage: number
	totalItems: number
	onPageChange: (page: number) => void
	onItemsPerPageChange: (value: string) => void
}) => (
	<div className="flex items-center justify-between rounded-b-lg border-t border-border bg-card px-2 py-3">
		<div className="flex items-center space-x-2">
			<p className="text-sm text-muted-foreground">
				Showing{" "}
				<span className="font-medium">
					{(currentPage - 1) * itemsPerPage + 1}
				</span>{" "}
				to{" "}
				<span className="font-medium">
					{Math.min(currentPage * itemsPerPage, totalItems)}
				</span>{" "}
				of <span className="font-medium">{totalItems}</span> documents
			</p>
		</div>

		<div className="flex items-center space-x-2">
			<div className="flex items-center space-x-1">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(1)}
					disabled={currentPage === 1}
					className="h-8 w-8 p-0"
				>
					<ChevronsLeft className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(Math.max(1, currentPage - 1))}
					disabled={currentPage === 1}
					className="h-8 w-8 p-0"
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>

				<div className="flex items-center space-x-1">
					<Input
						type="number"
						min={1}
						max={totalPages}
						value={currentPage}
						onChange={(e) => {
							const page = parseInt(e.target.value)
							if (!isNaN(page) && page >= 1 && page <= totalPages) {
								onPageChange(page)
							}
						}}
						className="h-8 w-16 text-center text-sm"
					/>
					<span className="text-sm text-muted-foreground">/ {totalPages}</span>
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
					disabled={currentPage >= totalPages}
					className="h-8 w-8 p-0"
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(totalPages)}
					disabled={currentPage >= totalPages}
					className="h-8 w-8 p-0"
				>
					<ChevronsRight className="h-4 w-4" />
				</Button>
			</div>

			<div className="flex items-center space-x-2">
				<p className="text-sm text-muted-foreground">Rows per page</p>
				<Select
					value={itemsPerPage.toString()}
					onValueChange={onItemsPerPageChange}
				>
					<SelectTrigger className="h-8 w-[70px]">
						<SelectValue placeholder={itemsPerPage} />
					</SelectTrigger>
					<SelectContent>
						{ITEMS_PER_PAGE_OPTIONS.map((size) => (
							<SelectItem key={size} value={size.toString()}>
								{size}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	</div>
)

export function DocumentsView({
	documents,
	onDocumentClick: _onDocumentClick
}: DocumentsViewProps) {
	const [selectedDocument, setSelectedDocument] = useState<Document | null>(
		null
	)
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState<number>(10)

	// Calculate pagination
	const paginatedDocuments = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage
		return documents.slice(startIndex, startIndex + itemsPerPage)
	}, [documents, currentPage, itemsPerPage])

	const totalPages = Math.ceil(documents.length / itemsPerPage)

	// Reset to first page when items per page changes
	useEffect(() => {
		setCurrentPage(1)
	}, [itemsPerPage])

	const handleItemsPerPageChange = (value: string) => {
		setItemsPerPage(Number(value))
		setCurrentPage(1) // Reset to first page when changing items per page
	}

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}
	console.log("DocumentsView received documents count:", documents?.length)
	console.log(
		"DocumentsView received documents:",
		JSON.stringify(documents, null, 2)
	)

	// Log document structure for debugging
	useEffect(() => {
		if (documents && documents.length > 0 && documents[0]) {
			const doc = documents[0]
			console.log("First document structure:", {
				id: doc.id,
				name: doc.name,
				type: doc.type,
				hasRecipients: doc.recipients && doc.recipients.length > 0,
				recipientCount: doc.recipients?.length,
				status: doc.status
			})
		}
	}, [documents])

	const handleDocumentClick = (doc: Document) => {
		setSelectedDocument(doc)
		if (_onDocumentClick) {
			_onDocumentClick(doc.id)
		}
	}

	interface RecipientWithOptionalUser {
		id: string
		role: RecipientRole
		status: RecipientStatus
		user?: {
			id: string
			name: string | null
			email: string | null
		} | null
		email?: string
		name?: string
	}

	const getDocumentSigners = (doc: Document): Signer[] => {
		console.log("getDocumentSigners called with doc:", {
			id: doc.id,
			name: doc.name,
			hasSigners: !!doc.signers?.length,
			hasRecipients: !!doc.recipients?.length,
			recipients: doc.recipients?.map((r) => ({
				id: r.id,
				role: r.role,
				status: r.status,
				hasUser: !!r.user,
				user: r.user
					? { id: r.user.id, name: r.user.name, email: r.user.email }
					: null
			}))
		})

		// Handle case where signers are directly available
		if (doc.signers?.length) {
			return doc.signers
		}

		// Handle case where we need to extract signers from recipients
		if (doc.recipients?.length) {
			const signers = doc.recipients
				.filter((recipient: RecipientWithOptionalUser) => {
					// Include both SIGNER and APPROVER roles as potential signers
					const isSignerOrApprover =
						recipient.role === RecipientRole.SIGNER ||
						recipient.role === RecipientRole.APPROVER

					// Check if we have either a valid user object or at least an email
					const hasUserInfo =
						(recipient.user !== null && recipient.user !== undefined) ||
						recipient.email !== undefined

					console.log(
						`Recipient ${recipient.id}: isSignerOrApprover=${isSignerOrApprover}, hasUserInfo=${hasUserInfo}`
					)
					return isSignerOrApprover && hasUserInfo
				})
				.map((recipient: RecipientWithOptionalUser) => {
					// Use user object if available, otherwise fall back to recipient fields
					const name =
						recipient.user?.name ?? recipient.name ?? "Unknown Signer"
					const email = recipient.user?.email ?? recipient.email ?? "No email"

					return {
						id: recipient.id,
						name,
						email,
						status: recipient.status,
						role: recipient.role
					}
				})

			console.log(
				`Found ${signers.length} signers for document ${doc.id}`,
				signers
			)
			return signers
		}

		console.warn("No signers or recipients found for document:", doc.id)
		return []
	}

	if (!documents || documents.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border bg-card p-6 py-12 text-center">
				<FileText className="mb-4 h-12 w-12 text-muted-foreground/40" />
				<h3 className="text-lg font-medium text-muted-foreground">
					No documents found
				</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					Upload a document to get started
				</p>
			</div>
		)
	}

	if (selectedDocument) {
		const statusInfo = getStatusInfo(selectedDocument.status)
		const StatusIcon = statusInfo.icon
		const lastUpdated =
			selectedDocument.updatedAt ??
			selectedDocument.createdAt ??
			selectedDocument.date
		const timeAgo = formatDistanceToNow(new Date(lastUpdated), {
			addSuffix: true
		})

		return (
			<div className="space-y-4">
				<div className="rounded-lg border bg-card p-6">
					<div className="mb-6 flex items-center justify-between">
						<h2 className="text-xl font-semibold">Document Details</h2>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setSelectedDocument(null)}
							>
								<ChevronLeft className="mr-1 h-4 w-4" />
								Back to List
							</Button>
							<Button variant="outline" size="sm">
								<Download className="mr-1 h-4 w-4" />
								Download
							</Button>
						</div>
					</div>

					<div className="flex items-start justify-between">
						<div className="flex items-start gap-4">
							<div
								className={`rounded-lg p-3 ${statusInfo.color} flex-shrink-0`}
							>
								<FileText className="h-6 w-6" />
							</div>
							<div>
								<h3 className="text-lg font-medium">{selectedDocument.name}</h3>
								<div className="mt-1 flex items-center gap-2">
									<span
										className={`rounded-full px-2 py-1 text-xs ${statusInfo.color}`}
									>
										<StatusIcon className="-mt-0.5 mr-1 inline h-3 w-3" />
										{statusInfo.label}
									</span>
									<span className="text-xs text-muted-foreground">
										Updated {timeAgo}
									</span>
								</div>
							</div>
						</div>
					</div>

					<div className="mt-6 border-t pt-6">
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div>
								<h4 className="mb-2 text-sm font-medium text-muted-foreground">
									Document Information
								</h4>
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Size</span>
										<span>{formatFileSize(selectedDocument.size)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Type</span>
										<span>{selectedDocument.type ?? "Document"}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Created</span>
										<span>
											{format(new Date(selectedDocument.date), "MMM d, yyyy")}
										</span>
									</div>
									{selectedDocument.notarized && (
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">
												Notarization
											</span>
											<span className="flex items-center gap-1 text-green-600 dark:text-green-400">
												<CheckCircle2 className="h-3.5 w-3.5" />
												Notarized
											</span>
										</div>
									)}
								</div>
							</div>

							<div>
								<h4 className="mb-2 text-sm font-medium text-muted-foreground">
									Signatures
								</h4>
								<div className="space-y-3">
									{(() => {
										const signers = getDocumentSigners(selectedDocument)
										if (signers.length === 0) {
											return (
												<div
													key="no-signers"
													className="flex items-center gap-2 text-sm text-muted-foreground"
												>
													<FileSignature className="h-4 w-4" />
													No signers assigned
												</div>
											)
										}

										return signers.map((signer) => (
											<div
												key={signer.id}
												className="flex items-center justify-between py-1.5 text-sm"
											>
												<div className="flex items-center gap-3">
													<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
														<User className="h-4 w-4 text-muted-foreground" />
													</div>
													<div>
														<p className="flex items-center gap-1 font-medium">
															{signer.name}
															{signer.status === RecipientStatus.SIGNED && (
																<Check className="h-3 w-3 text-green-500" />
															)}
															{signer.status === RecipientStatus.REJECTED && (
																<X className="h-3 w-3 text-destructive" />
															)}
														</p>
														<div className="flex items-center gap-1 text-xs text-muted-foreground">
															<Mail className="h-3 w-3" />
															{signer.email}
														</div>
													</div>
												</div>
												<Badge
													variant={getStatusVariant(signer.status)}
													className="text-xs capitalize"
												>
													{signer.status
														? signer.status.toLowerCase().replace(/_/g, " ")
														: "unknown"}
												</Badge>
											</div>
										))
									})()}
								</div>
							</div>
						</div>

						{selectedDocument.description && (
							<div className="mt-6 border-t pt-6">
								<h4 className="mb-2 text-sm font-medium text-muted-foreground">
									Description
								</h4>
								<p className="text-sm">{selectedDocument.description}</p>
							</div>
						)}
					</div>
				</div>
				{documents.length > 0 && (
					<PaginationControls
						currentPage={currentPage}
						totalPages={totalPages}
						itemsPerPage={itemsPerPage}
						totalItems={documents.length}
						onPageChange={handlePageChange}
						onItemsPerPageChange={handleItemsPerPageChange}
					/>
				)}
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="rounded-lg border bg-card p-6">
				<div className="space-y-4">
					{paginatedDocuments.map((document) => {
						const statusInfo = getStatusInfo(document.status)
						const StatusIcon = statusInfo.icon
						const lastUpdated =
							document.updatedAt ?? document.createdAt ?? document.date
						const timeAgo = formatDistanceToNow(new Date(lastUpdated), {
							addSuffix: true
						})

						return (
							<div
								key={document.id}
								onClick={() => handleDocumentClick(document)}
								className="group cursor-pointer rounded-lg border bg-background p-4 text-card-foreground shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
							>
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-4">
										<div
											className={`rounded-lg p-2.5 ${statusInfo.color} flex-shrink-0`}
										>
											<StatusIcon className="h-5 w-5" />
										</div>
										<div className="space-y-1">
											<h3 className="font-medium transition-colors group-hover:text-primary">
												{document.name}
											</h3>
											<div className="flex flex-wrap items-center gap-2">
												<span
													className={`rounded-full px-2 py-1 text-xs ${statusInfo.color}`}
												>
													{statusInfo.label}
												</span>
												<span className="text-xs text-muted-foreground">
													{formatFileSize(document.size)} • {timeAgo}
												</span>
											</div>

											<div className="mt-2 flex items-center gap-2">
												{document.notarized && (
													<span className="flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-xs text-primary">
														<CheckCircle2 className="h-3 w-3" />
														Notarized
													</span>
												)}

												{document.signers?.some(
													(s) => s.status === RecipientStatus.SIGNED
												) && (
													<span className="flex items-center gap-1 rounded bg-green-500/10 px-2 py-1 text-xs text-green-600 dark:text-green-400">
														<FileSignature className="h-3 w-3" />
														{
															document.signers.filter(
																(s) => s.status === RecipientStatus.SIGNED
															).length
														}{" "}
														signed
													</span>
												)}
											</div>
										</div>
									</div>

									<div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
										<button
											className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
											onClick={(e) => {
												e.stopPropagation()
												// Handle download
											}}
										>
											<Download className="h-4 w-4" />
										</button>
									</div>
								</div>
							</div>
						)
					})}
				</div>
				{documents.length > 0 && (
					<PaginationControls
						currentPage={currentPage}
						totalPages={totalPages}
						itemsPerPage={itemsPerPage}
						totalItems={documents.length}
						onPageChange={handlePageChange}
						onItemsPerPageChange={handleItemsPerPageChange}
					/>
				)}
			</div>
		</div>
	)
}
