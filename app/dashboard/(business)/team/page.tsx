"use client"

import { useState } from "react"
import {
	Mail,
	MoreHorizontal,
	Search,
	Settings,
	Shield,
	UserCheck,
	UserPlus,
	Users
} from "lucide-react"
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/core/components/ui/dialog"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/core/components/ui/tabs"

export default function TeamPage() {
	const [activeTab, setActiveTab] = useState("all")
	const [searchQuery, setSearchQuery] = useState("")
	const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

	// Mock team data
	const teamMembers = [
		{
			id: "1",
			name: "John Smith",
			email: "john.smith@example.com",
			role: "Admin",
			status: "active",
			avatar: "/placeholder.svg",
			department: "Legal",
			joinedDate: "2023-01-15",
			documentsProcessed: 145,
			lastActive: "2 hours ago"
		},
		{
			id: "2",
			name: "Sarah Johnson",
			email: "sarah.johnson@example.com",
			role: "Notary",
			status: "active",
			avatar: "/placeholder.svg",
			department: "Notary Services",
			joinedDate: "2023-02-20",
			documentsProcessed: 98,
			lastActive: "5 minutes ago"
		},
		{
			id: "3",
			name: "Michael Chen",
			email: "michael.chen@example.com",
			role: "Document Manager",
			status: "active",
			avatar: "/placeholder.svg",
			department: "Operations",
			joinedDate: "2023-03-10",
			documentsProcessed: 76,
			lastActive: "1 day ago"
		},
		{
			id: "4",
			name: "Emily Davis",
			email: "emily.davis@example.com",
			role: "Viewer",
			status: "pending",
			avatar: "/placeholder.svg",
			department: "Finance",
			joinedDate: "2023-04-05",
			documentsProcessed: 0,
			lastActive: "Never"
		},
		{
			id: "5",
			name: "Robert Wilson",
			email: "robert.wilson@example.com",
			role: "Document Manager",
			status: "active",
			avatar: "/placeholder.svg",
			department: "Legal",
			joinedDate: "2023-02-28",
			documentsProcessed: 112,
			lastActive: "3 hours ago"
		}
	]

	const handleInvite = (formData: FormData) => {
		const email = formData.get("email") as string
		const role = formData.get("role") as string

		toast.success("Invitation Sent", {
			description: `An invitation has been sent to ${email} for the ${role} role.`
		})

		setInviteDialogOpen(false)
	}

	const filteredMembers = teamMembers.filter((member) => {
		// Filter by search query
		if (
			searchQuery &&
			!member.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
			!member.email.toLowerCase().includes(searchQuery.toLowerCase())
		) {
			return false
		}

		// Filter by tab
		if (activeTab === "pending" && member.status !== "pending") return false
		if (activeTab === "active" && member.status !== "active") return false

		return true
	})

	const getRoleColor = (role: string) => {
		switch (role) {
			case "Admin":
				return "bg-purple-100 text-purple-800"
			case "Notary":
				return "bg-blue-100 text-blue-800"
			case "Document Manager":
				return "bg-green-100 text-green-800"
			case "Viewer":
				return "bg-gray-100 text-gray-800"
			default:
				return "bg-gray-100 text-gray-800"
		}
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-100 text-green-800"
			case "pending":
				return "bg-orange-100 text-orange-800"
			default:
				return "bg-gray-100 text-gray-800"
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
						Team Management
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Manage your team members and their permissions
					</p>
				</div>
				<Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<UserPlus className="mr-2 h-4 w-4" />
							Invite Team Member
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Invite Team Member</DialogTitle>
							<DialogDescription>
								Send an invitation to join your team. They will receive an email
								with instructions.
							</DialogDescription>
						</DialogHeader>
						<form action={handleInvite} className="space-y-4 pt-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email Address</Label>
								<Input
									id="email"
									name="email"
									type="email"
									placeholder="colleague@example.com"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="role">Role</Label>
								<Select name="role" defaultValue="Viewer">
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Admin">Admin</SelectItem>
										<SelectItem value="Notary">Notary</SelectItem>
										<SelectItem value="Document Manager">
											Document Manager
										</SelectItem>
										<SelectItem value="Viewer">Viewer</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="message">Personal Message (Optional)</Label>
								<Input
									id="message"
									name="message"
									placeholder="Add a personal message to the invitation"
								/>
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setInviteDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button type="submit">Send Invitation</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{/* Search and Filters */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="relative w-full md:w-96">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
					<Input
						placeholder="Search team members..."
						className="pl-8"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="w-full md:w-auto"
				>
					<TabsList>
						<TabsTrigger value="all">All Members</TabsTrigger>
						<TabsTrigger value="active">Active</TabsTrigger>
						<TabsTrigger value="pending">Pending</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Team Members List */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Users className="h-5 w-5" />
						<span>Team Members</span>
					</CardTitle>
					<CardDescription>
						Manage your team and their access levels
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{filteredMembers.length === 0 ? (
							<div className="py-8 text-center">
								<p className="text-gray-500">No team members found</p>
							</div>
						) : (
							filteredMembers.map((member) => (
								<div
									key={member.id}
									className="flex flex-col justify-between rounded-lg border p-4 md:flex-row md:items-center"
								>
									<div className="flex items-center space-x-4">
										<Avatar className="h-10 w-10">
											<AvatarImage src={member.avatar || "/placeholder.svg"} />
											<AvatarFallback>
												{member.name
													.split(" ")
													.map((n) => n[0])
													.join("")}
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="font-medium">{member.name}</p>
											<div className="flex items-center space-x-2 text-sm text-gray-500">
												<span>{member.email}</span>
												<span>•</span>
												<span>{member.department}</span>
											</div>
										</div>
									</div>
									<div className="mt-4 flex items-center space-x-4 md:mt-0">
										<Badge className={getRoleColor(member.role)}>
											{member.role}
										</Badge>
										<Badge className={getStatusColor(member.status)}>
											{member.status}
										</Badge>
										<div className="flex items-center space-x-2">
											<Button variant="ghost" size="icon">
												<Mail className="h-4 w-4" />
											</Button>
											<Button variant="ghost" size="icon">
												<Settings className="h-4 w-4" />
											</Button>
											<Button variant="ghost" size="icon">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</CardContent>
			</Card>

			{/* Team Stats */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Members</CardTitle>
						<Users className="h-4 w-4 text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{teamMembers.length}</div>
						<p className="text-xs text-gray-500">Across 4 departments</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Members
						</CardTitle>
						<UserCheck className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{teamMembers.filter((m) => m.status === "active").length}
						</div>
						<p className="text-xs text-gray-500">Last active today</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Pending Invitations
						</CardTitle>
						<Mail className="h-4 w-4 text-orange-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{teamMembers.filter((m) => m.status === "pending").length}
						</div>
						<p className="text-xs text-gray-500">Awaiting response</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Admin Users</CardTitle>
						<Shield className="h-4 w-4 text-purple-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{teamMembers.filter((m) => m.role === "Admin").length}
						</div>
						<p className="text-xs text-gray-500">With full permissions</p>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
