import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import {
	AlertCircle,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Clock as ClockIcon,
	Mail,
	XCircle
} from "lucide-react"

import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from "@/core/components/ui/avatar"
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"
import { cn } from "@/core/lib/utils"

import { trpc } from "@/services/trpc/client"

import type {
	Document,
	Envelope,
	Recipient,
	RecipientRole,
	RecipientStatus,
	Signer
} from "../types"

// Extended type to include the user relation
interface RecipientWithUser extends Recipient {
	user?: {
		id: string
		name: string | null
		email: string | null
	} | null
	email?: string // For backward compatibility
}

// Define interfaces for the input document structure
interface InputDocument {
	id?: string | number
	name?: unknown
	size?: unknown
	type?: unknown
	description?: unknown
	updatedAt?: string | number | Date
	signers?: Array<{
		id?: unknown
		name?: unknown
		email?: unknown
		status?: unknown
		role?: unknown
	}>
	recipients?: Array<{
		id?: unknown
		role?: unknown
		status?: unknown
		user?: {
			id?: unknown
			name?: unknown
			email?: unknown
		}
		email?: unknown
		name?: unknown
	}>
	[key: string]: unknown
}

// Helper function to safely get string value
const getString = (value: unknown, defaultValue = ""): string => {
	if (value === null || value === undefined) return defaultValue

	// Handle primitive types explicitly
	switch (typeof value) {
		case "string":
			return value
		case "number":
		case "boolean":
		case "bigint":
		case "symbol":
			return value.toString()
		case "function":
			return "[Function]"
		case "object":
			// Handle Date objects
			if (value instanceof Date) {
				return value.toISOString()
			}
			// Handle arrays
			if (Array.isArray(value)) {
				return `[${value.map((v) => getString(v, "")).join(", ")}]`
			}
			// For objects, try to create a string representation
			try {
				const entries = Object.entries(value).map(
					([k, v]) => `${k}: ${getString(v, "")}`
				)
				return entries.length > 0 ? `{ ${entries.join(", ")} }` : "{}"
			} catch {
				return "[Object]"
			}
		default:
			// This should never happen as all possible types are covered above
			return ""
	}
}

// Helper function to safely get number value
const getNumber = (value: unknown, defaultValue = 0): number => {
	if (typeof value === "number") return value
	if (typeof value === "string") {
		const num = parseFloat(value)
		return isNaN(num) ? defaultValue : num
	}
	return defaultValue
}

// Status configuration type
type StatusInfo = {
	color: string
	icon: React.ComponentType<{ className?: string }>
	label: string
	bg: string
}

type StatusKey =
	| "COMPLETED"
	| "PUBLISHED"
	| "DRAFT"
	| "DECLINED"
	| "REJECTED"
	| "CANCELLED"
	| "EXPIRED"
	| "PENDING_APPROVAL"
	| "APPROVED"

// Status badge configuration
const statusConfig: Record<StatusKey, StatusInfo> = {
	COMPLETED: {
		color: "text-green-600 dark:text-green-400",
		icon: CheckCircle2,
		label: "Completed",
		bg: "bg-green-500/10"
	},
	PUBLISHED: {
		color: "text-blue-600 dark:text-blue-400",
		icon: CheckCircle2,
		label: "Published",
		bg: "bg-blue-500/10"
	},
	DRAFT: {
		color: "text-gray-600 dark:text-gray-400",
		icon: ClockIcon,
		label: "Draft",
		bg: "bg-gray-500/10"
	},
	DECLINED: {
		color: "text-red-600 dark:text-red-400",
		icon: XCircle,
		label: "Declined",
		bg: "bg-red-500/10"
	},
	REJECTED: {
		color: "text-red-600 dark:text-red-400",
		icon: XCircle,
		label: "Rejected",
		bg: "bg-red-500/10"
	},
	CANCELLED: {
		color: "text-gray-600 dark:text-gray-400",
		icon: XCircle,
		label: "Cancelled",
		bg: "bg-gray-500/10"
	},
	EXPIRED: {
		color: "text-amber-600 dark:text-amber-400",
		icon: AlertCircle,
		label: "Expired",
		bg: "bg-amber-500/10"
	},
	PENDING_APPROVAL: {
		color: "text-amber-600 dark:text-amber-400",
		icon: ClockIcon,
		label: "Pending Approval",
		bg: "bg-amber-500/10"
	},
	APPROVED: {
		color: "text-green-600 dark:text-green-400",
		icon: CheckCircle2,
		label: "Approved",
		bg: "bg-green-500/10"
	}
} as const

