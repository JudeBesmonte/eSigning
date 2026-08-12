"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"

import { UserTable } from "@/features/user-management2/components/user-table"
import { User2Modal } from "@/features/user-management2/components/user2-modal"

export default function UserManagementPage() {
	const [isModalOpen, setIsModalOpen] = useState(false)
	return (
		<div className="max-w-8xl container mx-auto">
			<div className="space-y-6">
				<div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
					<div className="space-y-1">
						<h1 className="text-2xl font-bold tracking-tight">
							User Management
						</h1>
						<p className="text-muted-foreground">
							Manage your organization&apos;s users and their permissions
						</p>
					</div>
					<Button
						className="w-full sm:w-auto"
						onClick={() => setIsModalOpen(true)}
					>
						<Plus className="mr-2 h-4 w-4" />
						Add New User
					</Button>
				</div>

				<Card>
					<CardHeader className="pb-3">
						<div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
							<div className="space-y-1">
								<CardTitle className="text-lg">Users</CardTitle>
								<CardDescription>
									View and manage all registered users in your organization.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="rounded-md border">
							<UserTable />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Add New User Modal */}
			<User2Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSuccess={() => {
					// You might want to refresh the user table here
					// This would require exposing a refetch function from the UserTable component
					// or using a state management solution
				}}
			/>
		</div>
	)
}
