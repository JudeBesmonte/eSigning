/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import Link from "next/link"
import { useState } from "react"
import {
	CheckCircle,
	ChevronRightIcon,
	Clock,
	Eye,
	FileTextIcon,
	MessageSquare,
	QrCodeIcon,
	Send,
	ShieldCheckIcon,
	UserIcon,
	UsersIcon,
	XCircle
} from "lucide-react"
import { toast } from "sonner"

import { Alert } from "@/core/components/ui/alert"
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import {
	Disclosure,
	DisclosureContent,
	DisclosureTrigger
} from "@/core/components/ui/disclosure"
import { normalCase } from "@/core/lib/utils"

import { trpc, type RouterOutputs } from "@/services/trpc/client"

import { EnvelopeChatSheet } from "@/features/to-sign/components/envelope-chat-sheet"

import { QRBarcodeModal } from "./forms/qr-barcode-modal"

type Envelope = RouterOutputs["envelope"]["getMyEnvelopes"][number]

function getStatusColor(status: string) {
	switch (status.toLowerCase()) {
		case "completed":
			return "bg-green-100 text-green-800 border-green-200"
		case "published":
			return "bg-blue-100 text-blue-800 border-blue-200"
		case "draft":
			return "bg-gray-100 text-gray-800 border-gray-200"
		case "cancelled":
			return "bg-red-100 text-red-800 border-red-200"
		case "expired":
			return "bg-orange-100 text-orange-800 border-orange-200"
		case "pending_approval":
			return "bg-yellow-100 text-yellow-800 border-yellow-200"
		case "approved":
			return "bg-green-100 text-green-800 border-green-200"
		case "rejected":
			return "bg-red-100 text-red-800 border-red-200"
		default:
			return "bg-gray-100 text-gray-800 border-gray-200"
	}
}

function getStatusIcon(status: string) {
	switch (status.toLowerCase()) {
		case "completed":
			return <CheckCircle className="h-4 w-4" />
		case "published":
			return <FileTextIcon className="h-4 w-4" />
		case "draft":
			return <FileTextIcon className="h-4 w-4" />
		case "cancelled":
			return <XCircle className="h-4 w-4" />
		case "expired":
			return <Clock className="h-4 w-4" />
		case "pending_approval":
			return <Clock className="h-4 w-4" />
		case "approved":
			return <CheckCircle className="h-4 w-4" />
		case "rejected":
			return <XCircle className="h-4 w-4" />
		default:
			return <FileTextIcon className="h-4 w-4" />
	}
}

function getRecipientStatusColor(status: string) {
	switch (status.toLowerCase()) {
		case "signed":
			return "border-green-500 bg-green-50 text-green-700"
		case "approved":
			return "border-green-500 bg-green-50 text-green-700"
		case "pending":
			return "border-yellow-500 bg-yellow-50 text-yellow-700"
		case "published":
			return "border-blue-500 bg-blue-50 text-blue-700"
		case "viewed":
			return "border-blue-500 bg-blue-50 text-blue-700"
		case "declined":
			return "border-red-500 bg-red-50 text-red-700"
		case "rejected":
			return "border-red-500 bg-red-50 text-red-700"
		case "expired":
			return "border-orange-500 bg-orange-50 text-orange-700"
		default:
			return "border-gray-500 bg-gray-50 text-gray-700"
	}
}

