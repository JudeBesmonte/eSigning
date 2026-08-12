import Image from "next/image"
import { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
	Activity,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Edit,
	Eye,
	FileCheck,
	FileClock,
	FileSearch,
	FileSignature,
	FileText,
	FileX,
	Info,
	Lock,
	Mail,
	Search,
	Settings,
	Shield,
	Trash2,
	User
} from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"

// Utility function to merge class names
function cn(...classes: (string | undefined)[]) {
	return classes.filter(Boolean).join(" ")
}

type AuditEventStatus = "success" | "failed" | "warning" | "info" | "pending"

export type AuditEvent = {
	id: string
	eventType: string
	timestamp: string
	metadata: {
		documentId?: string | null
		envelopeId?: string | null
		recipientEmail?: string
		recipientName?: string
		recipientRole?: string
		actionType?: string
		[key: string]: unknown
	} | null
	description: string
	status?: AuditEventStatus
	ipAddress?: string | null
	userAgent?: string
	user?: {
		id: string
		name: string | null
		email: string | null
		role?: string
		avatar?: string
	}
	userEmail?: string | null
	userName?: string | null
	envelopeId?: string | null
	documentId?: string | null
	recipientId?: string | null
	envelope?: {
		id: string
		title: string
		status: string
	} | null
	document?: {
		id: string
		name: string
		type: string
	} | null
	recipient?: {
		id: string
		role: string
		status: string
		user: {
			name: string | null
			email: string | null
		} | null
	} | null
}

interface AuditEventsViewProps {
	events: AuditEvent[]
	className?: string
	pageSize?: number
}

const getEventIcon = (eventType: string) => {
	const eventTypeLower = eventType.toLowerCase()

	if (eventTypeLower.includes("sign") || eventTypeLower.includes("approve")) {
		return <FileSignature className="h-4 w-4" />
	}

	switch (eventTypeLower) {
		case "login":
		case "logout":
			return <User className="h-4 w-4" />
		case "document_upload":
		case "document_download":
			return <FileText className="h-4 w-4" />
		case "permission_change":
			return <Lock className="h-4 w-4" />
		case "audit_log_viewed":
			return <FileSearch className="h-4 w-4" />
		case "document_viewed":
			return <Eye className="h-4 w-4" />
		case "document_edited":
			return <Edit className="h-4 w-4" />
		case "document_deleted":
			return <Trash2 className="h-4 w-4" />
		case "settings_updated":
			return <Settings className="h-4 w-4" />
		case "search_performed":
			return <Search className="h-4 w-4" />
		case "security_event":
			return <Shield className="h-4 w-4" />
		case "email_sent":
			return <Mail className="h-4 w-4" />
		case "document_signed":
			return <FileCheck className="h-4 w-4" />
		case "document_rejected":
			return <FileX className="h-4 w-4" />
		case "document_pending":
			return <FileClock className="h-4 w-4" />
		default:
			return <Activity className="h-4 w-4" />
	}
}

// Get badge variant based on status
const getBadgeVariant = (
	status?: string
): "default" | "destructive" | "outline" | "secondary" => {
	switch (status?.toLowerCase()) {
		case "success":
			return "secondary"
		case "failed":
			return "destructive"
		case "warning":
			return "outline"
		default:
			return "default"
	}
}

