import { Card, CardContent, CardHeader } from "@/core/components/ui/card"
import { Skeleton } from "@/core/components/ui/skeleton"

export default function ReviewLoading() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-96" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-10 w-32" />
					<Skeleton className="h-10 w-28" />
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-5">
				{Array.from({ length: 5 }).map((_, i) => (
					<Card key={i}>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div className="space-y-2">
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-6 w-8" />
								</div>
								<Skeleton className="h-8 w-8 rounded" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-col gap-4 sm:flex-row">
						<Skeleton className="h-10 flex-1" />
						<Skeleton className="h-10 w-full sm:w-[180px]" />
						<Skeleton className="h-10 w-full sm:w-[180px]" />
						<Skeleton className="h-10 w-full sm:w-[180px]" />
					</div>
				</CardContent>
			</Card>

			{/* Content */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<div className="space-y-4">
					<Skeleton className="h-6 w-48" />
					{Array.from({ length: 4 }).map((_, i) => (
						<Card key={i}>
							<CardContent className="space-y-3 p-4">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2">
										<Skeleton className="h-4 w-4" />
										<Skeleton className="h-4 w-48" />
									</div>
									<div className="flex items-center gap-2">
										<Skeleton className="h-2 w-2 rounded-full" />
										<Skeleton className="h-6 w-20" />
									</div>
								</div>
								<Skeleton className="h-8 w-full" />
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-20" />
									</div>
									<div className="flex items-center gap-2">
										<Skeleton className="h-4 w-8" />
										<Skeleton className="h-4 w-12" />
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
				<div className="space-y-4">
					<Skeleton className="h-6 w-32" />
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-64" />
							<Skeleton className="h-4 w-48" />
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-16 w-full" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-20 w-full" />
							</div>
							<div className="flex gap-2">
								<Skeleton className="h-10 flex-1" />
								<Skeleton className="h-10 flex-1" />
								<Skeleton className="h-10 w-24" />
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
