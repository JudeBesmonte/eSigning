import { Card, CardContent, CardHeader } from "@/core/components/ui/card"
import { Skeleton } from "@/core/components/ui/skeleton"

export default function SystemAnalyticsLoading() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-96" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-10 w-[180px]" />
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-10 w-32" />
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div className="space-y-2">
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-6 w-16" />
									<Skeleton className="h-3 w-24" />
								</div>
								<Skeleton className="h-8 w-8 rounded" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Tabs */}
			<div className="space-y-4">
				<div className="flex space-x-1 border-b">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-10 w-24" />
					))}
				</div>

				{/* Tab Content */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-48" />
							<Skeleton className="h-4 w-64" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-[300px] w-full" />
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-48" />
							<Skeleton className="h-4 w-64" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-[300px] w-full" />
						</CardContent>
					</Card>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Card key={i}>
							<CardContent className="p-4">
								<div className="space-y-2 text-center">
									<Skeleton className="mx-auto h-4 w-32" />
									<Skeleton className="mx-auto h-8 w-16" />
									<Skeleton className="mx-auto h-3 w-24" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	)
}
