"use client"

import Link from "next/link"
import type { AuditEventType } from "@prisma/client"
import { formatDistanceToNow } from "date-fns"
import {
	AlertCircle,
	Calendar,
	CheckCircle,
	Clock,
	Edit,
	Eye,
	FileText,
	MessageSquare,
	Shield,
	Trash2,
	Upload
} from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import { Skeleton } from "@/core/components/ui/skeleton"

import { trpc } from "@/services/trpc/client"

import { getEventTypeDisplayName } from "@/features/audit-event/utils/audit.utils"

// Type for audit event with includes
type AuditEventWithIncludes = {
	id: string
	eventType: AuditEventType
	description: string
	userEmail: string | null
	userName: string | null
	timestamp: Date
	metadata: Record<string, unknown> | null
	envelope: {
		id: string
		title: string
		status: string
	} | null
	document: {
		id: string
		name: string
		type: string
	} | null
	recipient: {
		id: string
		role: string
		status: string
		user: {
			name: string | null
			email: string
		}
	} | null
}

export function IndividualDashboard() {
	// Fetch user statistics
	const userStatsQuery = trpc.dashboard.getUserStats.useQuery({})
	const userStats = userStatsQuery.data
	const isLoadingStats = userStatsQuery.isLoading

	// Fetch pending documents
	const pendingDocumentsQuery = trpc.dashboard.getPendingDocuments.useQuery()
	const pendingDocuments = pendingDocumentsQuery.data ?? []
	const isLoadingPending = pendingDocumentsQuery.isLoading

	// Fetch audit events for recent important events
	const auditEventsQuery = trpc.auditEvent.getMyEnvelopeEvents.useQuery({
		limit: 20
	})
	const auditEvents = (auditEventsQuery.data?.data ??
		[]) as AuditEventWithIncludes[]
	const isLoadingAuditEvents = auditEventsQuery.isLoading

	// Get recent important events (limit to 4 for display)
	const getImportantEvents = (
		events: AuditEventWithIncludes[]
	): AuditEventWithIncludes[] => {
		return events
			.filter((event) => {
				// Consider these as important events
				return (
					event.eventType.includes("SIGNED") ||
					event.eventType.includes("CREATED") ||
					event.eventType.includes("REJECTED") ||
					event.eventType.includes("COMPLETED") ||
					event.eventType.includes("PUBLISHED")
				)
			})
			.slice(0, 4)
	}

	const importantAuditEvents = getImportantEvents(auditEvents)

	const stats = [
		{
			title: "Documents to Sign",
			value: userStats?.documentsToSign.toString() ?? "0",
			icon: Clock,
			color: "text-orange-600 dark:text-orange-400"
		},
		{
			title: "Completed Documents",
			value: userStats?.completedDocuments.toString() ?? "0",
			icon: CheckCircle,
			color: "text-green-600 dark:text-green-400"
		},
		{
			title: "Verification Status",
			value: userStats?.verificationStatus ?? "Pending",
			icon: Shield,
			color: "text-blue-600 dark:text-blue-400"
		}
	]

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "high":
				return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
			case "medium":
				return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
			case "low":
				return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
		}
	}

	const getActivityIcon = (eventType: string) => {
		if (eventType.includes("SIGNED"))
			return (
				<CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
			)
		if (eventType.includes("CREATED") || eventType.includes("UPLOADED"))
			return <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
		if (eventType.includes("VIEWED"))
			return <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
		if (
			eventType.includes("REJECTED") ||
			eventType.includes("CANCELLED") ||
			eventType.includes("DECLINED")
		)
			return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
		if (eventType.includes("UPDATED") || eventType.includes("ADDED"))
			return <Edit className="h-4 w-4 text-orange-600 dark:text-orange-400" />
		if (eventType.includes("REMOVED"))
			return <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />

		switch (eventType) {
			case "DOCUMENT_SIGNED":
				return (
					<CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
				)
			case "ENVELOPE_VIEWED":
				return (
					<MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
				)
			case "REMINDER_SENT":
				return (
					<AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
				)
			default:
				return <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
						Welcome Back!
					</h1>
					<div className="text-gray-600 dark:text-gray-400">
						{isLoadingStats ? (
							<Skeleton className="h-4 w-64" />
						) : (
							`You have ${userStats?.documentsToSign ?? 0} documents waiting for your signature`
						)}
					</div>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{stats.map((stat) => (
					<Card key={stat.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{stat.title}
							</CardTitle>
							<stat.icon className={`h-4 w-4 ${stat.color}`} />
						</CardHeader>
						<CardContent>
							{isLoadingStats ? (
								<Skeleton className="h-8 w-16" />
							) : (
								<div className="text-2xl font-bold">{stat.value}</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Pending Signatures */}
				<Card>
					<CardHeader>
						<CardTitle>Documents Awaiting Signature</CardTitle>
						<CardDescription>
							Complete these documents to finalize your agreements
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoadingPending ? (
							<div className="space-y-4">
								{Array.from({ length: 3 }).map((_, i) => (
									<div
										key={i}
										className="flex items-center justify-between rounded-lg border p-4"
									>
										<div className="flex-1">
											<Skeleton className="mb-2 h-4 w-64" />
											<Skeleton className="mb-2 h-3 w-48" />
											<div className="flex items-center space-x-4">
												<Skeleton className="h-6 w-20" />
												<Skeleton className="h-3 w-24" />
											</div>
										</div>
										<Skeleton className="h-10 w-20" />
									</div>
								))}
							</div>
						) : pendingDocuments.length === 0 ? (
							<div className="py-8 text-center text-gray-500 dark:text-gray-400">
								No pending documents
							</div>
						) : (
							<div className="space-y-4">
								{pendingDocuments.map((doc) => (
									<div
										key={doc.id}
										className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
									>
										<div className="flex-1">
											<h4 className="font-medium text-gray-900 dark:text-gray-100">
												{doc.name}
											</h4>
											<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
												From: {doc.sender}
											</p>
											<div className="mt-2 flex items-center space-x-4">
												<Badge className={getPriorityColor(doc.priority)}>
													{doc.priority} priority
												</Badge>
												<span className="text-sm text-gray-600 dark:text-gray-400">
													Due: {doc.dueDate}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Quick Actions */}
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
						<CardDescription>Common tasks and shortcuts</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-4">
							<Button variant="outline" className="h-20 flex-col" asChild>
								<Link href="/dashboard/verification">
									<Shield className="mb-2 h-6 w-6" />
									Verify Identity
								</Link>
							</Button>
							<Button variant="outline" className="h-20 flex-col" asChild>
								<Link href="/dashboard/messages">
									<MessageSquare className="mb-2 h-6 w-6" />
									Messages
								</Link>
							</Button>
							<Button variant="outline" className="h-20 flex-col" asChild>
								<Link href="/dashboard/scheduling">
									<Calendar className="mb-2 h-6 w-6" />
									Schedule Session
								</Link>
							</Button>
							<Button variant="outline" className="h-20 flex-col" asChild>
								<Link href="/dashboard/audit-event">
									<FileText className="mb-2 h-6 w-6" />
									View Audit Log
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Recent Activity */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
					<CardDescription>
						Your latest important document activities
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoadingAuditEvents ? (
						<div className="space-y-4">
							{Array.from({ length: 4 }).map((_, i) => (
								<div key={i} className="flex items-start space-x-4">
									<Skeleton className="h-8 w-8 rounded-full" />
									<div className="flex-1">
										<Skeleton className="mb-2 h-4 w-72" />
										<Skeleton className="h-3 w-32" />
									</div>
								</div>
							))}
						</div>
					) : importantAuditEvents.length === 0 ? (
						<div className="py-8 text-center text-gray-500 dark:text-gray-400">
							No recent activity
						</div>
					) : (
						<div className="space-y-4">
							{importantAuditEvents.map((event) => (
								<div key={event.id} className="flex items-start space-x-4">
									<div className="rounded-full bg-gray-100 p-2 dark:bg-gray-800">
										{getActivityIcon(event.eventType)}
									</div>
									<div className="flex-1">
										<p className="text-sm text-gray-900 dark:text-gray-100">
											{getEventTypeDisplayName(event.eventType)}{" "}
											{event.envelope && (
												<span className="font-medium">
													&ldquo;{event.envelope.title}&rdquo;
												</span>
											)}
										</p>
										<p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
											{event.description}
										</p>
										<p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
											{formatDistanceToNow(new Date(event.timestamp), {
												addSuffix: true
											})}
										</p>
									</div>
								</div>
							))}

							{/* Show link to full audit page */}
							<div className="border-t border-gray-200 pt-4 dark:border-gray-700">
								<Button variant="outline" size="sm" asChild className="w-full">
									<Link href="/dashboard/audit-event">
										<FileText className="mr-2 h-4 w-4" />
										View Full Audit Log
									</Link>
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
