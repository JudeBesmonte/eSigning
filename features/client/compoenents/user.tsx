import { useState } from "react"
import {
	Briefcase,
	Edit,
	Eye,
	FileText,
	MoreHorizontal,
	Trash2,
	User as UserIcon
} from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/core/components/ui/dropdown-menu"

import { type UpdateUserInput, type User } from "../api/user.schema"
import { ClientProfile } from "./client-profile"
import { EditUserDialog } from "./edit-user-dialog"

export function UserTable({
	users,
	onUpdateUser,
	onDeleteUser
}: {
	users: User[]
	onUpdateUser?: (
		userId: string,
		userData: Omit<UpdateUserInput, "id">
	) => Promise<void>
	onDeleteUser?: (userId: string) => void
}) {
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
	const [isPanelOpen, setIsPanelOpen] = useState(false)
	const [editUserId, setEditUserId] = useState<string | null>(null)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

	const selectedUser = selectedUserId
		? (users.find((user) => user.id === selectedUserId) ?? null)
		: null
	const editUser = editUserId
		? (users.find((user) => user.id === editUserId) ?? null)
		: null

	const handleView = (userId: string) => {
		setSelectedUserId(userId)
		setIsPanelOpen(true)
	}

	const handleEdit = (userId: string) => {
		setEditUserId(userId)
		setIsEditDialogOpen(true)
	}

	const handleSaveUser = async (
		userId: string,
		userData: Omit<UpdateUserInput, "id">
	) => {
		if (onUpdateUser) {
			await onUpdateUser(userId, userData)
		} else {
			// Fallback: log the update (you can implement API call here)
			console.log("Update user:", userId, userData)
		}
	}

	const handleCloseEditDialog = () => {
		setEditUserId(null)
		setIsEditDialogOpen(false)
	}

	const handleDelete = async (userId: string) => {
		if (onDeleteUser) {
			onDeleteUser(userId)
		} else {
			// Fallback: log the delete (you can implement API call here)
			console.log("Delete user:", userId)
			if (confirm("Are you sure you want to delete this user?")) {
				console.log("User deletion confirmed but no handler provided")
			}
		}
	}

	const getRoleBadge = (role: string) => {
		switch (role) {
			case "CLIENT":
				return "bg-blue-100 text-blue-800"
			case "ADMIN":
				return "bg-green-100 text-green-800"
			case "SUPER_ADMIN":
				return "bg-orange-100 text-orange-800"
			default:
				return "bg-gray-100 text-gray-800"
		}
	}

	const getRoleDisplayName = (role: string) => {
		switch (role) {
			case "CLIENT":
				return "Client"
			case "ADMIN":
				return "Administrator"
			case "SUPER_ADMIN":
				return "Super Administrator"
			default:
				return role
		}
	}

	const getStatusBadge = (verified: Date | null) => {
		return verified
			? "bg-green-100 text-green-800"
			: "bg-gray-100 text-gray-800"
	}

	return (
		<div className="space-y-4">
			{users.length === 0 ? (
				<div className="py-8 text-center">
					<p className="text-gray-500">No clients found</p>
				</div>
			) : (
				users.map((user) => (
					<div
						key={user.id}
						className="flex flex-col justify-between rounded-lg border p-4 md:flex-row md:items-center"
					>
						<div className="flex items-center space-x-4">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
								<UserIcon className="h-5 w-5 text-gray-500" />
							</div>
							<div>
								<p className="font-medium">{user.name}</p>
								<div className="flex items-center space-x-2 text-sm text-gray-500">
									<span>{user.email}</span>
									{user.organization && (
										<>
											<span>•</span>
											<span>{user.organization}</span>
										</>
									)}
								</div>
							</div>
						</div>
						<div className="mt-4 flex flex-wrap items-center gap-3 md:mt-0">
							<Badge className={getRoleBadge(user.role)}>
								{user.role === "ADMIN" ? (
									<Briefcase className="mr-1 h-3 w-3" />
								) : user.role === "SUPER_ADMIN" ? (
									<FileText className="mr-1 h-3 w-3" />
								) : (
									<UserIcon className="mr-1 h-3 w-3" />
								)}
								{getRoleDisplayName(user.role)}
							</Badge>
							<Badge
								className={getStatusBadge(
									user.emailVerified ? new Date(user.emailVerified) : null
								)}
							>
								{user.emailVerified ? "Active" : "Inactive"}
							</Badge>
							<div className="flex items-center space-x-1 text-sm text-gray-500">
								<FileText className="h-3.5 w-3.5" />
								<span>0</span>
							</div>
							<div className="flex items-center space-x-2">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon" className="h-8 w-8">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => handleView(user.id)}>
											<Eye className="mr-2 h-4 w-4" />
											View
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => handleEdit(user.id)}>
											<Edit className="mr-2 h-4 w-4" />
											Edit
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => handleDelete(user.id)}
											className="text-red-600 focus:text-red-600"
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</div>
				))
			)}

			{/* Profile Panel */}
			<ClientProfile
				user={selectedUser}
				isOpen={isPanelOpen}
				onClose={() => setIsPanelOpen(false)}
				getRoleBadge={getRoleBadge}
				getStatusBadge={getStatusBadge}
			/>

			{/* Edit User Dialog */}
			<EditUserDialog
				user={editUser}
				isOpen={isEditDialogOpen}
				onClose={handleCloseEditDialog}
				onSave={handleSaveUser}
			/>
		</div>
	)
}
