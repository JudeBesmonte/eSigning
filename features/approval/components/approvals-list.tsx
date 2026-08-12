/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

// @ts-nocheck - Disable strict type checking for this component due to complex tRPC types
import { useState } from "react"
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent } from "@/core/components/ui/card"
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from "@/core/components/ui/tabs"

import { trpc } from "@/services/trpc/client"

import { EnvelopeCard } from "./envelope-card"
import { EnvelopeDetailsModal } from "./envelope-details-modal"

type EnvelopeStatus = "pending" | "approved" | "rejected"

export function ApprovalsList() {
	const [selectedEnvelope, setSelectedEnvelope] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState<EnvelopeStatus>("pending")

	// Query envelopes based on the active tab
	const getStatusForQuery = (tab: EnvelopeStatus) => {
		switch (tab) {
			case "pending":
				return "PENDING_APPROVAL" as const
			case "approved":
				return "APPROVED" as const
			case "rejected":
				return "REJECTED" as const
		}
	}

	const {
		data: envelopesData,
		isLoading,
		error,
		refetch
	} = trpc.approval.getEnvelopesForApproval.useQuery({
		limit: 50,
		status: getStatusForQuery(activeTab)
	})

	// Query specific envelope details when selected
	const { data: selectedEnvelopeData } =
		trpc.approval.getEnvelopeDetails.useQuery(
			{ envelopeId: selectedEnvelope! },
			{ enabled: !!selectedEnvelope }
		)

	// Transform selected envelope data for the modal
	const transformedSelectedEnvelope = selectedEnvelopeData
		? {
				id: selectedEnvelopeData.id,
				title: selectedEnvelopeData.title,
				description: selectedEnvelopeData.description ?? undefined,
				status: selectedEnvelopeData.status,
				createdAt: selectedEnvelopeData.createdAt.toISOString(),
				completedAt: null, // Envelope model doesn't have completedAt field
				createdBy: {
					id: selectedEnvelopeData.createdBy.id,
					name: selectedEnvelopeData.createdBy.name ?? "Unknown User",
					email: selectedEnvelopeData.createdBy.email ?? "",
					role: selectedEnvelopeData.createdBy.role,
					organization: selectedEnvelopeData.createdBy.organization ?? undefined
				},
				documents: (selectedEnvelopeData.documents as any[])
					.filter((doc) => !doc.name.includes("_signed.pdf"))
					.map((doc) => ({
						id: doc.id,
						name: doc.name,
						status: "PENDING", // Document model doesn't have status field
						size: doc.size ?? 0,
						recipients:
							doc.recipients?.map((rec: any) => ({
								id: rec.id,
								name: rec.user?.name ?? "Unknown",
								email: rec.user?.email ?? "",
								role: rec.role,
								status: rec.status,
								signedAt: undefined, // Recipient model doesn't have timestamp fields
								viewedAt: undefined,
								sentAt: undefined,
								declinedAt: undefined
							})) ?? []
					}))
			}
		: null

	// Mutation for approving/rejecting envelopes
	const approveMutation = trpc.approval.approveEnvelope.useMutation({
		onSuccess: (data, variables) => {
			const action = variables.action === "approve" ? "approved" : "rejected"
			toast.success(`Envelope ${action} successfully`)
			setSelectedEnvelope(null)
			void refetch()
		},
		onError: (error) => {
			toast.error(`Failed to process envelope: ${error.message}`)
		}
	})

	const envelopes = envelopesData?.envelopes ?? []

	// Transform database envelope format to component format
	const transformEnvelope = (
		env: NonNullable<typeof envelopesData>["envelopes"][0]
	) => {
		// Type assertion to help TypeScript understand the data structure
		const envelope = env as any

		return {
			id: envelope.id,
			title: envelope.title,
			description: envelope.description ?? undefined,
			status: envelope.status,
			createdAt: envelope.createdAt.toISOString(),
			completedAt: null, // Envelope model doesn't have completedAt field
			createdBy: {
				id: envelope.createdBy.id,
				name: envelope.createdBy.name ?? "Unknown User",
				email: envelope.createdBy.email ?? "",
				role: envelope.createdBy.role,
				organization: envelope.createdBy.organization ?? undefined
			},
			documents: envelope.documents
				.filter((doc: any) => !doc.name.includes("_signed.pdf"))
				.map((doc: any) => ({
					id: doc.id,
					name: doc.name,
					status: "PENDING", // Document model doesn't have status field
					size: doc.size ?? 0,
					recipients:
						doc.recipients?.map((rec: any) => ({
							id: rec.id,
							name: rec.user?.name ?? "Unknown",
							email: rec.user?.email ?? "",
							role: rec.role,
							status: rec.status,
							signedAt: undefined // Recipient model doesn't have timestamp fields
						})) ?? []
				}))
		}
	}

	const transformedEnvelopes = envelopes.map(transformEnvelope)

	const handleApprovalAction = (
		action: "approve" | "reject",
		comments: string,
		reason: string
	) => {
		if (!selectedEnvelope) return

		approveMutation.mutate({
			envelopeId: selectedEnvelope,
			action,
			comments: comments || undefined,
			reason: reason || undefined
		})
	}

	const handleApprove = (comments: string, reason: string) => {
		handleApprovalAction("approve", comments, reason)
	}

	const handleReject = (comments: string, reason: string) => {
		handleApprovalAction("reject", comments, reason)
	}

	const getEmptyStateContent = (tab: EnvelopeStatus) => {
		switch (tab) {
			case "pending":
				return {
					icon: <CheckCircle className="mb-4 h-12 w-12 text-green-500" />,
					title: "No pending approvals",
					description: "All assigned envelopes have been reviewed."
				}
			case "approved":
				return {
					icon: <CheckCircle className="mb-4 h-12 w-12 text-green-500" />,
					title: "No approved envelopes",
					description: "Approved envelopes will appear here."
				}
			case "rejected":
				return {
					icon: <XCircle className="mb-4 h-12 w-12 text-red-500" />,
					title: "No rejected envelopes",
					description: "Rejected envelopes will appear here."
				}
		}
	}

	if (error) {
		return (
			<div className="py-12 text-center">
				<h2 className="text-lg font-semibold text-red-600">
					Error loading approvals
				</h2>
				<p className="text-muted-foreground">{error.message}</p>
			</div>
		)
	}

	const emptyState = getEmptyStateContent(activeTab)

	return (
		<div className="space-y-6">
			<Tabs
				value={activeTab}
				onValueChange={(value) => setActiveTab(value as EnvelopeStatus)}
				className="space-y-6"
			>
				<TabsList>
					<TabsTrigger value="pending" className="space-x-2">
						<Clock className="h-4 w-4" />
						<span>Pending Approval</span>
					</TabsTrigger>
					<TabsTrigger value="approved" className="space-x-2">
						<CheckCircle className="h-4 w-4" />
						<span>Approved</span>
					</TabsTrigger>
					<TabsTrigger value="rejected" className="space-x-2">
						<XCircle className="h-4 w-4" />
						<span>Rejected</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value={activeTab} className="space-y-4">
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin" />
							<span className="ml-2">Loading envelopes...</span>
						</div>
					) : transformedEnvelopes.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								{emptyState.icon}
								<h3 className="mb-2 text-lg font-semibold">
									{emptyState.title}
								</h3>
								<p className="text-muted-foreground">
									{emptyState.description}
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4">
							{transformedEnvelopes.map((envelope) => (
								<EnvelopeCard
									key={envelope.id}
									envelope={envelope}
									onClick={() => setSelectedEnvelope(envelope.id as string)}
								/>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Envelope Details Modal */}
			{selectedEnvelope && transformedSelectedEnvelope && (
				<EnvelopeDetailsModal
					envelope={transformedSelectedEnvelope}
					isOpen={!!selectedEnvelope}
					onClose={() => setSelectedEnvelope(null)}
					onApprove={handleApprove}
					onReject={handleReject}
				/>
			)}
		</div>
	)
}
