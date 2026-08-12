import { Suspense } from "react"

import { AddUserDialog } from "@/features/user-management/components/add-user-dialog"
import { FilterControls } from "@/features/user-management/components/filter-controls"
import { ServerUserList } from "@/features/user-management/components/server-user-list"
import { UserStats } from "@/features/user-management/components/user-stats"

export default function UsersPage() {
	return (
		<div className="space-y-6" suppressHydrationWarning>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
						User Management
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Manage platform users, roles, and permissions
					</p>
				</div>
				<AddUserDialog />
			</div>

			<UserStats />

			<FilterControls />

			<Suspense fallback={<div>Loading users...</div>}>
				<ServerUserList />
			</Suspense>
		</div>
	)
}