export function AuditEventsView({
	events,
	className = ""
}: AuditEventsViewProps) {
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(3)

	// Use all events since we're not filtering by search
	const filteredEvents = events

	// Calculate pagination values
	const totalItems = filteredEvents.length
	const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
	const startIndex = (currentPage - 1) * itemsPerPage
	const paginatedEvents = filteredEvents.slice(
		startIndex,
		startIndex + itemsPerPage
	)

	// Handle page change
	const handlePageChange = (page: number) => {
		setCurrentPage(page)
		// Scroll to top on page change
		window.scrollTo({ top: 0, behavior: "smooth" } as ScrollToOptions)
	}

	// Items per page options
	const itemsPerPageOptions = [5, 10, 20, 50, 100]
	if (filteredEvents.length === 0) {
		return (
			<div className="rounded-lg border border-dashed bg-card/50 py-12 text-center">
				<Info className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
				<h3 className="text-sm font-medium text-muted-foreground">
					No audit events found
				</h3>
				<p className="mt-1 text-xs text-muted-foreground"></p>
			</div>
		)
	}

	return (
		<div className={cn("space-y-4", className)}>
			<div className="overflow-hidden rounded-lg border border-border bg-card">
				<div className="border-b border-border bg-muted/10 p-4">
					<div className="flex items-center justify-between">
						<h2 className="flex items-center text-lg font-semibold">
							<FileSearch className="mr-2 h-5 w-5 text-primary" />
							Audit Trail
						</h2>
						<div className="text-sm text-muted-foreground">
							{filteredEvents.length}{" "}
							{filteredEvents.length === 1 ? "event" : "events"}
						</div>
					</div>
				</div>

				<div className="divide-y divide-border">
					{paginatedEvents.map((event) => {
						const eventDate = new Date(event.timestamp)
						const formattedDate = format(eventDate, "MMM d, yyyy h:mm a")
						const timeAgo = formatDistanceToNow(eventDate, { addSuffix: true })

						return (
							<div
								key={event.id}
								className="p-4 transition-colors hover:bg-accent/30"
							>
								<div className="flex items-start gap-3">
									<div className="mt-0.5 flex-shrink-0">
										<div
											className={`rounded-lg p-2 ${
												event.status === "success"
													? "bg-green-500/10 text-green-600"
													: event.status === "failed"
														? "bg-red-500/10 text-red-600"
														: event.status === "warning"
															? "bg-yellow-500/10 text-yellow-600"
															: "bg-primary/10 text-primary"
											}`}
										>
											{getEventIcon(event.eventType)}
										</div>
									</div>

									<div className="min-w-0 flex-1">
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0 flex-1">
												<div className="flex flex-wrap items-center gap-2">
													<h3 className="text-sm font-medium text-foreground">
														{event.eventType.replace(/([A-Z])/g, " $1").trim()}
													</h3>
													{event.status && (
														<Badge variant={getBadgeVariant(event.status)}>
															{event.status}
														</Badge>
													)}
												</div>

												<p className="mt-1 text-sm text-muted-foreground">
													{event.description}
												</p>

												{event.metadata && (
													<div className="mt-2 flex flex-wrap gap-2 text-xs">
														{/* Document Information */}
														{(event.document?.name ??
															event.metadata.documentId) && (
															<div className="flex items-center rounded bg-muted/50 px-2 py-1">
																<FileText className="mr-1 h-3 w-3 text-muted-foreground" />
																<span>
																	{event.document?.name ??
																		`Document: ${event.metadata.documentId?.substring(0, 8)}...`}
																</span>
															</div>
														)}

														{/* Creator and Signer Information */}
														<div className="flex flex-col gap-1">
															{/* Creator Information */}
															<div className="flex items-center text-xs">
																<div className="flex items-center rounded bg-muted/50 px-2 py-1">
																	<User className="mr-1 h-3 w-3 text-muted-foreground" />
																	<span className="font-medium">
																		{event.user?.name ?? "System User"}
																		<span className="ml-1 text-xs text-muted-foreground">
																			(creator)
																		</span>
																	</span>
																</div>
															</div>

															{/* Signer Information - Show if different from creator */}
															{(event.recipient?.user?.email ??
																event.metadata?.recipientEmail) &&
																(event.recipient?.user?.email !==
																	event.user?.email ||
																	event.metadata?.recipientEmail !==
																		event.user?.email) && (
																	<div className="flex items-center text-xs">
																		<div className="flex items-center rounded bg-primary/10 px-2 py-1">
																			<FileSignature className="mr-1 h-3 w-3 text-primary" />
																			<span className="font-medium">
																				{/* Try to get signer name from recipient.user, then metadata, then fallback to email */}
																				{event.recipient?.user?.name ??
																					event.metadata?.recipientName ??
																					event.recipient?.user?.email ??
																					event.metadata?.recipientEmail ??
																					"Unknown Signer"}
																				<span className="ml-1 text-xs text-primary">
																					(
																					{event.recipient?.role?.toLowerCase() ??
																						event.metadata?.recipientRole?.toLowerCase() ??
																						"signer"}
																					)
																				</span>
																			</span>
																		</div>
																	</div>
																)}
														</div>
														{event.metadata.actionType && (
															<div className="flex items-center rounded bg-muted/50 px-2 py-1">
																<Activity className="mr-1 h-3 w-3 text-muted-foreground" />
																<span className="capitalize">
																	{String(event.metadata.actionType)
																		.replace(/_/g, " ")
																		.toLowerCase()}
																</span>
															</div>
														)}
													</div>
												)}
											</div>

											<div className="text-right">
												<time
													dateTime={event.timestamp}
													className="whitespace-nowrap text-xs text-muted-foreground"
													title={formattedDate}
												>
													{timeAgo}
												</time>
											</div>
										</div>

										{event.user && (
											<div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
												<div className="flex items-center">
													{event.user.avatar ? (
														<div className="relative mr-2 h-5 w-5 overflow-hidden rounded-full">
															<Image
																src={event.user.avatar}
																alt={event.user.name ?? "User"}
																fill
																className="object-cover"
																sizes="20px"
															/>
														</div>
													) : (
														<div className="mr-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
															{(
																event.user.name?.charAt(0) ?? "S"
															).toUpperCase()}
														</div>
													)}
													<div className="text-xs">
														<div className="font-medium text-foreground">
															{event.user.name ?? "System"}
														</div>
														{event.user.email && (
															<div className="text-muted-foreground">
																{event.user.email}
															</div>
														)}
													</div>
												</div>

												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													{event.ipAddress && (
														<div className="rounded bg-muted/50 px-2 py-0.5">
															{event.ipAddress}
														</div>
													)}
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						)
					})}
				</div>

				{/* Pagination Controls */}
				{totalItems > 0 && (
					<div className="flex items-center justify-between rounded-b-lg border-t border-border bg-card px-6 py-3">
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
								of <span className="font-medium">{totalItems}</span> events
							</p>
						</div>

						<div className="flex items-center space-x-4">
							<div className="flex items-center space-x-1">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(1)}
									disabled={currentPage === 1}
									className="h-8 w-8 p-0"
								>
									<ChevronsLeft className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
												handlePageChange(page)
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
									onClick={() =>
										handlePageChange(Math.min(totalPages, currentPage + 1))
									}
									disabled={currentPage >= totalPages}
									className="h-8 w-8 p-0"
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange(totalPages)}
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
									onValueChange={(value) => {
										setItemsPerPage(Number(value))
										setCurrentPage(1) // Reset to first page when changing items per page
									}}
								>
									<SelectTrigger className="h-8 w-[70px]">
										<SelectValue placeholder={itemsPerPage} />
									</SelectTrigger>
									<SelectContent>
										{itemsPerPageOptions.map((size) => (
											<SelectItem key={size} value={size.toString()}>
												{size}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
