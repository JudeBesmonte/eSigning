import React from "react"

import { Card, CardContent, CardHeader } from "@/core/components/ui/card"
import { Skeleton } from "@/core/components/ui/skeleton"

export const DocumentDetailLoading: React.FC = () => {
	return (
		<div className="space-y-6">
			{/* Header Loading */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="space-y-2">
					<div className="flex items-center space-x-2">
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-6 w-20" />
					</div>
					<Skeleton className="h-4 w-80" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-9 w-24" />
					<Skeleton className="h-9 w-20" />
					<Skeleton className="h-9 w-16" />
				</div>
			</div>

			{/* Tabs Loading */}
			<div className="space-y-4">
				<Skeleton className="h-10 w-96" />

				{/* Content Loading */}
				<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
					{/* Document Preview */}
					<Card className="md:col-span-2">
						<CardHeader>
							<Skeleton className="h-6 w-40" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-[400px] w-full" />
						</CardContent>
					</Card>

					{/* Details Sidebar */}
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-32" />
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-16 w-full" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-6 w-full" />
							</div>
							<div className="space-y-2">
								{Array.from({ length: 4 }).map((_, i) => (
									<div key={i} className="flex justify-between">
										<Skeleton className="h-4 w-20" />
										<Skeleton className="h-4 w-24" />
									</div>
								))}
							</div>
							<div className="grid grid-cols-2 gap-2">
								{Array.from({ length: 4 }).map((_, i) => (
									<Skeleton key={i} className="h-8 w-full" />
								))}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Signing Status Loading */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-32" />
						<Skeleton className="h-4 w-48" />
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex justify-between">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-4 w-24" />
							</div>
							<Skeleton className="h-3 w-full" />
							<div className="space-y-4">
								{Array.from({ length: 3 }).map((_, i) => (
									<div key={i} className="flex justify-between">
										<div className="flex items-center space-x-3">
											<Skeleton className="h-8 w-8 rounded-full" />
											<div className="space-y-1">
												<Skeleton className="h-4 w-24" />
												<Skeleton className="h-3 w-32" />
											</div>
										</div>
										<Skeleton className="h-6 w-16" />
									</div>
								))}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