function getStatusInfo(status: string): StatusInfo {
	const statusKey = status as StatusKey
	return (
		statusConfig[statusKey] || {
			color: "text-gray-600 dark:text-gray-400",
			icon: ClockIcon,
			label: status,
			bg: "bg-gray-500/10"
		}
	)
}

interface EnvelopesViewProps {
	envelopes: Envelope[]
	onEnvelopeClick?: (envelopeId: string) => void
	className?: string
	selectedEnvelopeId?: string | null
}

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50] as const

export function EnvelopesView({
	envelopes: allEnvelopes = [],
	onEnvelopeClick,
	className,
	selectedEnvelopeId: externalSelectedEnvelopeId
}: EnvelopesViewProps) {
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState<number>(10)

	// Calculate paginated envelopes
	const { paginatedEnvelopes, totalPages } = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage
		const endIndex = startIndex + itemsPerPage
		const paginated = allEnvelopes.slice(startIndex, endIndex)

		return {
			paginatedEnvelopes: paginated,
			totalPages: Math.max(1, Math.ceil(allEnvelopes.length / itemsPerPage))
		}
	}, [allEnvelopes, currentPage, itemsPerPage])

	// Reset to first page when items per page changes or when allEnvelopes changes
	useEffect(() => {
		setCurrentPage(1)
	}, [itemsPerPage, allEnvelopes])

	// Reset to first page if current page is out of bounds
	useEffect(() => {
		if (currentPage > totalPages && totalPages > 0) {
			setCurrentPage(totalPages)
		}
	}, [totalPages, currentPage])

	// Use paginated envelopes for rendering
	const envelopes = paginatedEnvelopes

	const [selectedEnvelopeId, setSelectedEnvelopeId] = useState<string | null>(
		null
	)
	// Removed unused documents state as it's not being used
	const [, setDocuments] = useState<Document[]>([])

	// Update selected envelope when externalSelectedEnvelopeId changes
	useEffect(() => {
		if (externalSelectedEnvelopeId && envelopes?.length) {
			const envelope = envelopes.find(
				(env) => env.id === externalSelectedEnvelopeId
			)
			if (envelope) {
				setSelectedEnvelopeId(envelope.id)
			}
		} else if (!externalSelectedEnvelopeId) {
			setSelectedEnvelopeId(null)
		}
	}, [externalSelectedEnvelopeId, envelopes])

	// Fetch documents when selectedEnvelopeId changes
	const { data: response, isLoading } = trpc.notaryBook.list.useQuery(
		{
			envelopeId: selectedEnvelopeId ?? undefined,
			entryType: "DOCUMENT",
			take: 100 // Adjust the number as needed
		},
		{
			refetchOnWindowFocus: false,
			enabled: !!selectedEnvelopeId
		}
	)

	// Transform documents data when response changes
	useEffect(() => {
		if (!response?.items?.length) {
			setDocuments([])
			return
		}

		const transformDocument = (doc: unknown): Document => {
			if (!doc || typeof doc !== "object") {
				return {
					id: Date.now().toString(),
					name: "Document " + Date.now(),
					status: "pending",
					date: new Date().toISOString(),
					size: 0,
					notarized: false
				}
			}

			const inputDoc = doc as InputDocument

			// Handle date with proper type checking
			let date: string
			try {
				if (
					inputDoc.updatedAt &&
					(typeof inputDoc.updatedAt === "string" ||
						typeof inputDoc.updatedAt === "number")
				) {
					const parsedDate = new Date(inputDoc.updatedAt)
					date = !isNaN(parsedDate.getTime())
						? parsedDate.toISOString()
						: new Date().toISOString()
				} else {
					date = new Date().toISOString()
				}
			} catch (e) {
				console.error("Error parsing date:", e)
				date = new Date().toISOString()
			}

			// Create base document with safe property access
			let transformedDoc: Document = {
				id: getString(inputDoc.id, Date.now().toString()),
				name: getString(inputDoc.name, `Document ${Date.now()}`),
				status: "pending",
				date,
				size: getNumber(inputDoc.size),
				notarized: false,
				type: getString(inputDoc.type, "document"),
				description: (() => {
					const desc = inputDoc.description
					if (!desc) return undefined
					if (typeof desc === "string") return desc
					if (desc && typeof desc === "object" && "text" in desc) {
						return typeof desc.text === "string" ? desc.text : undefined
					}
					try {
						const str = JSON.stringify(desc)
						return typeof str === "string" ? str : undefined
					} catch {
						return undefined
					}
				})()
			}

			// Handle signers if they exist
			if (Array.isArray(inputDoc.signers)) {
				const signers: Signer[] = inputDoc.signers.map((signer) => ({
					id: getString(signer.id, Date.now().toString()),
					name: getString(signer.name, "Unknown Signer"),
					email: getString(signer.email, ""),
					status: (signer.status as RecipientStatus) ?? "PENDING",
					role: (signer.role as RecipientRole) ?? "SIGNER"
				}))

				transformedDoc = {
					...transformedDoc,
					signers
				}
			}

			// Handle recipients if they exist
			if (Array.isArray(inputDoc.recipients)) {
				const recipients = inputDoc.recipients.map((recipient) => {
					const baseRecipient = {
						id: getString(recipient.id, Date.now().toString()),
						role: (recipient.role as RecipientRole) ?? "SIGNER",
						status: (recipient.status as RecipientStatus) ?? "PENDING"
					}

					// Add user if exists
					if (recipient.user) {
						return {
							...baseRecipient,
							user: {
								id: getString(recipient.user.id, ""),
								name:
									recipient.user.name !== undefined
										? getString(recipient.user.name)
										: null,
								email:
									recipient.user.email !== undefined
										? getString(recipient.user.email)
										: null
							},
							...(recipient.email ? { email: getString(recipient.email) } : {}),
							...(recipient.name ? { name: getString(recipient.name) } : {})
						}
					}

					// Add email and name directly if no user object
					return {
						...baseRecipient,
						...(recipient.email ? { email: getString(recipient.email) } : {}),
						...(recipient.name ? { name: getString(recipient.name) } : {})
					}
				})

				transformedDoc = {
					...transformedDoc,
					recipients
				}
			}

			return transformedDoc
		}

		// Transform all documents from the response
		const newDocuments = response.items.map((doc) => transformDocument(doc))
		setDocuments(newDocuments)
	}, [response])

	const handleEnvelopeClick = (envelope: Envelope) => {
		setSelectedEnvelopeId(envelope.id)
		if (onEnvelopeClick) {
			onEnvelopeClick(envelope.id)
		}
	}

	// Show loading state
	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
			</div>
		)
	}

	// Show loading state
	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
			</div>
		)
	}

	// Handle empty state
	if (!allEnvelopes || allEnvelopes.length === 0) {
		return (
			<div className="space-y-2 py-12 text-center">
				<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
					<Mail className="h-6 w-6 text-muted-foreground" />
				</div>
				<h3 className="text-lg font-medium">No envelopes found</h3>
				<p className="text-sm text-muted-foreground">
					When you send or receive documents, they&apos;ll appear here
				</p>
			</div>
		)
	}

	// Pagination controls component
	const PaginationControls = () => (
		<div className="flex items-center justify-between rounded-b-lg border-t border-border bg-card px-2 py-3">
			<div className="flex items-center space-x-2">
				<p className="text-sm text-muted-foreground">
					Showing{" "}
					<span className="font-medium">
						{(currentPage - 1) * itemsPerPage + 1}
					</span>{" "}
					to{" "}
					<span className="font-medium">
						{Math.min(currentPage * itemsPerPage, allEnvelopes.length)}
					</span>{" "}
					of <span className="font-medium">{allEnvelopes.length}</span>{" "}
					envelopes
				</p>
			</div>

			<div className="flex items-center space-x-2">
				<div className="flex items-center space-x-1">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCurrentPage(1)}
						disabled={currentPage === 1}
						className="h-8 w-8 p-0"
					>
						<ChevronsLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
									setCurrentPage(page)
								}
							}}
							className="h-8 w-16 text-center text-sm"
						/>
						<span className="text-sm text-muted-foreground">
							/ {totalPages}
						</span>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
						disabled={currentPage >= totalPages}
						className="h-8 w-8 p-0"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCurrentPage(totalPages)}
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
						onValueChange={(value) => setItemsPerPage(Number(value))}
					>
						<SelectTrigger className="h-8 w-[70px]">
							<SelectValue placeholder={itemsPerPage} />
						</SelectTrigger>
						<SelectContent>
							{ITEMS_PER_PAGE_OPTIONS.map((pageSize) => (
								<SelectItem key={pageSize} value={pageSize.toString()}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	)

	return (
		<div className={cn("space-y-6", className)}>
			<Card className="overflow-hidden border border-border">
				<div className="border-b border-border bg-card p-5">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-foreground">Envelopes</h2>
						<div className="text-sm text-muted-foreground">
							{allEnvelopes.length} total
						</div>
					</div>
				</div>

				<div className="divide-y divide-gray-100 dark:divide-gray-800">
					{envelopes.map((envelope) => {
						const statusInfo = getStatusInfo(envelope.status)
						const StatusIcon = statusInfo.icon
						const formattedDate = format(
							new Date(envelope.createdAt),
							"MMM d, yyyy • h:mm a"
						)
						const documentCount = envelope.documents?.length ?? 0
						// Get the actual recipients to display (either from envelope or documents)
						const displayRecipients = (() => {
							if (envelope.recipients?.length) return envelope.recipients
							if (envelope.documents?.length) {
								const allRecipients = envelope.documents.flatMap(
									(doc) => doc.recipients ?? []
								)
								return Array.from(
									new Map(allRecipients.map((r) => [r.id, r])).values()
								)
							}
							return []
						})()

						// Calculate recipient count from displayRecipients to ensure consistency
						const recipientCount = displayRecipients.length

						return (
							<Card
								key={envelope.id}
								className="relative cursor-pointer overflow-hidden rounded-none border-0 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
								onClick={() => handleEnvelopeClick(envelope)}
							>
								<div className="absolute left-0 top-0 h-full w-1 bg-primary"></div>
								<CardHeader className="pb-3 pt-4">
									<div className="flex items-start justify-between space-x-4">
										<div className="min-w-0 flex-1">
											<div className="flex items-center space-x-3">
												<div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
													<Mail className="h-5 w-5" />
												</div>
												<div className="min-w-0">
													<CardTitle className="truncate text-base font-semibold text-gray-900 dark:text-white">
														{envelope.title || "Untitled Envelope"}
													</CardTitle>
													<p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
														Created on {formattedDate}
													</p>
												</div>
											</div>
										</div>
										<div className="flex-shrink-0">
											<Badge
												className={cn(
													"rounded-full px-2.5 py-1 text-xs font-medium",
													statusInfo.bg,
													statusInfo.color
												)}
											>
												<StatusIcon className="mr-1.5 h-3 w-3" />
												{statusInfo.label}
											</Badge>
										</div>
									</div>
								</CardHeader>
								<CardContent className="pb-4 pt-0">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2">
											<div className="flex -space-x-2">
												{displayRecipients.slice(0, 3).map((recipient) => (
													<Avatar
														key={recipient.id}
														className="h-8 w-8 border-2 border-background shadow-sm"
													>
														<AvatarImage
															src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
																(recipient as RecipientWithUser).email ??
																	recipient.user?.email ??
																	"U"
															)}`}
															alt={
																recipient.user?.name ??
																(recipient as RecipientWithUser).email ??
																"User"
															}
														/>
														<AvatarFallback className="bg-gray-200 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
															{(
																recipient.user?.name?.charAt(0) ??
																(recipient as RecipientWithUser).email?.charAt(
																	0
																) ??
																"U"
															).toUpperCase()}
														</AvatarFallback>
													</Avatar>
												))}
												{displayRecipients.length > 3 && (
													<div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-gray-100 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
														+{displayRecipients.length - 3}
													</div>
												)}
											</div>
											<span className="text-sm text-gray-500 dark:text-gray-400">
												{recipientCount}{" "}
												{recipientCount === 1 ? "recipient" : "recipients"}
											</span>
										</div>
										<div className="flex items-center space-x-4">
											<div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="mr-1.5 h-4 w-4"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
													/>
												</svg>
												{documentCount}{" "}
												{documentCount === 1 ? "document" : "documents"}
											</div>
											<button
												className="text-primary transition-colors hover:text-primary/80"
												onClick={(e) => {
													e.stopPropagation()
													handleEnvelopeClick(envelope)
												}}
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-5 w-5"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														fillRule="evenodd"
														d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
														clipRule="evenodd"
													/>
												</svg>
											</button>
										</div>
									</div>
								</CardContent>
							</Card>
						)
					})}
				</div>

				{allEnvelopes.length > 0 && (
					<div className="border-t border-gray-100 dark:border-gray-800">
						<PaginationControls />
					</div>
				)}
			</Card>
		</div>
	)
}
