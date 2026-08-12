// "use client"

// import {
// 	Card,
// 	CardContent,
// 	CardDescription,
// 	CardHeader,
// 	CardTitle
// } from "@/core/components/ui/card"

// import { trpc } from "@/services/trpc/client"

// export function RecentActivityCard() {
// 	const { data } = trpc.profile.getRecentActivity.useQuery()

// 	return (
// 		<Card>
// 			<CardHeader>
// 				<CardTitle>Recent Activity</CardTitle>
// 				<CardDescription>
// 					Your recent actions and document activities
// 				</CardDescription>
// 			</CardHeader>
// 			<CardContent>
// 				<div className="space-y-4">
// 					{data?.activity.map((activity, index) => (
// 						<div
// 							key={index}
// 							className="flex items-center justify-between rounded-lg border p-3"
// 						>
// 							<div>
// 								<p className="font-medium">{activity.action}</p>
// 								{activity.document && (
// 									<p className="text-sm text-gray-600">{activity.document}</p>
// 								)}
// 							</div>
// 							<span className="text-sm text-gray-500">
// 								{activity.timestamp}
// 							</span>
// 						</div>
// 					))}
// 				</div>
// 			</CardContent>
// 		</Card>
// 	)
// }
