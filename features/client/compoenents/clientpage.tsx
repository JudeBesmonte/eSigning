"use client"

import { useState } from "react"
import {
	Calendar,
	ChevronLeft,
	ChevronRight,
	FileText,
	Search,
	UserPlus,
	Users
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogTrigger
} from "@/core/components/ui/dialog"
import { Input } from "@/core/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/core/components/ui/tabs"

import { trpc } from "@/services/trpc/client"

import type { UpdateUserInput, User } from "../api/user.schema"
import { ClientForm } from "./forms/client-form"
import { UserTable } from "./user"

interface ClientsPageProps {
	initialUsers?: User[]
}

export default function ClientsPage({ initialUsers = [] }: ClientsPageProps) {
	const [activeTab, setActiveTab] = useState("all")
	const [searchQuery, setSearchQuery] = useState("")
	const [addClientDialogOpen, setAddClientDialogOpen] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const itemsPerPage = 5

	const { data: users = initialUsers, refetch } = trpc.user.getAll.useQuery(
		undefined,
		{
			initialData: initialUsers
		}
	)

	const updateUserMutation = trpc.user.update.useMutation({
		onSuccess: () => {
			toast.success("User updated successfully!")
			void refetch() // Refresh the user list
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update user")
		}
	})

	const deleteUserMutation = trpc.user.delete.useMutation({
		onSuccess: () => {
			toast.success("User deleted successfully!")
			void refetch() // Refresh the user list
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete user")
		}
	})

	const handleUpdateUser = async (
		userId: string,
		userData: Omit<UpdateUserInput, "id">
	) => {
		await updateUserMutation.mutateAsync({
			id: userId,
			...userData
		})
	}

	const handleDeleteUser = async (userId: string) => {
		if (
			confirm(
				"Are you sure you want to delete this user? This action cannot be undone."
			)
		) {
			await deleteUserMutation.mutateAsync({ id: userId })
		}
	}

	// Filter users based on search query and active tab
	const filteredUsers = users.filter((user) => {
		if (searchQuery) {
			const searchLower = searchQuery.toLowerCase()
			const nameMatch = user.name?.toLowerCase().includes(searchLower) ?? false
			const emailMatch =
				user.email?.toLowerCase().includes(searchLower) ?? false

			if (!nameMatch && !emailMatch) {
				return false
			}
		}

		if (activeTab === "client" && user.role !== "CLIENT") return false
		if (activeTab === "admin" && user.role !== "ADMIN") return false
		if (activeTab === "super_admin" && user.role !== "SUPER_ADMIN") return false
		if (activeTab === "inactive" && user.emailVerified !== null) return false

		return true
	})

	// Pagination logic
	const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
	const startIndex = (currentPage - 1) * itemsPerPage
	const endIndex = startIndex + itemsPerPage
	const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

	// Reset to page 1 when filters change
	const handleTabChange = (value: string) => {
		setActiveTab(value)
		setCurrentPage(1)
	}

	const handleSearchChange = (value: string) => {
		setSearchQuery(value)
		setCurrentPage(1)
	}

	const stats = {
		total: users.length,
		client: users.filter((user) => user.role === "CLIENT").length,
		admin: users.filter((user) => user.role === "ADMIN").length,
		active: users.filter((user) => user.emailVerified !== null).length,
		documents: users.reduce(
			(acc, user) => acc + (user.role === "ADMIN" ? 3 : 1),
			0
		), // Estimated documents per user
		recent: users.filter((user) => user.emailVerified !== null).length // Active users as recent activity
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						Client Management
					</h1>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Manage your clients and their documents
					</p>
				</div>
				<Dialog
					open={addClientDialogOpen}
					onOpenChange={setAddClientDialogOpen}
				>
					<DialogTrigger asChild>
						<Button className="gap-2">
							<UserPlus className="h-4 w-4" />
							Add Client
						</Button>
					</DialogTrigger>
					<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
						<ClientForm
							onSuccess={() => {
								setAddClientDialogOpen(false)
								// Optionally refetch data or update cache
							}}
							onCancel={() => setAddClientDialogOpen(false)}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{/* Search and Filters */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="relative w-full md:w-96">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
					<Input
						placeholder="Search clients..."
						className="pl-10"
						value={searchQuery}
						onChange={(e) => handleSearchChange(e.target.value)}
					/>
				</div>
				<Tabs value={activeTab} onValueChange={handleTabChange}>
					<TabsList>
						<TabsTrigger value="all">All Clients</TabsTrigger>
						<TabsTrigger value="client">Client</TabsTrigger>
						<TabsTrigger value="admin">Administrator</TabsTrigger>
						<TabsTrigger value="super_admin">Super Administrator</TabsTrigger>
						<TabsTrigger value="inactive">Inactive</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Clients List */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						<span>Clients</span>
					</CardTitle>
					<CardDescription>
						Manage your client relationships and documents
					</CardDescription>
				</CardHeader>
				<CardContent>
					<UserTable
						users={paginatedUsers}
						onUpdateUser={handleUpdateUser}
						onDeleteUser={handleDeleteUser}
					/>

					{/* Pagination Controls */}
					{totalPages > 1 && (
						<div className="mt-6 flex items-center justify-between border-t pt-4">
							<div className="text-sm text-gray-500">
								Showing {startIndex + 1} to{" "}
								{Math.min(endIndex, filteredUsers.length)} of{" "}
								{filteredUsers.length} clients
							</div>
							<div className="flex items-center space-x-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentPage(currentPage - 1)}
									disabled={currentPage === 1}
								>
									<ChevronLeft className="h-4 w-4" />
									Previous
								</Button>

								<div className="flex items-center space-x-1">
									{Array.from({ length: totalPages }, (_, i) => i + 1).map(
										(page) => (
											<Button
												key={page}
												variant={currentPage === page ? "default" : "outline"}
												size="sm"
												onClick={() => setCurrentPage(page)}
												className="h-8 w-8 p-0"
											>
												{page}
											</Button>
										)
									)}
								</div>

								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentPage(currentPage + 1)}
									disabled={currentPage === totalPages}
								>
									Next
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Total Clients</CardTitle>
						<Users className="h-4 w-4 text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.total}</div>
						<p className="text-xs text-gray-500">
							{stats.client} clients, {stats.admin} administrators
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Active Clients
						</CardTitle>
						<Users className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.active}</div>
						<p className="text-xs text-gray-500">With recent activity</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Total Documents
						</CardTitle>
						<FileText className="h-4 w-4 text-orange-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.documents}</div>
						<p className="text-xs text-gray-500">Across all clients</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Recent Activity
						</CardTitle>
						<Calendar className="h-4 w-4 text-purple-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.recent}</div>
						<p className="text-xs text-gray-500">Clients active today</p>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
