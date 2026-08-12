"use client"

import { Badge } from "@/core/components/ui/badge"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import { Separator } from "@/core/components/ui/separator"

import { trpc } from "@/services/trpc/client"

import {
	formatAuditTimestamp,
	getEventTypeDisplayName,
	getEventTypeIcon,
	getEventTypeVariant,
	isEventCritical
} from "../utils/audit.utils"

interface AuditEventDetailProps {
	eventId: string
}

export function AuditEventDetail({ eventId }: AuditEventDetailProps) {
	const {
		data: event,
		isLoading,
		error
	} = trpc.auditEvent.getById.useQuery({ id: eventId })

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Loading Event Details...</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8">
						<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
					</div>
				</CardContent>
			</Card>
		)
	}

	if (error || !event) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Event Not Found</CardTitle>
					<CardDescription>
						The requested audit event could not be found.
					</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	const isCritical = isEventCritical(event.eventType)

	return (
		<Card className={isCritical ? "border-red-200" : ""}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg">
							{getEventTypeIcon(event.eventType)}
						</div>
						<div>
							<CardTitle className="flex items-center gap-2">
								Event Details
								{isCritical && (
									<Badge variant="destructive" className="text-xs">
										Critical
									</Badge>
								)}
							</CardTitle>
							<CardDescription>
								{formatAuditTimestamp(new Date(event.timestamp))}
							</CardDescription>
						</div>
					</div>
					<Badge variant={getEventTypeVariant(event.eventType)}>
						{getEventTypeDisplayName(event.eventType)}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Event Description */}
				<div>
					<h3 className="mb-2 font-semibold">Description</h3>
					<p className="text-gray-700">{event.description}</p>
				</div>

				<Separator />

				{/* User Information */}
				<div>
					<h3 className="mb-3 font-semibold">User Information</h3>
					<div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
						<div>
							<span className="text-gray-500">User:</span>
							<div className="font-medium">
								{event.userName ?? "Unknown User"}
							</div>
						</div>
						<div>
							<span className="text-gray-500">Email:</span>
							<div className="font-medium">
								{event.userEmail ?? "Not provided"}
							</div>
						</div>
						<div>
							<span className="text-gray-500">IP Address:</span>
							<div className="font-medium">
								{event.ipAddress ?? "Not recorded"}
							</div>
						</div>
						<div>
							<span className="text-gray-500">User Agent:</span>
							<div className="break-all text-xs font-medium">
								{event.userAgent ?? "Not recorded"}
							</div>
						</div>
					</div>
				</div>

				{/* Related Entities */}
				{(event.envelope ?? event.document ?? event.recipient) && (
					<>
						<Separator />
						<div>
							<h3 className="mb-3 font-semibold">Related Entities</h3>
							<div className="space-y-3">
								{event.envelope && (
									<div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
										<span className="text-lg">📄</span>
										<div>
											<div className="font-medium">{event.envelope.title}</div>
											<div className="text-sm text-gray-500">
												Envelope • Status: {event.envelope.status}
											</div>
										</div>
									</div>
								)}
								{event.document && (
									<div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
										<span className="text-lg">📄</span>
										<div>
											<div className="font-medium">{event.document.name}</div>
											<div className="text-sm text-gray-500">
												Document • Type: {event.document.type} • Size:{" "}
												{(event.document.size / 1024).toFixed(1)} KB
											</div>
										</div>
									</div>
								)}
								{event.recipient && (
									<div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
										<span className="text-lg">👤</span>
										<div>
											<div className="font-medium">
												{event.recipient.user?.name ?? "Unknown User"}
											</div>
											<div className="text-sm text-gray-500">
												Recipient • Role: {event.recipient.role} • Status:{" "}
												{event.recipient.status}
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</>
				)}

				{/* Metadata */}
				{event.metadata && Object.keys(event.metadata).length > 0 && (
					<>
						<Separator />
						<div>
							<h3 className="mb-3 font-semibold">Additional Information</h3>
							<div className="rounded-lg bg-gray-50 p-4">
								<pre className="whitespace-pre-wrap text-sm text-gray-700">
									{JSON.stringify(event.metadata, null, 2)}
								</pre>
							</div>
						</div>
					</>
				)}

				{/* Event ID and Timestamp */}
				<Separator />
				<div className="grid grid-cols-1 gap-4 text-xs text-gray-500 md:grid-cols-2">
					<div>
						<span className="mb-1 block">Event ID:</span>
						<code className="rounded bg-gray-100 px-2 py-1">{event.id}</code>
					</div>
					<div>
						<span className="mb-1 block">Timestamp:</span>
						<code className="rounded bg-gray-100 px-2 py-1">
							{new Date(event.timestamp).toISOString()}
						</code>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
