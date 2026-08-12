"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"
import { Copy, FileText, Mail, User, Users } from "lucide-react"
import { toast } from "sonner"

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from "@/core/components/tooltip"
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import { Disclosure, DisclosureContent } from "@/core/components/ui/disclosure"
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from "@/core/components/ui/tabs"

import { trpc, type RouterOutputs } from "@/services/trpc/client"

import {
	formatFileSize,
	generateInviteLink,
	getDocumentStatus,
	getDocumentStatusConfig,
	getRecipientStatusConfig,
	type RecipientStatus
} from "../utils/status.utils"
import { EnvelopeActions } from "./actions/envelope-actions"
import { InviteEmailDialog } from "./invite-email-dialog"

type Document = RouterOutputs["envelopeLite"]["getEnvelopeDocuments"][number]
type PendingRequest =
	RouterOutputs["envelopeLite"]["getPendingRecipientRequests"][number]

interface DocumentListWithDisclosureProps {
	documents: Document[]
	envelopeId: string
	onFilteredCountChange?: (count: number) => void
}

type FilterTab = "all" | "unsigned" | "signed"

export function DocumentListWithDisclosure({
	documents,
	envelopeId,
	onFilteredCountChange
}: DocumentListWithDisclosureProps) {
	// Active filter tab
	const [activeTab, setActiveTab] = useState<FilterTab>("all")

	const queryClient = useQueryClient()

	// Only load data when needed for performance
	const { data: pendingRequests, refetch: refetchPendingRequests } =
		trpc.envelopeLite.getPendingRecipientRequests.useQuery(
			{ envelopeId },
			{
				enabled: !!envelopeId,
				refetchInterval: 3000, // Poll every 3 seconds for new requests
				refetchIntervalInBackground: true // Continue polling even when tab is not active
			}
		)

	// Filter documents based on active tab
	const filteredDocuments = useMemo(() => {
		return documents.filter((document) => {
			// Get document recipients (exclude REQUESTED status)
			const docRecipients = (document.recipients ?? []).filter(
				(recipient) => recipient.status !== "REQUESTED"
			)

			// Get document status using utility
			const documentStatus = getDocumentStatus(document.status, docRecipients)

			switch (activeTab) {
				case "all":
					return true
				case "unsigned":
					return documentStatus === "UNSIGNED"
				case "signed":
					return documentStatus === "SIGNED"
				default:
					return true
			}
		})
	}, [documents, activeTab])

	// Notify parent component of filtered count changes
	useEffect(() => {
		onFilteredCountChange?.(filteredDocuments.length)
	}, [filteredDocuments.length, onFilteredCountChange])

	// Accept/decline recipient request mutations
	const acceptRequest = trpc.envelopeLite.acceptRecipientRequest.useMutation({
		onSuccess: async () => {
			// Invalidate both queries for instant UI update
			await Promise.all([
				refetchPendingRequests(),
				queryClient.invalidateQueries({
					queryKey: [["envelopeLite", "getEnvelopeDocuments"]]
				}),
				queryClient.invalidateQueries({
					queryKey: [["envelopeLite", "getEnvelopeById"]]
				})
			])
			toast.success("Request accepted successfully!")
		},
		onError: (error) => {
			console.error("Accept request error:", error)
			if (error.message.includes("Recipient not found")) {
				toast.error("Request already processed!")
			} else {
				toast.error("Failed to accept request. Please try again.")
			}
		}
	})

	const declineRequest = trpc.envelopeLite.declineRecipientRequest.useMutation({
		onSuccess: async () => {
			// Invalidate both queries for instant UI update
			await Promise.all([
				refetchPendingRequests(),
				queryClient.invalidateQueries({
					queryKey: [["envelopeLite", "getEnvelopeDocuments"]]
				}),
				queryClient.invalidateQueries({
					queryKey: [["envelopeLite", "getEnvelopeById"]]
				})
			])
			toast.success("Request declined successfully!")
		},
		onError: (error) => {
			console.error("Decline request error:", error)
			toast.error("Failed to decline request. Please try again.")
		}
	})

	const handleAcceptRequest = useCallback(
		(recipientId: string) => {
			acceptRequest.mutate({ recipientId })
		},
		[acceptRequest]
	)

	const handleDeclineRequest = useCallback(
		(recipientId: string) => {
			declineRequest.mutate({ recipientId })
		},
		[declineRequest]
	)

	const handleCopyInviteLink = useCallback(
		async (placeholderName: string, documentId: string) => {
			try {
				const linkToCopy = generateInviteLink(
					envelopeId,
					placeholderName,
					documentId
				)
				await navigator.clipboard.writeText(linkToCopy)
				toast.success(`Invite link for ${placeholderName} copied to clipboard!`)
			} catch (error) {
				console.error("Failed to copy link:", error)
				toast.error("Failed to copy link to clipboard")
			}
		},
		[envelopeId]
	)

	// Animation variants
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1
			}
		}
	}

	const itemVariants = {
		hidden: {
			opacity: 0,
			y: 20,
			scale: 0.95
		},
		visible: {
			opacity: 1,
			y: 0,
			scale: 1
		},
		exit: {
			opacity: 0,
			y: -20,
			scale: 0.95
		}
	}

	return (
		<div className="space-y-4">
			{/* Filter Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={(value) => setActiveTab(value as FilterTab)}
				className="w-full"
			>
				<TabsList>
					<TabsTrigger value="all">All</TabsTrigger>
					<TabsTrigger value="unsigned">Unsigned</TabsTrigger>
					<TabsTrigger value="signed">Signed</TabsTrigger>
				</TabsList>

				<TabsContent value={activeTab} className="mt-4">
					<motion.div
						className="space-y-4"
						variants={containerVariants}
						initial="hidden"
						animate="visible"
					>
						<AnimatePresence mode="popLayout">
							{filteredDocuments.map((document) => {
								// Get pending requests for this document
								const docPendingRequests =
									pendingRequests?.filter(
										(request: PendingRequest) =>
											request.documentId === document.id
									) ?? []
								const hasPendingRequests = docPendingRequests.length > 0

								// Get document recipients (exclude REQUESTED status)
								const docRecipients = (document.recipients ?? []).filter(
									(recipient) => recipient.status !== "REQUESTED"
								)

								// Get document status using utility
								const documentStatus = getDocumentStatus(
									document.status,
									docRecipients
								)
								const statusConfig = getDocumentStatusConfig(documentStatus)

								return (
									<motion.div
										key={document.id}
										variants={itemVariants}
										layout
										transition={{
											duration: 0.3,
											ease: "easeOut"
										}}
									>
										<Card className="group overflow-hidden dark:bg-muted/60">
											<CardContent className="p-0">
												<Disclosure>
													{/* Document Header */}
													<div className="flex items-center gap-4 p-4">
														<div className="rounded-lg bg-muted p-2">
															<FileText className="h-5 w-5 text-muted-foreground" />
														</div>
														<div className="min-w-0 flex-1">
															<div className="mb-1 flex items-center gap-2">
																<h3 className="truncate text-sm font-medium">
																	{document.name}
																</h3>
																<div className="flex items-center gap-2">
																	<Badge
																		variant="secondary"
																		className="text-xs"
																	>
																		{document.type}
																	</Badge>
																	<Badge
																		variant={statusConfig.variant}
																		className={`text-xs ${statusConfig.className}`}
																	>
																		{statusConfig.label}
																	</Badge>
																	{hasPendingRequests && (
																		<Badge
																			variant="outline"
																			className="border-orange-200 bg-orange-50 text-xs text-orange-700"
																		>
																			{docPendingRequests?.length} Pending
																			Request
																			{docPendingRequests?.length !== 1
																				? "s"
																				: ""}
																		</Badge>
																	)}
																</div>
															</div>
															<p className="text-xs text-muted-foreground">
																{formatFileSize(document.size)} •{" "}
																{format(
																	new Date(document.createdAt),
																	"MMM d, yyyy 'at' h:mm a"
																)}
															</p>
														</div>

														<div className="flex items-center gap-1">
															{/* Show signatory count */}
															{docRecipients.length > 0 && (
																<div className="mr-2 flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
																	<Users className="h-3 w-3" />
																	<span>{docRecipients.length}</span>
																</div>
															)}

															{/* Primary Actions Group */}
															<EnvelopeActions
																document={{
																	id: document.id,
																	name: document.name
																}}
																envelopeId={envelopeId}
																documentStatus={documentStatus}
																showAddSigners={documentStatus !== "SIGNED"}
																showDisclosure={
																	docRecipients.length > 0 || hasPendingRequests
																}
															/>
														</div>
													</div>

													{/* Disclosure Content - Signatories and Pending Requests */}
													{(docRecipients.length > 0 || hasPendingRequests) && (
														<DisclosureContent>
															<div className="border-t p-4">
																<div className="space-y-4">
																	{/* Signatories */}
																	{docRecipients.length > 0 && (
																		<div>
																			<h4 className="mb-3 text-sm font-medium text-foreground">
																				Signatories
																			</h4>
																			<div className="space-y-2">
																				{docRecipients.map((recipient) => (
																					<div
																						key={recipient.id}
																						className="flex items-center gap-3 rounded-lg border bg-background p-3"
																					>
																						<div className="rounded-full bg-blue-100 p-1.5">
																							<User className="h-3 w-3 text-blue-600" />
																						</div>
																						<div className="flex-1">
																							<p className="text-sm font-medium">
																								{recipient.user?.name ??
																									recipient.name ??
																									"Unknown User"}
																							</p>
																							<p className="text-xs text-muted-foreground">
																								{recipient.user?.email ??
																									recipient.email}
																								{recipient.documentFields?.[0]
																									?.signedAt && (
																									<>
																										{" • "}
																										<span className="text-green-600 dark:text-green-400">
																											Signed:{" "}
																											{format(
																												new Date(
																													recipient.documentFields[0].signedAt
																												),
																												"MMM d, yyyy 'at' h:mm a"
																											)}
																										</span>
																									</>
																								)}
																							</p>
																						</div>
																						<div className="flex items-center gap-2">
																							{(() => {
																								const status =
																									(recipient.status ??
																										"UNSIGNED") as RecipientStatus
																								const recipientStatusConfig =
																									getRecipientStatusConfig(
																										status
																									)
																								return (
																									<Badge
																										variant={
																											recipientStatusConfig.variant
																										}
																										className={`text-xs ${recipientStatusConfig.className}`}
																									>
																										{
																											recipientStatusConfig.label
																										}
																									</Badge>
																								)
																							})()}
																							{/* Copy link for placeholder recipients */}
																							{!recipient.user?.email &&
																								recipient.email?.includes(
																									"placeholder"
																								) && (
																									<Tooltip>
																										<TooltipTrigger>
																											<Button
																												size="sm"
																												className="light:bg-secondary h-7 px-2 text-xs dark:bg-primary"
																												onClick={() =>
																													handleCopyInviteLink(
																														recipient.name ??
																															recipient.email ??
																															"",
																														document.id
																													)
																												}
																											>
																												<Copy className="mr-1 h-3 w-3" />
																												Copy Link
																											</Button>
																										</TooltipTrigger>
																										<TooltipContent>
																											Copy invite link
																										</TooltipContent>
																									</Tooltip>
																								)}
																							{!recipient.user?.email &&
																								recipient.email?.includes(
																									"placeholder"
																								) && (
																									<InviteEmailDialog
																										envelopeId={envelopeId}
																										documentId={document.id}
																										placeholderName={
																											recipient.name ??
																											recipient.email ??
																											""
																										}
																										trigger={
																											<Button
																												size="icon"
																												variant="ghost"
																												className="h-7 w-7"
																												title="Invite via Email"
																												aria-label="Invite via Email"
																											>
																												<Mail className="h-3.5 w-3.5" />
																												<span className="sr-only">
																													Invite via Email
																												</span>
																											</Button>
																										}
																									/>
																								)}
																						</div>
																					</div>
																				))}
																			</div>
																		</div>
																	)}

																	{/* Pending Requests */}
																	{hasPendingRequests && (
																		<div>
																			<h4 className="mb-3 text-sm font-medium text-orange-800 dark:text-orange-200">
																				Pending Assignment Requests
																			</h4>
																			<div className="space-y-2">
																				{docPendingRequests?.map((request) => (
																					<div
																						key={request.id}
																						className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/50 p-3 dark:border-orange-800 dark:bg-orange-900/50"
																					>
																						<div className="flex items-center gap-3">
																							<div className="rounded-full bg-orange-100 p-1.5 dark:bg-orange-800">
																								<User className="h-3 w-3 text-orange-600 dark:text-orange-300" />
																							</div>
																							<div>
																								<p className="text-sm font-medium text-gray-900 dark:text-gray-100">
																									{request.user?.name ??
																										"Unknown User"}
																								</p>
																								<p className="text-xs text-gray-600 dark:text-gray-400">
																									Requesting to be assigned to:{" "}
																									{request.placeholderId}
																								</p>
																							</div>
																						</div>
																						<div className="flex items-center gap-2">
																							<Button
																								size="sm"
																								variant="outline"
																								className="h-7 border-green-200 px-3 text-xs text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/40"
																								onClick={() =>
																									handleAcceptRequest(
																										request.id
																									)
																								}
																								disabled={
																									acceptRequest.isPending ||
																									declineRequest.isPending
																								}
																							>
																								✓ Accept
																							</Button>
																							<Button
																								size="sm"
																								variant="outline"
																								className="h-7 border-red-200 px-3 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/40"
																								onClick={() =>
																									handleDeclineRequest(
																										request.id
																									)
																								}
																								disabled={
																									acceptRequest.isPending ||
																									declineRequest.isPending
																								}
																							>
																								✗ Decline
																							</Button>
																						</div>
																					</div>
																				))}
																			</div>
																		</div>
																	)}
																</div>
															</div>
														</DisclosureContent>
													)}
												</Disclosure>
											</CardContent>
										</Card>
									</motion.div>
								)
							})}
						</AnimatePresence>
					</motion.div>
				</TabsContent>
			</Tabs>
		</div>
	)
}
