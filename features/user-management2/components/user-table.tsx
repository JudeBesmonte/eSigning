"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Role } from "@prisma/client"
import {
	AlertCircle,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	Loader2,
	Mail,
	MoreHorizontal,
	Phone,
	Search,
	Shield,
	User
} from "lucide-react"

import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from "@/core/components/ui/avatar"
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/core/components/ui/dropdown-menu"
import { Input } from "@/core/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/core/components/ui/table"
import { cn } from "@/core/lib/utils"

import { trpc } from "@/services/trpc/client"

import { type UserWithRelations } from "@/features/user-management2/api/usermanagement2.router"

import { UserEdit } from "./user2-edit"
import { UserView } from "./user2-view"

type SortField = "name" | "email" | "role" | "status"
type SortDirection = "asc" | "desc"

interface SortConfig {
	field: SortField
	direction: SortDirection
}

export function UserTable() {
	const [page, setPage] = useState(1)
	const [limit, setLimit] = useState(5)
	const [searchQuery, setSearchQuery] = useState("")
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
	const [roleFilter, setRoleFilter] = useState<Role | "all">("all")
	const [statusFilter, setStatusFilter] = useState<
		"all" | "active" | "suspended"
	>("all")
	const [sortConfig, setSortConfig] = useState<SortConfig>({
		field: "name",
		direction: "asc"
	})
	const [selectedUser, setSelectedUser] = useState<UserWithRelations | null>(
		null
	)
	const [isEditOpen, setIsEditOpen] = useState(false)
	const [userToEdit, setUserToEdit] = useState<UserWithRelations | null>(null)

	// Get the trpc utils
	const utils = trpc.useUtils()

	// Debounce search query
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchQuery(searchQuery)
			setPage(1) // Reset to first page when search query changes
		}, 500) // 500ms delay

		return () => clearTimeout(timer)
	}, [searchQuery])

	// Fetch users using tRPC - without sorting since we'll handle it client-side
	const {
		data: usersData,
		isLoading,
		error
	} = trpc.userManagement2.getAll.useQuery({
		page,
		limit,
		search: debouncedSearchQuery || undefined,
		role: roleFilter === "all" ? undefined : roleFilter,
		status: statusFilter === "all" ? undefined : statusFilter
	})

	// Sort users client-side
	const sortedUsers = useMemo(() => {
		if (!usersData?.data) return []

		return [...usersData.data].sort((a, b) => {
			let aValue: string | number | null | undefined
			let bValue: string | number | null | undefined

			switch (sortConfig.field) {
				case "name":
					aValue = a.name?.toLowerCase() ?? ""
					bValue = b.name?.toLowerCase() ?? ""
					break
				case "email":
					aValue = a.email?.toLowerCase() ?? ""
					bValue = b.email?.toLowerCase() ?? ""
					break
				case "role":
					aValue = a.role ?? ""
					bValue = b.role ?? ""
					break
				case "status":
					aValue = a.suspendedAt ? "suspended" : "active"
					bValue = b.suspendedAt ? "suspended" : "active"
					break
				default:
					return 0
			}

			if (aValue < bValue) {
				return sortConfig.direction === "asc" ? -1 : 1
			}
			if (aValue > bValue) {
				return sortConfig.direction === "asc" ? 1 : -1
			}
			return 0
		})
	}, [usersData, sortConfig])

	// Create paginated data
	const paginatedUsers = useMemo(() => {
		if (!usersData) return { data: [], pagination: { total: 0, totalPages: 0 } }

		return {
			data: sortedUsers,
			pagination: usersData.pagination // Keep the original pagination info
		}
	}, [sortedUsers, usersData])

	const data = paginatedUsers

	// Handle page change
	const handlePreviousPage = () => {
		if (page > 1) setPage(page - 1)
	}

	const handleNextPage = () => {
		if (data && page < data.pagination.totalPages) {
			setPage(page + 1)
		}
	}

	// Handle row click
	const handleRowClick = (user: UserWithRelations) => {
		setSelectedUser(user)
	}

	// Handle edit click
	const handleEditClick = (user: UserWithRelations, e: React.MouseEvent) => {
		e.stopPropagation() // Prevent row click from triggering
		setUserToEdit(user)
		setIsEditOpen(true)
	}

	// Handle sort request - no need to reset page or trigger API call
	const requestSort = useCallback((field: SortField) => {
		setSortConfig((prevConfig) => ({
			field,
			direction:
				prevConfig.field === field && prevConfig.direction === "asc"
					? "desc"
					: "asc"
		}))
	}, [])

	// Reset to first page when filters or limit change (except sortConfig since we handle sorting locally now)
	useEffect(() => {
		setPage(1)
	}, [searchQuery, roleFilter, statusFilter, limit])

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center space-y-4 p-8">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<p className="text-muted-foreground">Loading users...</p>
			</div>
		)
	}

	if (error) {
		return (
			<div className="rounded-md bg-red-50 p-4">
				<div className="flex">
					<div className="flex-shrink-0">
						<AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
					</div>
					<div className="ml-3">
						<h3 className="text-sm font-medium text-red-800">
							Error loading users
						</h3>
						<div className="mt-2 text-sm text-red-700">
							<p>{error.message}</p>
						</div>
						<div className="mt-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() => window.location.reload()}
								className="border-red-300 text-red-700 hover:bg-red-50"
							>
								Retry
							</Button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Users Table */}
			<div className="overflow-hidden rounded-lg bg-card">
				{/* Search and Filters - Moved inside the card but above the table */}
				<div className="border-b p-4">
					<div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
						<div className="relative max-w-md flex-1">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<Search className="h-4 w-4 text-muted-foreground" />
							</div>
							<Input
								placeholder="Search users by name or email..."
								value={searchQuery}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setSearchQuery(e.target.value)
								}
								className="w-full pl-9"
							/>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Select
								value={roleFilter}
								onValueChange={(value) => setRoleFilter(value as Role | "all")}
							>
								<SelectTrigger className="w-[160px]">
									<Shield className="mr-2 h-4 w-4 text-muted-foreground" />
									<SelectValue placeholder="All Roles" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Roles</SelectItem>
									{Object.values(Role).map((role) => (
										<SelectItem key={role} value={role}>
											<div className="flex items-center">
												<span className="capitalize">
													{role.toLowerCase().replace("_", " ")}
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={statusFilter}
								onValueChange={(value) =>
									setStatusFilter(value as "all" | "active" | "suspended")
								}
							>
								<SelectTrigger className="w-[140px]">
									<div
										className={cn(
											"mr-2 h-2 w-2 rounded-full",
											statusFilter === "all"
												? "bg-gray-400"
												: statusFilter === "active"
													? "bg-green-500"
													: "bg-red-500"
										)}
									/>
									<SelectValue placeholder="All Statuses" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Statuses</SelectItem>
									<SelectItem value="active" className="flex items-center">
										<span className="mr-2 h-2 w-2 rounded-full bg-green-500" />
										Active
									</SelectItem>
									<SelectItem value="suspended" className="flex items-center">
										<span className="mr-2 h-2 w-2 rounded-full bg-red-500" />
										Suspended
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
				<Table>
					<TableHeader className="bg-muted/50">
						<TableRow className="hover:bg-transparent">
							<TableHead className="w-[300px]">
								<Button
									variant="ghost"
									onClick={() => requestSort("name")}
									className="p-0 font-semibold hover:bg-transparent"
								>
									User
									<ArrowUpDown className="ml-2 h-4 w-4" />
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									onClick={() => requestSort("email")}
									className="p-0 font-semibold hover:bg-transparent"
								>
									Email
									<ArrowUpDown className="ml-2 h-4 w-4" />
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									onClick={() => requestSort("role")}
									className="p-0 font-semibold hover:bg-transparent"
								>
									Role
									<ArrowUpDown className="ml-2 h-4 w-4" />
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									onClick={() => requestSort("status")}
									className="p-0 font-semibold hover:bg-transparent"
								>
									Status
									<ArrowUpDown className="ml-2 h-4 w-4" />
								</Button>
							</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data?.data.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="h-24 text-center">
									<div className="flex flex-col items-center justify-center py-8">
										<User className="mb-2 h-10 w-10 text-muted-foreground" />
										<p className="text-muted-foreground">No users found</p>
										<p className="text-sm text-muted-foreground">
											Try adjusting your search or filter criteria
										</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							data?.data.map((user) => (
								<TableRow
									key={user.id}
									className="transition-colors hover:bg-muted/50"
									onClick={() => handleRowClick(user)}
								>
									<TableCell className="font-medium">
										<div className="flex items-center space-x-3">
											<Avatar className="h-9 w-9 border border-border bg-muted/20">
												{user?.image ? (
													<AvatarImage
														src={user.image}
														alt={user?.name ?? "User"}
													/>
												) : null}
												<AvatarFallback className="bg-muted/40 text-foreground">
													{user?.name
														? user.name
																.split(" ")
																.slice(0, 2)
																.map((n) => n[0])
																.join("")
																.toUpperCase()
														: "U"}
												</AvatarFallback>
											</Avatar>
											<div className="flex flex-col">
												<span className="font-medium">
													{user?.name ?? "N/A"}
												</span>
												{user?.phone && (
													<span className="flex items-center text-xs text-muted-foreground">
														<Phone className="mr-1 h-3 w-3" /> {user.phone}
													</span>
												)}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex items-center text-sm">
											<Mail className="mr-2 h-4 w-4 text-muted-foreground" />
											<span
												className="max-w-[200px] truncate"
												title={user?.email ?? undefined}
											>
												{user?.email ?? "N/A"}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant="outline"
											className={cn(
												"text-xs font-normal",
												user?.role === "ADMIN"
													? "border-purple-200 bg-purple-50 text-purple-700"
													: user?.role === "CLIENT"
														? "border-blue-200 bg-blue-50 text-blue-700"
														: "border-gray-200 bg-gray-50 text-gray-700"
											)}
										>
											{user?.role
												? user.role.replace("_", " ").toLowerCase()
												: "N/A"}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex items-center">
											<div
												className={cn(
													"mr-2 h-2 w-2 rounded-full",
													user?.suspendedAt ? "bg-red-500" : "bg-green-500"
												)}
											/>
											<span
												className={cn(
													"text-sm",
													user?.suspendedAt ? "text-red-700" : "text-green-700"
												)}
											>
												{user?.suspendedAt ? "Suspended" : "Active"}
											</span>
										</div>
									</TableCell>
									<TableCell className="text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													className="h-8 w-8 p-0"
													onClick={(e) => e.stopPropagation()}
												>
													<span className="sr-only">Open menu</span>
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => setSelectedUser(user)}>
													View Profile
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={(e) => handleEditClick(user, e)}
												>
													Edit User
												</DropdownMenuItem>
												{user?.suspendedAt ? (
													<DropdownMenuItem className="text-green-600">
														Activate user
													</DropdownMenuItem>
												) : (
													<DropdownMenuItem className="text-red-600">
														Suspend user
													</DropdownMenuItem>
												)}
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			<div className="flex flex-col items-center justify-between space-y-4 px-2 py-4 sm:flex-row sm:space-y-0">
				<div className="text-sm text-muted-foreground">
					Showing <span className="font-medium">{(page - 1) * limit + 1}</span>{" "}
					to{" "}
					<span className="font-medium">
						{Math.min(page * limit, data?.pagination?.total ?? 0)}
					</span>{" "}
					of <span className="font-medium">{data?.pagination?.total ?? 0}</span>{" "}
					users
				</div>

				<div className="flex items-center space-x-2">
					<div className="flex items-center space-x-1">
						<span className="text-sm text-muted-foreground">
							Rows per page:
						</span>
						<Select
							value={limit.toString()}
							onValueChange={(value) => {
								setLimit(parseInt(value, 10))
							}}
						>
							<SelectTrigger className="h-8 w-[70px]">
								<SelectValue placeholder={limit} />
							</SelectTrigger>
							<SelectContent>
								{[5, 10, 20, 50, 100].map((size) => (
									<SelectItem key={size} value={size.toString()}>
										{size}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex items-center space-x-1 text-sm text-muted-foreground">
						<span>Page</span>
						<span className="font-medium">{page}</span>
						<span>of</span>
						<span className="font-medium">
							{data?.pagination?.totalPages ?? 1}
						</span>
					</div>

					<div className="flex space-x-1">
						<Button
							variant="outline"
							size="icon"
							onClick={handlePreviousPage}
							disabled={page === 1}
							className="h-8 w-8"
						>
							<ChevronLeft className="h-4 w-4" />
							<span className="sr-only">Previous page</span>
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={handleNextPage}
							disabled={
								!data?.pagination || page >= (data.pagination.totalPages ?? 0)
							}
							className="h-8 w-8"
						>
							<ChevronRight className="h-4 w-4" />
							<span className="sr-only">Next page</span>
						</Button>
					</div>
				</div>
			</div>

			{/* User View Slide-in */}
			<UserView
				isOpen={!!selectedUser}
				onClose={() => setSelectedUser(null)}
				user={selectedUser}
				onEditClick={handleEditClick}
			/>

			{/* Edit User Dialog */}
			<UserEdit
				user={userToEdit}
				isOpen={isEditOpen}
				onClose={() => {
					setIsEditOpen(false)
					setUserToEdit(null)
				}}
				onSuccess={() => {
					setIsEditOpen(false)
					setUserToEdit(null)
					// Refresh the user list
					// Invalidate the query to refresh the user list
					void utils.userManagement2.getAll.invalidate()
				}}
			/>
		</div>
	)
}

export default UserTable
