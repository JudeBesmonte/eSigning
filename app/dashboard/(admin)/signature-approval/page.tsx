import { Suspense } from "react"

// import { SignatureApprovalDashboard } from "@/features/signature-approval/components"
import { Skeleton } from "@/core/components/ui/skeleton"

export default function SignatureApprovalPage() {
	return (
		<Suspense fallback={<SignatureApprovalPageSkeleton />}>
			{/* <SignatureApprovalDashboard /> */}
		</Suspense>
	)
}

const SignatureApprovalPageSkeleton = () => {
	return (
		<div className="container mx-auto space-y-6 p-6">
			{/* Header Skeleton */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-80" />
				<Skeleton className="h-4 w-96" />
			</div>

			{/* Stats Cards Skeleton */}
			<div className="grid gap-4 md:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="rounded-lg border p-6">
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-4 rounded-full" />
						</div>
						<div className="mt-2">
							<Skeleton className="h-8 w-16" />
						</div>
					</div>
				))}
			</div>

			{/* Table Skeleton */}
			<div className="rounded-lg border">
				<div className="p-6">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Skeleton className="h-6 w-48" />
							<Skeleton className="h-4 w-96" />
						</div>
						<div className="flex gap-4">
							<Skeleton className="h-10 flex-1" />
							<Skeleton className="h-10 w-32" />
						</div>
					</div>
				</div>
				<div className="border-t">
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className="flex items-center border-b p-4 last:border-b-0"
						>
							<div className="flex-1 space-y-1">
								<Skeleton className="h-4 w-48" />
								<Skeleton className="h-3 w-24" />
							</div>
							<div className="flex w-48 items-center space-x-3">
								<Skeleton className="h-8 w-8 rounded-full" />
								<div className="space-y-1">
									<Skeleton className="h-3 w-20" />
									<Skeleton className="h-3 w-32" />
								</div>
							</div>
							<Skeleton className="h-6 w-20" />
							<div className="w-24 space-y-1">
								<Skeleton className="h-3 w-16" />
								<Skeleton className="h-2 w-full" />
							</div>
							<Skeleton className="h-4 w-20" />
							<div className="flex space-x-2">
								<Skeleton className="h-8 w-8" />
								<Skeleton className="h-8 w-8" />
								<Skeleton className="h-8 w-8" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
