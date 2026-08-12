"use client"

import { Badge } from "@/core/components/ui/badge"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"

import { trpc } from "@/services/trpc/client"

import { getEventTypeDisplayName } from "../utils/audit.utils"

export function AuditEventStats() {
	const { data: stats, isLoading, error } = trpc.auditEvent.getStats.useQuery()

	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Loading...</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="h-8 animate-pulse rounded bg-gray-200"></div>
						</CardContent>
					</Card>
				))}
			</div>
		)
	}

	if (error || !stats) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-red-500">Failed to load audit statistics</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Events</CardTitle>
						<span className="text-2xl">📊</span>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.totalEvents.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">
							All time audit events
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Today&apos;s Events
						</CardTitle>
						<span className="text-2xl">📅</span>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.todayEvents.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">Events logged today</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Recent Activity
						</CardTitle>
						<span className="text-2xl">⚡</span>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.recentEvents.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground">Last 7 days</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Event Types</CardTitle>
						<span className="text-2xl">🏷️</span>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.eventsByType.length}
						</div>
						<p className="text-xs text-muted-foreground">
							Different event types
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Events by Type */}
			<Card>
				<CardHeader>
					<CardTitle>Events by Type</CardTitle>
					<CardDescription>Breakdown of audit events by type</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{stats.eventsByType.slice(0, 10).map((item, index) => (
							<div
								key={item.eventType}
								className="flex items-center justify-between"
							>
								<div className="flex items-center gap-2">
									<span className="w-6 text-sm text-gray-500">
										{index + 1}.
									</span>
									<Badge variant="outline">
										{getEventTypeDisplayName(item.eventType)}
									</Badge>
								</div>
								<div className="flex items-center gap-2">
									<div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
										<div
											className="h-full rounded-full bg-blue-500"
											style={{
												width: `${stats.eventsByType[0] ? (item.count / stats.eventsByType[0].count) * 100 : 0}%`
											}}
										/>
									</div>
									<span className="w-12 text-right text-sm font-medium">
										{item.count}
									</span>
								</div>
							</div>
						))}
						{stats.eventsByType.length > 10 && (
							<p className="pt-2 text-center text-xs text-gray-500">
								... and {stats.eventsByType.length - 10} more event types
							</p>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
