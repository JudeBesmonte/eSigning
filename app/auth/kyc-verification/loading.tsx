import {
	Card,
	CardContent,
	CardFooter,
	CardHeader
} from "@/core/components/ui/card"
import { Skeleton } from "@/core/components/ui/skeleton"

export default function KYCVerificationLoading() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:to-gray-800">
			<Card className="w-full max-w-3xl">
				<CardHeader className="space-y-2">
					<Skeleton className="h-8 w-3/4" />
					<Skeleton className="h-4 w-1/2" />
					<Skeleton className="h-2 w-full" />
				</CardHeader>

				<CardContent className="space-y-6">
					<div className="space-y-4">
						<Skeleton className="mx-auto h-6 w-1/3" />
						<Skeleton className="mx-auto h-4 w-2/3" />
					</div>

					<div className="space-y-2">
						<Skeleton className="h-10 w-full" />
						<div className="aspect-video">
							<Skeleton className="h-full w-full" />
						</div>
						<div className="flex justify-center">
							<Skeleton className="h-10 w-32" />
						</div>
					</div>

					<Skeleton className="h-20 w-full" />
				</CardContent>

				<CardFooter className="flex justify-between">
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-10 w-24" />
				</CardFooter>
			</Card>
		</div>
	)
}