export function EnvelopeDisclosure({ envelope }: { envelope: Envelope }) {
	const utils = trpc.useUtils()
	const [showQRModal, setShowQRModal] = useState(false)

	const publishMutation = trpc.envelope.publishEnvelope.useMutation({
		onSuccess: () => {
			// Invalidate and refetch the envelopes query to show updated data
			void utils.envelope.getMyEnvelopes.invalidate()
			// Show success toast
			toast.success("Envelope published successfully!")
		},
		onError: (error) => {
			console.error("Failed to publish envelope:", error)
			toast.error("Failed to publish envelope. Please try again.")
		}
	})

	const handlePublish = () => {
		publishMutation.mutate({ envelopeId: envelope.id })
	}

	// Get envelope-level approver
	const approver = envelope.recipient?.find((r) => r.role === "APPROVER")

	return (
		<Link href={`/envelope/${envelope.id}`} className="block">
			<Disclosure asChild>
				<Card className="group h-fit flex-1 cursor-pointer bg-[#f8f8f8] transition-colors hover:bg-[#f0f0f0] dark:bg-[hsl(228,6%,15.3%)] dark:hover:bg-[hsl(228,6%,12%)]">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
						<div className="flex items-center gap-2">
							<div className="aspect-square rounded-sm border bg-card p-2 text-card-foreground">
								<Button
									size={"sm"}
									variant={"ghost"}
									className="px-2.5"
									onClick={(e) => {
										e.stopPropagation()
										setShowQRModal(true)
									}}
									title="Show QR/Barcode"
								>
									<QrCodeIcon className="size-5" />
								</Button>
							</div>
							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-2">
									<CardTitle className="text-lg">{envelope.title}</CardTitle>
									{approver && (
										<div className="flex items-center gap-1">
											<ShieldCheckIcon className="size-3 text-amber-600" />
											<span className="text-xs text-amber-600">
												Requires Approval
											</span>
										</div>
									)}
								</div>
								<CardDescription>
									{envelope.updatedAt.toLocaleDateString("en-US", {
										year: "numeric",
										month: "short",
										day: "numeric"
									})}
								</CardDescription>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Badge className={`${getStatusColor(envelope.status)} border`}>
								{getStatusIcon(envelope.status)}
								<span className="ml-1 capitalize">
									{normalCase(envelope.status)}
								</span>
							</Badge>
							{envelope.status === "DRAFT" && (
								<Button
									size={"sm"}
									onClick={(e) => {
										e.stopPropagation()
										handlePublish()
									}}
									disabled={publishMutation.isPending}
									className="flex items-center gap-1"
								>
									<Send className="h-3 w-3" />
									{publishMutation.isPending ? "Publishing..." : "Publish"}
								</Button>
							)}
							<Button
								size="sm"
								variant="ghost"
								className="px-2.5"
								onClick={(e) => {
									e.stopPropagation()
									window.location.href = `/envelope/${envelope.id}`
								}}
								title="View Envelope"
							>
								<Eye className="h-4 w-4" />
							</Button>
							<EnvelopeChatSheet
								envelopeId={envelope.id}
								envelopeTitle={envelope.title}
								participants={[
									// Include all recipients from all documents
									...envelope.documents.flatMap(
										(doc) =>
											doc.recipients?.map((recipient) => ({
												id: recipient.user?.id ?? recipient.id,
												name: recipient.user?.name ?? null,
												email: recipient.user?.email ?? null,
												image: null,
												role: recipient.role
											})) ?? []
									)
								].filter(
									(participant, index, array) =>
										// Remove duplicates based on id
										array.findIndex((p) => p.id === participant.id) === index
								)}
								trigger={
									<Button
										size="sm"
										variant="ghost"
										className="px-2.5"
										onClick={(e) => e.stopPropagation()}
									>
										<MessageSquare className="h-4 w-4" />
									</Button>
								}
							/>
							<DisclosureTrigger asChild>
								<Button
									size={"sm"}
									variant={"ghost"}
									className="px-2.5"
									onClick={(e) => e.stopPropagation()}
								>
									<ChevronRightIcon className="transition-transform duration-200 group-data-[state=open]:rotate-90" />
								</Button>
							</DisclosureTrigger>
						</div>
					</CardHeader>
					<DisclosureContent asChild>
						<CardContent className="space-y-2 pb-4 pt-2">
							{/* Show approver information if exists */}
							{approver && (
								<Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
									<div className="flex items-start gap-3">
										<ShieldCheckIcon className="mt-1 h-4 w-4 text-amber-600" />
										<div className="flex-1 space-y-1">
											<div className="text-sm font-medium text-amber-800 dark:text-amber-200">
												Envelope Approver
											</div>
											<div className="text-sm text-amber-700 dark:text-amber-300">
												{approver.user?.name ?? "Unknown User"}
											</div>
											<div className="text-xs text-amber-600 dark:text-amber-400">
												{approver.user?.email}
											</div>
											<div className="flex items-center gap-2">
												<Badge
													variant="outline"
													className="border-amber-300 text-xs text-amber-700"
												>
													{normalCase(approver.role)}
												</Badge>
												<Badge
													variant="outline"
													className={`text-xs ${getRecipientStatusColor(approver.status)}`}
												>
													{approver.status === "APPROVED" && (
														<CheckCircle className="mr-1 h-3 w-3" />
													)}
													{approver.status === "REJECTED" && (
														<XCircle className="mr-1 h-3 w-3" />
													)}
													{approver.status === "SIGNED" && (
														<CheckCircle className="mr-1 h-3 w-3" />
													)}
													{normalCase(approver.status)}
												</Badge>
											</div>
										</div>
									</div>
								</Alert>
							)}
							{envelope.documents
								.filter((document) => !document.name.includes("_signed.pdf"))
								.map((document, index) => (
									<DocumentCard key={index} document={document} />
								))}
						</CardContent>
					</DisclosureContent>
					<QRBarcodeModal
						envelopeId={envelope.id}
						envelopeTitle={envelope.title}
						open={showQRModal}
						onOpenChange={setShowQRModal}
					/>
				</Card>
			</Disclosure>
		</Link>
	)
}

