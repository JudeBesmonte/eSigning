"use client"

import { useState } from "react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import { ScrollArea } from "@/core/components/ui/scroll-area"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"
import { Separator } from "@/core/components/ui/separator"

import { trpc } from "@/services/trpc/client"

import {
	formatAuditTimestamp,
	getEventCategory,
	getEventTypeDisplayName,
	getEventTypeIcon,
	getEventTypeVariant,
	type EventCategory
} from "../utils/audit.utils"

interface AuditTrailProps {
	envelopeId?: string
	documentId?: string
	recipientId?: string
	showFilters?: boolean
	maxHeight?: string
	limit?: number
}

type CategoryFilter = EventCategory | "all"

export function AuditTrail({
	documentId,
	recipientId,
	showFilters = true,
	maxHeight = "600px"
}: AuditTrailProps) {
	const [searchTerm, setSearchTerm] = useState("")
	const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")

	const { data, isLoading, error } =
		trpc.auditEvent.getMyEnvelopeEvents.useQuery({
			documentId,
			recipientId,
			limit: 100
		})

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Audit Trail</CardTitle>
					<CardDescription>Loading audit events...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8">
						<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
					</div>
				</CardContent>
			</Card>
		)
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Audit Trail</CardTitle>
					<CardDescription>Error loading audit events</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-red-500">
						Failed to load audit events. Please try again.
					</p>
				</CardContent>
			</Card>
		)
	}

	const events = data?.data ?? []

	// Apply filters with proper type safety
	let filteredEvents = events

	// Apply category filter using the utility function
	if (categoryFilter !== "all") {
		filteredEvents = filteredEvents.filter(
			(event) => getEventCategory(event.eventType) === categoryFilter
		)
	}

	// Apply search filter
	if (searchTerm.trim()) {
		const searchLower = searchTerm.toLowerCase()
		filteredEvents = filteredEvents.filter((event) => {
			const descriptionMatch = event.description
				.toLowerCase()
				.includes(searchLower)
			const emailMatch =
				event.userEmail?.toLowerCase().includes(searchLower) ?? false
			const nameMatch =
				event.userName?.toLowerCase().includes(searchLower) ?? false
			const typeMatch = getEventTypeDisplayName(event.eventType)
				.toLowerCase()
				.includes(searchLower)

			return descriptionMatch || emailMatch || nameMatch || typeMatch
		})
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					📋 Audit Trail
				</CardTitle>
				<CardDescription>
					Complete history of actions and events
				</CardDescription>
			</CardHeader>
			<CardContent>
				{showFilters && (
					<div className="mb-6 space-y-4">
						<div className="flex flex-col gap-4 sm:flex-row">
							<div className="flex-1">
								<Input
									placeholder="Search events..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full"
								/>
							</div>
							<div className="flex gap-2">
								<Select
									value={categoryFilter}
									onValueChange={(value) =>
										setCategoryFilter(value as CategoryFilter)
									}
								>
									<SelectTrigger className="w-[150px]">
										<SelectValue placeholder="Category" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Categories</SelectItem>
										<SelectItem value="envelope">Envelope</SelectItem>
										<SelectItem value="document">Document</SelectItem>
										<SelectItem value="recipient">Recipient</SelectItem>
										<SelectItem value="system">System</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				)}

				<ScrollArea style={{ height: maxHeight }}>
					{filteredEvents.length === 0 ? (
						<div className="py-8 text-center text-gray-500">
							{events.length === 0
								? "No audit events found"
								: "No events match your filters"}
						</div>
					) : (
						<div className="space-y-4">
							{filteredEvents.map((event, index) => (
								<div key={event.id}>
									<div className="flex items-start gap-4">
										<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm">
											{getEventTypeIcon(event.eventType)}
										</div>
										<div className="min-w-0 flex-1">
											<div className="mb-1 flex items-center justify-between gap-2">
												<div className="flex items-center gap-2">
													<Badge variant={getEventTypeVariant(event.eventType)}>
														{getEventTypeDisplayName(event.eventType)}
													</Badge>
													{event.envelope && (
														<span className="text-sm text-gray-500">
															{event.envelope.title}
														</span>
													)}
												</div>
												<span className="whitespace-nowrap text-xs text-gray-500">
													{formatAuditTimestamp(new Date(event.timestamp))}
												</span>
											</div>
											<p className="mb-1 text-sm text-gray-700">
												{event.description}
											</p>
											<div className="flex items-center gap-4 text-xs text-gray-500">
												{event.userEmail && (
													<span>👤 {event.userName ?? event.userEmail}</span>
												)}
												{event.ipAddress && <span>🌐 {event.ipAddress}</span>}
												{event.document && (
													<span>📄 {event.document.name}</span>
												)}
											</div>
											{event.metadata &&
												Object.keys(event.metadata).length > 0 && (
													<details className="mt-2">
														<summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
															View details
														</summary>
														<pre className="mt-1 rounded bg-gray-50 p-2 text-xs text-gray-600">
															{JSON.stringify(event.metadata, null, 2)}
														</pre>
													</details>
												)}
										</div>
									</div>
									{index < filteredEvents.length - 1 && (
										<Separator className="my-4" />
									)}
								</div>
							))}
						</div>
					)}
				</ScrollArea>

				{data?.hasMore && (
					<div className="mt-4 text-center">
						<Button variant="outline" size="sm">
							Load More Events
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
