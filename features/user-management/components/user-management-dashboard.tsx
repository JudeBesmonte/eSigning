"use client"

import { useState } from "react"

import { AddUserDialog } from "./add-user-dialog"
import { UserFilters } from "./user-filters"
import { UserList } from "./user-list"
import { UserStats } from "./user-stats"

export function UserManagementDashboard() {
	const [searchTerm, setSearchTerm] = useState("")
	const [roleFilter, setRoleFilter] = useState("all")
	const [statusFilter, setStatusFilter] = useState("all")

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

			{/* User Statistics */}
			<UserStats />

			{/* Filters */}
			<UserFilters
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				roleFilter={roleFilter}
				setRoleFilter={setRoleFilter}
				statusFilter={statusFilter}
				setStatusFilter={setStatusFilter}
			/>

			{/* Users List */}
			<UserList
				searchTerm={searchTerm}
				roleFilter={roleFilter}
				statusFilter={statusFilter}
			/>
		</div>
	)
}