function DocumentCard({
	document
}: {
	document: Envelope["documents"][number]
}) {
	return (
		<div className="flex flex-col gap-4 rounded-sm border bg-background p-4">
			<div className="relative flex w-full items-center gap-2.5">
				<div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded border border-muted-foreground/20 bg-accent/50 [&>svg]:size-10">
					<FileTextIcon className="!size-5 text-accent-foreground" />
				</div>
				<div className="flex flex-col space-y-0">
					<span>{document.name}</span>
					<span className="text-xs text-muted-foreground">
						{(document.size / 1024).toFixed(2)} KB
					</span>
				</div>
			</div>
			<div className="flex w-full flex-col gap-2">
				<div className="flex w-full items-center justify-between pl-3.5 text-sm">
					<div className="flex items-center gap-2">
						<UsersIcon className="size-4" />
						<h3>Recipients ({document.recipients?.length ?? 0})</h3>
					</div>
				</div>
				{document.recipients && document.recipients.length > 0 && (
					<div className="flex w-full flex-col space-y-2 pl-3.5">
						{document.recipients.map(
							(recipient: any, recipientIndex: number) => (
								<RecipientAlert key={recipientIndex} recipient={recipient} />
							)
						)}
					</div>
				)}
			</div>
		</div>
	)
}

function RecipientAlert({
	recipient
}: {
	recipient: Envelope["documents"][number]["recipients"][number]
}) {
	return (
		<Alert className="bg-[#f8f8f8] dark:bg-[hsl(228,6%,15.3%)]">
			<div className="flex items-start gap-3">
				<UserIcon className="mt-1 h-4 w-4" />
				<div className="flex-1 space-y-1">
					<div className="text-sm font-medium">{recipient.user?.name}</div>
					<div className="text-xs text-muted-foreground">
						{recipient.user?.email}
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="text-xs">
							{normalCase(recipient.role)}
						</Badge>
						<Badge
							variant="outline"
							className={`text-xs ${getRecipientStatusColor(recipient.status)}`}
						>
							{recipient.status === "SIGNED" && (
								<CheckCircle className="mr-1 h-3 w-3" />
							)}
							{recipient.status === "APPROVED" && (
								<CheckCircle className="mr-1 h-3 w-3" />
							)}
							{recipient.status === "REJECTED" && (
								<XCircle className="mr-1 h-3 w-3" />
							)}
							{normalCase(recipient.status)}
						</Badge>
					</div>
				</div>
			</div>
		</Alert>
	)
}
