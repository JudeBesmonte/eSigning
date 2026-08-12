import { Card, CardContent, CardHeader } from "@/core/components/ui/card"
import { Skeleton } from "@/core/components/ui/skeleton"

export default function TemplateManagementLoading() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div className="space-y-2">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-96" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-10 w-36" />
					<Skeleton className="h-10 w-32" />
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-5">
				{Array.from({ length: 5 }).map((_, i) => (
					<Card key={i}>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div className="space-y-2">
									<Skeleton className="h-4 w-20" />
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
					<div className="flex flex-col gap-4 lg:flex-row">
						<Skeleton className="h-10 flex-1" />
						<div className="flex flex-col gap-2 sm:flex-row">
							<Skeleton className="h-10 w-full sm:w-[150px]" />
							<Skeleton className="h-10 w-full sm:w-[150px]" />
							<Skeleton className="h-10 w-full sm:w-[180px]" />
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Templates Grid */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-2">
									<Skeleton className="h-4 w-4" />
									<Skeleton className="h-6 w-20" />
								</div>
								<Skeleton className="h-6 w-16" />
							</div>
							<Skeleton className="h-6 w-48" />
							<Skeleton className="h-8 w-full" />
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								{Array.from({ length: 4 }).map((_, j) => (
									<div key={j} className="flex items-center justify-between">
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-4 w-20" />
									</div>
								))}
							</div>
							<div className="flex flex-wrap gap-1">
								{Array.from({ length: 3 }).map((_, j) => (
									<Skeleton key={j} className="h-5 w-16" />
								))}
							</div>
							<div className="flex items-center gap-1">
								<Skeleton className="h-4 w-4 rounded-full" />
								<Skeleton className="h-4 w-32" />
							</div>
							<div className="flex gap-2">
								<Skeleton className="h-8 flex-1" />
								<Skeleton className="h-8 w-16" />
								<Skeleton className="h-8 w-16" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
