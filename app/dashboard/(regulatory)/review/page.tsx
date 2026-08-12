"use client"

import { useState } from "react"
import {
	Calendar,
	CheckCircle,
	Clock,
	Download,
	Eye,
	FileText,
	MessageSquare,
	Search,
	Share2,
	Star,
	ThumbsDown,
	ThumbsUp,
	User,
	XCircle
} from "lucide-react"

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
import { Input } from "@/core/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"
import { Textarea } from "@/core/components/ui/textarea"

interface ReviewItem {
	id: string
	title: string
	type: "document" | "template" | "workflow" | "user"
	status: "pending" | "approved" | "rejected" | "in-review"
	priority: "low" | "medium" | "high" | "critical"
	submittedBy: {
		name: string
		email: string
		avatar?: string
	}
	submittedAt: string
	reviewedBy?: {
		name: string
		email: string
	}
	reviewedAt?: string
	description: string
	comments: number
	rating?: number
}

const mockReviewItems: ReviewItem[] = [
	{
		id: "1",
		title: "Corporate Merger Agreement Template",
		type: "template",
		status: "pending",
		priority: "high",
		submittedBy: {
			name: "Sarah Johnson",
			email: "sarah.johnson@company.com",
			avatar: "/placeholder.svg?height=32&width=32"
		},
		submittedAt: "2024-01-15T10:30:00Z",
		description:
			"New template for corporate merger agreements with enhanced compliance features",
		comments: 3,
		rating: 4.5
	},
	{
		id: "2",
		title: "Real Estate Purchase Contract - Smith Property",
		type: "document",
		status: "in-review",
		priority: "medium",
		submittedBy: {
			name: "Michael Chen",
			email: "michael.chen@realty.com",
			avatar: "/placeholder.svg?height=32&width=32"
		},
		submittedAt: "2024-01-14T14:20:00Z",
		reviewedBy: {
			name: "Jennifer Davis",
			email: "jennifer.davis@company.com"
		},
		description:
			"Real estate purchase contract requiring legal review before notarization",
		comments: 7,
		rating: 4.2
	},
	{
		id: "3",
		title: "Automated Workflow - Document Approval Process",
		type: "workflow",
		status: "approved",
		priority: "low",
		submittedBy: {
			name: "David Wilson",
			email: "david.wilson@company.com",
			avatar: "/placeholder.svg?height=32&width=32"
		},
		submittedAt: "2024-01-13T09:15:00Z",
		reviewedBy: {
			name: "Lisa Anderson",
			email: "lisa.anderson@company.com"
		},
		reviewedAt: "2024-01-14T11:30:00Z",
		description:
			"Streamlined workflow for document approval with automated notifications",
		comments: 2,
		rating: 5.0
	},
	{
		id: "4",
		title: "New Notary Public Application - Emma Rodriguez",
		type: "user",
		status: "rejected",
		priority: "medium",
		submittedBy: {
			name: "Emma Rodriguez",
			email: "emma.rodriguez@email.com",
			avatar: "/placeholder.svg?height=32&width=32"
		},
		submittedAt: "2024-01-12T16:45:00Z",
		reviewedBy: {
			name: "Robert Taylor",
			email: "robert.taylor@company.com"
		},
		reviewedAt: "2024-01-13T10:20:00Z",
		description:
			"Application for notary public certification - missing required documentation",
		comments: 5,
		rating: 2.5
	}
]

const getStatusColor = (status: string) => {
	switch (status) {
		case "pending":
			return "bg-yellow-100 text-yellow-800 border-yellow-200"
		case "approved":
			return "bg-green-100 text-green-800 border-green-200"
		case "rejected":
			return "bg-red-100 text-red-800 border-red-200"
		case "in-review":
			return "bg-blue-100 text-blue-800 border-blue-200"
		default:
			return "bg-gray-100 text-gray-800 border-gray-200"
	}
}

const getPriorityColor = (priority: string) => {
	switch (priority) {
		case "critical":
			return "bg-red-500"
		case "high":
			return "bg-orange-500"
		case "medium":
			return "bg-yellow-500"
		case "low":
			return "bg-green-500"
		default:
			return "bg-gray-500"
	}
}

const getTypeIcon = (type: string) => {
	switch (type) {
		case "document":
			return <FileText className="h-4 w-4" />
		case "template":
			return <FileText className="h-4 w-4" />
		case "workflow":
			return <MessageSquare className="h-4 w-4" />
		case "user":
			return <User className="h-4 w-4" />
		default:
			return <FileText className="h-4 w-4" />
	}
}

