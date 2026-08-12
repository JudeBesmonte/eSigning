"use client"

import { useState, useTransition } from "react"
import {
	AlertCircle,
	CheckCircle,
	Clock,
	Edit,
	MoreVertical,
	Shield,
	Trash2
} from "lucide-react"
import { parseAsInteger, useQueryState } from "nuqs"
import { toast } from "sonner"

import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from "@/core/components/ui/avatar"
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/core/components/ui/dropdown-menu"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"

import { trpc, type RouterOutputs } from "@/services/trpc/client"

import { ConfirmationModal } from "./confirmation-modal"
import { Pagination } from "./pagination"
import { UserActions } from "./user-actions"
import { UserProfileSheet } from "./user-profile-sheet"

type User = RouterOutputs["userManagement"]["list"]["users"][number]
type PaginationData = RouterOutputs["userManagement"]["list"]["pagination"]

interface ClientUserListProps {
	users: User[]
	pagination: PaginationData
}

export function ClientUserList({ users, pagination }: ClientUserListProps) {
	const [isPending, startTransition] = useTransition()
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
	const [confirmationModal, setConfirmationModal] = useState<{
		open: boolean
		action: "suspend" | "unsuspend" | "delete"
		userId: string
		userName: string
	}>({
		open: false,
		action: "suspend",
		userId: "",
		userName: ""
	})

	// Use nuqs for URL state management
	const [, setPage] = useQueryState(
		"page",
		parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true })
	)
	const [limit, setLimit] = useQueryState(
		"limit",
		parseAsInteger.withDefault(10).withOptions({ clearOnDefault: true })
	)

	const utils = trpc.useUtils()

	// Handle page changes
	const handlePageChange = (newPage: number) => {
		startTransition(() => {
			void setPage(newPage === 1 ? null : newPage)
		})
	}

	// Handle page size changes
	const handlePageSizeChange = (newSize: number) => {
		startTransition(() => {
			void setLimit(newSize === 10 ? null : newSize)
			void setPage(null) // Reset to page 1
		})
	}

	const approveUserMutation = trpc.userManagement.approve.useMutation({
		onSuccess: () => {
			toast.success("User approved successfully")
			// Invalidate all related queries
			void utils.userManagement.list.invalidate()
			void utils.userManagement.stats.invalidate()
		},
		onError: (error) => {
			toast.error(error.message || "Failed to approve user")
		}
	})

	const suspendUserMutation = trpc.userManagement.suspend.useMutation({
		onSuccess: () => {
			toast.success("User suspended successfully")
			void utils.userManagement.list.invalidate()
			void utils.userManagement.stats.invalidate()
		},
		onError: (error) => {
			toast.error(error.message || "Failed to suspend user")
		}
	})

	const unsuspendUserMutation = trpc.userManagement.unsuspend.useMutation({
		onSuccess: () => {
			toast.success("User unsuspended successfully")
			void utils.userManagement.list.invalidate()
			void utils.userManagement.stats.invalidate()
		},
		onError: (error) => {
			toast.error(error.message || "Failed to unsuspend user")
		}
	})

	const deleteUserMutation = trpc.userManagement.delete.useMutation({
		onSuccess: () => {
			toast.success("User deleted successfully")
			void utils.userManagement.list.invalidate()
			void utils.userManagement.stats.invalidate()
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete user")
		}
	})

	const handleApproveUser = async (userId: string) => {
		try {
			await approveUserMutation.mutateAsync({ id: userId })
		} catch {
			// Error is handled by onError callback
		}
	}

	const openConfirmationModal = (
		action: "suspend" | "unsuspend" | "delete",
		userId: string,
		userName: string
	) => {
		setConfirmationModal({
			open: true,
			action,
			userId,
			userName
		})
	}

	const closeConfirmationModal = () => {
		setConfirmationModal({
			open: false,
			action: "suspend",
			userId: "",
			userName: ""
		})
	}

	const handleConfirmAction = async () => {
		const { action, userId } = confirmationModal
		try {
			switch (action) {
				case "suspend":
					await suspendUserMutation.mutateAsync({ id: userId })
					break
				case "unsuspend":
					await unsuspendUserMutation.mutateAsync({ id: userId })
					break
				case "delete":
					await deleteUserMutation.mutateAsync({ id: userId })
					break
			}
			closeConfirmationModal()
		} catch {
			// Error is handled by onError callback
		}
	}

	const getRoleColor = (role: string) => {
		switch (role) {
			case "client":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
			case "admin":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
			case "super-admin":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
		}
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
			case "pending":
				return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
			case "suspended":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
		}
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "active":
				return (
					<CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
				)
			case "pending":
				return (
					<Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
				)
			case "suspended":
				return (
					<AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
				)
			default:
				return (
					<AlertCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
				)
		}
	}

	return (
		<Card suppressHydrationWarning>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Users</CardTitle>
						<CardDescription>
							{pagination.totalCount} user(s) found
						</CardDescription>
					</div>
					<div className="flex items-center space-x-2">
						<span className="text-sm text-muted-foreground">Show:</span>
						<Select
							value={limit.toString()}
							onValueChange={(value) => handlePageSizeChange(Number(value))}
							disabled={isPending}
						>
							<SelectTrigger className="w-20">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="5">5</SelectItem>
								<SelectItem value="10">10</SelectItem>
								<SelectItem value="20">20</SelectItem>
								<SelectItem value="50">50</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{users.map((user) => (
						<div
							key={user.id}
							className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
						>
							<div className="flex flex-1 items-center space-x-4">
								<Avatar className="h-12 w-12">
									{user.avatar ? (
										<AvatarImage src={user.avatar} alt={user.name} />
									) : null}
									<AvatarFallback className="bg-muted font-medium text-muted-foreground">
										{user.name
											.split(" ")
											.map((n) => n[0])
											.join("")
											.toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0 flex-1">
									<div className="mb-1 flex items-center space-x-2">
										<h3 className="truncate font-medium text-gray-900 dark:text-white">
											{user.name}
										</h3>
										{user.status === "active" && (
											<Shield
												className="h-4 w-4 text-blue-600"
												aria-label="Verified"
											/>
										)}
									</div>
									<p className="truncate text-sm text-gray-600 dark:text-gray-400">
										{user.email}
									</p>
									{user.organization && (
										<p className="truncate text-sm text-gray-500">
											{user.organization}
										</p>
									)}
									<div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
										<span>Last login: {user.lastActive}</span>
										<span>Documents: {user.documentsCount}</span>
									</div>
								</div>
							</div>
							<div className="flex items-center space-x-4">
								<div className="flex flex-col items-end space-y-2">
									<Badge className={getRoleColor(user.role)}>{user.role}</Badge>
									<Badge className={getStatusColor(user.status)}>
										<div className="flex items-center space-x-1">
											{getStatusIcon(user.status)}
											<span>{user.status}</span>
										</div>
									</Badge>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon">
											<MoreVertical className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuLabel>Actions</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() => setSelectedUserId(user.id)}
										>
											<Edit className="mr-2 h-4 w-4" />
											Edit User
										</DropdownMenuItem>
										<UserProfileSheet
											userId={user.id}
											trigger={
												<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
													<Shield className="mr-2 h-4 w-4" />
													View Profile
												</DropdownMenuItem>
											}
										/>
										{user.status === "pending" && (
											<DropdownMenuItem
												onClick={() => handleApproveUser(user.id)}
											>
												<CheckCircle className="mr-2 h-4 w-4" />
												Approve User
											</DropdownMenuItem>
										)}
										{user.status === "active" && (
											<DropdownMenuItem
												onClick={() =>
													openConfirmationModal("suspend", user.id, user.name)
												}
											>
												<AlertCircle className="mr-2 h-4 w-4" />
												Suspend User
											</DropdownMenuItem>
										)}
										{user.status === "suspended" && (
											<DropdownMenuItem
												onClick={() =>
													openConfirmationModal("unsuspend", user.id, user.name)
												}
											>
												<CheckCircle className="mr-2 h-4 w-4" />
												Unsuspend User
											</DropdownMenuItem>
										)}
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="text-red-600"
											onClick={() =>
												openConfirmationModal("delete", user.id, user.name)
											}
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Delete User
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					))}

					{/* Pagination */}
					{pagination.totalPages > 1 && (
						<div className="mt-6 border-t pt-4">
							<Pagination
								currentPage={pagination.page}
								totalPages={pagination.totalPages}
								onPageChange={handlePageChange}
							/>
						</div>
					)}
				</div>
			</CardContent>

			{/* User Actions Dialog */}
			{selectedUserId && (
				<UserActions
					userId={selectedUserId}
					open={!!selectedUserId}
					onOpenChange={(open: boolean) => !open && setSelectedUserId(null)}
					onSuccess={() => {
						setSelectedUserId(null)
						void utils.userManagement.list.invalidate()
						void utils.userManagement.stats.invalidate()
					}}
				/>
			)}

			{/* Confirmation Modal */}
			<ConfirmationModal
				open={confirmationModal.open}
				onOpenChange={(open) => !open && closeConfirmationModal()}
				action={confirmationModal.action}
				userName={confirmationModal.userName}
				onConfirm={handleConfirmAction}
				isLoading={
					suspendUserMutation.isPending ||
					unsuspendUserMutation.isPending ||
					deleteUserMutation.isPending
				}
			/>
		</Card>
	)
}