export default function ReviewPage() {
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState("all")
	const [typeFilter, setTypeFilter] = useState("all")
	const [priorityFilter, setPriorityFilter] = useState("all")
	const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null)

	const filteredItems = mockReviewItems.filter((item) => {
		const matchesSearch =
			item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.description.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesStatus = statusFilter === "all" || item.status === statusFilter
		const matchesType = typeFilter === "all" || item.type === typeFilter
		const matchesPriority =
			priorityFilter === "all" || item.priority === priorityFilter

		return matchesSearch && matchesStatus && matchesType && matchesPriority
	})

	const stats = {
		total: mockReviewItems.length,
		pending: mockReviewItems.filter((item) => item.status === "pending").length,
		inReview: mockReviewItems.filter((item) => item.status === "in-review")
			.length,
		approved: mockReviewItems.filter((item) => item.status === "approved")
			.length,
		rejected: mockReviewItems.filter((item) => item.status === "rejected")
			.length
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Review Center</h1>
					<p className="text-muted-foreground">
						Review and approve documents, templates, workflows, and user
						applications
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline">
						<Download className="mr-2 h-4 w-4" />
						Export Report
					</Button>
					<Button>
						<Eye className="mr-2 h-4 w-4" />
						Bulk Review
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-5">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Total Items
								</p>
								<p className="text-2xl font-bold">{stats.total}</p>
							</div>
							<FileText className="h-8 w-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Pending
								</p>
								<p className="text-2xl font-bold text-yellow-600">
									{stats.pending}
								</p>
							</div>
							<Clock className="h-8 w-8 text-yellow-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									In Review
								</p>
								<p className="text-2xl font-bold text-blue-600">
									{stats.inReview}
								</p>
							</div>
							<Eye className="h-8 w-8 text-blue-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Approved
								</p>
								<p className="text-2xl font-bold text-green-600">
									{stats.approved}
								</p>
							</div>
							<CheckCircle className="h-8 w-8 text-green-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Rejected
								</p>
								<p className="text-2xl font-bold text-red-600">
									{stats.rejected}
								</p>
							</div>
							<XCircle className="h-8 w-8 text-red-600" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-col gap-4 sm:flex-row">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
								<Input
									placeholder="Search reviews..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-full sm:w-[180px]">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="in-review">In Review</SelectItem>
								<SelectItem value="approved">Approved</SelectItem>
								<SelectItem value="rejected">Rejected</SelectItem>
							</SelectContent>
						</Select>
						<Select value={typeFilter} onValueChange={setTypeFilter}>
							<SelectTrigger className="w-full sm:w-[180px]">
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Types</SelectItem>
								<SelectItem value="document">Documents</SelectItem>
								<SelectItem value="template">Templates</SelectItem>
								<SelectItem value="workflow">Workflows</SelectItem>
								<SelectItem value="user">Users</SelectItem>
							</SelectContent>
						</Select>
						<Select value={priorityFilter} onValueChange={setPriorityFilter}>
							<SelectTrigger className="w-full sm:w-[180px]">
								<SelectValue placeholder="Priority" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Priority</SelectItem>
								<SelectItem value="critical">Critical</SelectItem>
								<SelectItem value="high">High</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="low">Low</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Review Items */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<div className="space-y-4">
					<h2 className="text-xl font-semibold">
						Review Queue ({filteredItems.length})
					</h2>
					{filteredItems.map((item) => (
						<Card
							key={item.id}
							className={`cursor-pointer transition-all hover:shadow-md ${
								selectedItem?.id === item.id ? "ring-2 ring-primary" : ""
							}`}
							onClick={() => setSelectedItem(item)}
						>
							<CardContent className="p-4">
								<div className="space-y-3">
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-2">
											{getTypeIcon(item.type)}
											<h3 className="text-sm font-semibold">{item.title}</h3>
										</div>
										<div className="flex items-center gap-2">
											<div
												className={`h-2 w-2 rounded-full ${getPriorityColor(item.priority)}`}
											/>
											<Badge
												variant="outline"
												className={getStatusColor(item.status)}
											>
												{item.status.replace("-", " ")}
											</Badge>
										</div>
									</div>

									<p className="line-clamp-2 text-sm text-muted-foreground">
										{item.description}
									</p>

									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<div className="flex items-center gap-4">
											<div className="flex items-center gap-1">
												<Avatar className="h-4 w-4">
													<AvatarImage
														src={item.submittedBy.avatar ?? "/placeholder.svg"}
													/>
													<AvatarFallback>
														{item.submittedBy.name
															.split(" ")
															.map((n) => n[0])
															.join("")}
													</AvatarFallback>
												</Avatar>
												<span>{item.submittedBy.name}</span>
											</div>
											<div className="flex items-center gap-1">
												<Calendar className="h-3 w-3" />
												<span>
													{new Date(item.submittedAt).toLocaleDateString()}
												</span>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<div className="flex items-center gap-1">
												<MessageSquare className="h-3 w-3" />
												<span>{item.comments}</span>
											</div>
											{item.rating && (
												<div className="flex items-center gap-1">
													<Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
													<span>{item.rating}</span>
												</div>
											)}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Review Details */}
				<div className="space-y-4">
					<h2 className="text-xl font-semibold">Review Details</h2>
					{selectedItem ? (
						<Card>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div>
										<CardTitle className="flex items-center gap-2">
											{getTypeIcon(selectedItem.type)}
											{selectedItem.title}
										</CardTitle>
										<CardDescription>
											Submitted by {selectedItem.submittedBy.name} on{" "}
											{new Date(selectedItem.submittedAt).toLocaleDateString()}
										</CardDescription>
									</div>
									<div className="flex items-center gap-2">
										<div
											className={`h-3 w-3 rounded-full ${getPriorityColor(selectedItem.priority)}`}
										/>
										<Badge
											variant="outline"
											className={getStatusColor(selectedItem.status)}
										>
											{selectedItem.status.replace("-", " ")}
										</Badge>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-6">
								<div>
									<h4 className="mb-2 font-semibold">Description</h4>
									<p className="text-sm text-muted-foreground">
										{selectedItem.description}
									</p>
								</div>

								{selectedItem.reviewedBy && (
									<div>
										<h4 className="mb-2 font-semibold">Review Information</h4>
										<div className="space-y-2 text-sm">
											<div className="flex justify-between">
												<span className="text-muted-foreground">
													Reviewed by:
												</span>
												<span>{selectedItem.reviewedBy.name}</span>
											</div>
											{selectedItem.reviewedAt && (
												<div className="flex justify-between">
													<span className="text-muted-foreground">
														Reviewed on:
													</span>
													<span>
														{new Date(
															selectedItem.reviewedAt
														).toLocaleDateString()}
													</span>
												</div>
											)}
										</div>
									</div>
								)}

								<div>
									<h4 className="mb-2 font-semibold">Review Actions</h4>
									<div className="space-y-3">
										<Textarea
											placeholder="Add review comments..."
											className="min-h-[100px]"
										/>
										<div className="flex gap-2">
											<Button className="flex-1" variant="outline">
												<ThumbsUp className="mr-2 h-4 w-4" />
												Approve
											</Button>
											<Button className="flex-1" variant="outline">
												<ThumbsDown className="mr-2 h-4 w-4" />
												Reject
											</Button>
											<Button variant="outline">
												<Share2 className="mr-2 h-4 w-4" />
												Forward
											</Button>
										</div>
									</div>
								</div>

								<div>
									<h4 className="mb-2 font-semibold">Activity Timeline</h4>
									<div className="space-y-3">
										<div className="flex items-start gap-3">
											<div className="mt-2 h-2 w-2 rounded-full bg-blue-500" />
											<div className="flex-1">
												<p className="text-sm font-medium">
													Item submitted for review
												</p>
												<p className="text-xs text-muted-foreground">
													{new Date(selectedItem.submittedAt).toLocaleString()}
												</p>
											</div>
										</div>
										{selectedItem.reviewedAt && (
											<div className="flex items-start gap-3">
												<div className="mt-2 h-2 w-2 rounded-full bg-green-500" />
												<div className="flex-1">
													<p className="text-sm font-medium">
														Review completed
													</p>
													<p className="text-xs text-muted-foreground">
														{new Date(selectedItem.reviewedAt).toLocaleString()}
													</p>
												</div>
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardContent className="p-8 text-center">
								<Eye className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
								<h3 className="mb-2 text-lg font-semibold">
									Select an item to review
								</h3>
								<p className="text-muted-foreground">
									Choose an item from the review queue to see details and take
									action
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	)
}
