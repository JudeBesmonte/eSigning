"use client"

import { useState } from "react"
import {
	CheckCircle,
	Clock,
	Copy,
	Edit,
	Eye,
	FileText,
	History,
	Plus,
	Search,
	Star,
	Upload
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { Textarea } from "@/core/components/ui/textarea"

interface Template {
	id: string
	name: string
	description: string
	category: string
	type: "legal" | "business" | "personal" | "government"
	status: "active" | "draft" | "archived" | "pending-review"
	createdBy: {
		name: string
		email: string
		avatar?: string
	}
	createdAt: string
	lastModified: string
	usageCount: number
	rating: number
	tags: string[]
	version: string
	size: string
	fields: number
}

const mockTemplates: Template[] = [
	{
		id: "1",
		name: "Real Estate Purchase Agreement",
		description:
			"Comprehensive template for residential real estate transactions with all required disclosures",
		category: "Real Estate",
		type: "legal",
		status: "active",
		createdBy: {
			name: "Sarah Johnson",
			email: "sarah.johnson@company.com",
			avatar: "/placeholder.svg?height=32&width=32"
		},
		createdAt: "2024-01-10T10:30:00Z",
		lastModified: "2024-01-14T15:20:00Z",
		usageCount: 247,
		rating: 4.8,
		tags: ["real-estate", "purchase", "residential"],
		version: "2.1",
		size: "2.4 MB",
		fields: 45
	},
	{
		id: "2",
		name: "Corporate Merger Agreement",
		description:
			"Template for corporate merger and acquisition transactions with compliance features",
		category: "Corporate",
		type: "business",
		status: "pending-review",
		createdBy: {
			name: "Michael Chen",
			email: "michael.chen@company.com",
			avatar: "/placeholder.svg?height=32&width=32"
		},
		createdAt: "2024-01-12T14:20:00Z",
		lastModified: "2024-01-15T09:45:00Z",
		usageCount: 89,
		rating: 4.5,
		tags: ["corporate", "merger", "acquisition"],
		version: "1.3",
		size: "3.7 MB",
		fields: 78
	},
	{
		id: "3",
		name: "Power of Attorney - General",
		description:
			"General power of attorney template with customizable authority levels",
		category: "Legal Documents",
		type: "legal",
		status: "active",
		createdBy: {
			name: "Jennifer Davis",
			email: "jennifer.davis@company.com",
			avatar: "/placeholder.svg?height=32&width=32"
		},
		createdAt: "2024-01-08T11:15:00Z",
		lastModified: "2024-01-13T16:30:00Z",
		usageCount: 156,
		rating: 4.6,
		tags: ["power-of-attorney", "legal", "authorization"],
		version: "1.8",
		size: "1.2 MB",
		fields: 23
	},
	{
		id: "4",
		name: "Employment Contract Template",
		description:
			"Standard employment contract with customizable terms and conditions",
		category: "HR & Employment",
		type: "business",
		status: "draft",
		createdBy: {
			name: "David Wilson",
			email: "david.wilson@company.com",
			avatar: "/placeholder.svg?height=32&width=32"
		},
		createdAt: "2024-01-15T08:00:00Z",
		lastModified: "2024-01-15T12:45:00Z",
		usageCount: 34,
		rating: 4.2,
		tags: ["employment", "contract", "hr"],
		version: "0.9",
		size: "1.8 MB",
		fields: 32
	},
	{
		id: "5",
		name: "Last Will and Testament",
		description:
			"Comprehensive will template with asset distribution and executor provisions",
		category: "Estate Planning",
		type: "personal",
		status: "active",
		createdBy: {
			name: "Lisa Anderson",
			email: "lisa.anderson@company.com",
			avatar: "/placeholder.svg?height=32&width=32"
		},
		createdAt: "2024-01-05T13:20:00Z",
		lastModified: "2024-01-11T10:15:00Z",
		usageCount: 198,
		rating: 4.9,
		tags: ["will", "estate-planning", "inheritance"],
		version: "3.2",
		size: "2.1 MB",
		fields: 56
	},
	{
		id: "6",
		name: "Business Partnership Agreement",
		description:
			"Partnership agreement template with profit sharing and dissolution clauses",
		category: "Business Formation",
		type: "business",
		status: "archived",
		createdBy: {
			name: "Robert Taylor",
			email: "robert.taylor@company.com",
			avatar: "/placeholder.svg?height=32&width=32"
		},
		createdAt: "2023-12-20T09:30:00Z",
		lastModified: "2024-01-02T14:20:00Z",
		usageCount: 67,
		rating: 4.3,
		tags: ["partnership", "business", "agreement"],
		version: "2.0",
		size: "2.8 MB",
		fields: 41
	}
]

const getStatusColor = (status: string) => {
	switch (status) {
		case "active":
			return "bg-green-100 text-green-800 border-green-200"
		case "draft":
			return "bg-yellow-100 text-yellow-800 border-yellow-200"
		case "archived":
			return "bg-gray-100 text-gray-800 border-gray-200"
		case "pending-review":
			return "bg-blue-100 text-blue-800 border-blue-200"
		default:
			return "bg-gray-100 text-gray-800 border-gray-200"
	}
}

const getStatusIcon = (status: string) => {
	switch (status) {
		case "active":
			return <CheckCircle className="h-4 w-4" />
		case "draft":
			return <Edit className="h-4 w-4" />
		case "archived":
			return <History className="h-4 w-4" />
		case "pending-review":
			return <Clock className="h-4 w-4" />
		default:
			return <FileText className="h-4 w-4" />
	}
}

const getTypeColor = (type: string) => {
	switch (type) {
		case "legal":
			return "bg-purple-100 text-purple-800"
		case "business":
			return "bg-blue-100 text-blue-800"
		case "personal":
			return "bg-green-100 text-green-800"
		case "government":
			return "bg-red-100 text-red-800"
		default:
			return "bg-gray-100 text-gray-800"
	}
}

export default function TemplateManagementPage() {
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState("all")
	const [typeFilter, setTypeFilter] = useState("all")
	const [categoryFilter, setCategoryFilter] = useState("all")
	// const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
	// const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
	// 	null
	// )
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

	const filteredTemplates = mockTemplates.filter((template) => {
		const matchesSearch =
			template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			template.tags.some((tag) =>
				tag.toLowerCase().includes(searchTerm.toLowerCase())
			)
		const matchesStatus =
			statusFilter === "all" || template.status === statusFilter
		const matchesType = typeFilter === "all" || template.type === typeFilter
		const matchesCategory =
			categoryFilter === "all" || template.category === categoryFilter

		return matchesSearch && matchesStatus && matchesType && matchesCategory
	})

	const stats = {
		total: mockTemplates.length,
		active: mockTemplates.filter((t) => t.status === "active").length,
		draft: mockTemplates.filter((t) => t.status === "draft").length,
		archived: mockTemplates.filter((t) => t.status === "archived").length,
		totalUsage: mockTemplates.reduce((sum, t) => sum + t.usageCount, 0)
	}

	const categories = [...new Set(mockTemplates.map((t) => t.category))]

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Template Management
					</h1>
					<p className="text-muted-foreground">
						Create, manage, and organize document templates for efficient
						notarization
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline">
						<Upload className="mr-2 h-4 w-4" />
						Import Templates
					</Button>
					<Dialog
						open={isCreateDialogOpen}
						onOpenChange={setIsCreateDialogOpen}
					>
						<DialogTrigger asChild>
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Create Template
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl">
							<DialogHeader>
								<DialogTitle>Create New Template</DialogTitle>
								<DialogDescription>
									Create a new document template for notarization services
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="template-name">Template Name</Label>
										<Input
											id="template-name"
											placeholder="Enter template name"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="template-category">Category</Label>
										<Select>
											<SelectTrigger>
												<SelectValue placeholder="Select category" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="real-estate">Real Estate</SelectItem>
												<SelectItem value="corporate">Corporate</SelectItem>
												<SelectItem value="legal">Legal Documents</SelectItem>
												<SelectItem value="hr">HR & Employment</SelectItem>
												<SelectItem value="estate">Estate Planning</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="template-description">Description</Label>
									<Textarea
										id="template-description"
										placeholder="Describe the template purpose and usage"
										className="min-h-[100px]"
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="template-type">Type</Label>
										<Select>
											<SelectTrigger>
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="legal">Legal</SelectItem>
												<SelectItem value="business">Business</SelectItem>
												<SelectItem value="personal">Personal</SelectItem>
												<SelectItem value="government">Government</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="template-tags">Tags</Label>
										<Input
											id="template-tags"
											placeholder="Enter tags separated by commas"
										/>
									</div>
								</div>
								<div className="flex justify-end gap-2">
									<Button
										variant="outline"
										onClick={() => setIsCreateDialogOpen(false)}
									>
										Cancel
									</Button>
									<Button onClick={() => setIsCreateDialogOpen(false)}>
										Create Template
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-5">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Total Templates
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
									Active
								</p>
								<p className="text-2xl font-bold text-green-600">
									{stats.active}
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
									Drafts
								</p>
								<p className="text-2xl font-bold text-yellow-600">
									{stats.draft}
								</p>
							</div>
							<Edit className="h-8 w-8 text-yellow-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Archived
								</p>
								<p className="text-2xl font-bold text-gray-600">
									{stats.archived}
								</p>
							</div>
							<History className="h-8 w-8 text-gray-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Total Usage
								</p>
								<p className="text-2xl font-bold text-blue-600">
									{stats.totalUsage.toLocaleString()}
								</p>
							</div>
							<Eye className="h-8 w-8 text-blue-600" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Search */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-col gap-4 lg:flex-row">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
								<Input
									placeholder="Search templates..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<div className="flex flex-col gap-2 sm:flex-row">
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-full sm:w-[150px]">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="archived">Archived</SelectItem>
									<SelectItem value="pending-review">Pending Review</SelectItem>
								</SelectContent>
							</Select>
							<Select value={typeFilter} onValueChange={setTypeFilter}>
								<SelectTrigger className="w-full sm:w-[150px]">
									<SelectValue placeholder="Type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Types</SelectItem>
									<SelectItem value="legal">Legal</SelectItem>
									<SelectItem value="business">Business</SelectItem>
									<SelectItem value="personal">Personal</SelectItem>
									<SelectItem value="government">Government</SelectItem>
								</SelectContent>
							</Select>
							<Select value={categoryFilter} onValueChange={setCategoryFilter}>
								<SelectTrigger className="w-full sm:w-[180px]">
									<SelectValue placeholder="Category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Categories</SelectItem>
									{categories.map((category) => (
										<SelectItem key={category} value={category}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Templates Grid */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{filteredTemplates.map((template) => (
					<Card key={template.id} className="transition-shadow hover:shadow-lg">
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-2">
									{getStatusIcon(template.status)}
									<Badge
										variant="outline"
										className={getStatusColor(template.status)}
									>
										{template.status.replace("-", " ")}
									</Badge>
								</div>
								<Badge className={getTypeColor(template.type)}>
									{template.type}
								</Badge>
							</div>
							<CardTitle className="text-lg">{template.name}</CardTitle>
							<CardDescription className="line-clamp-2">
								{template.description}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Category:</span>
								<span className="font-medium">{template.category}</span>
							</div>

							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Usage:</span>
								<span className="font-medium">{template.usageCount} times</span>
							</div>

							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Rating:</span>
								<div className="flex items-center gap-1">
									<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
									<span className="font-medium">{template.rating}</span>
								</div>
							</div>

							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Version:</span>
								<span className="font-medium">v{template.version}</span>
							</div>

							<div className="flex flex-wrap gap-1">
								{template.tags.slice(0, 3).map((tag) => (
									<Badge key={tag} variant="secondary" className="text-xs">
										{tag}
									</Badge>
								))}
								{template.tags.length > 3 && (
									<Badge variant="secondary" className="text-xs">
										+{template.tags.length - 3}
									</Badge>
								)}
							</div>

							<div className="flex items-center gap-1 text-xs text-muted-foreground">
								<Avatar className="h-4 w-4">
									<AvatarImage
										src={template.createdBy.avatar ?? "/placeholder.svg"}
									/>
									<AvatarFallback>
										{template.createdBy.name
											.split(" ")
											.map((n) => n[0])
											.join("")}
									</AvatarFallback>
								</Avatar>
								<span>{template.createdBy.name}</span>
								<span>•</span>
								<span>{new Date(template.createdAt).toLocaleDateString()}</span>
							</div>

							<div className="flex gap-2">
								<Button size="sm" className="flex-1">
									<Eye className="mr-2 h-4 w-4" />
									Preview
								</Button>
								<Button size="sm" variant="outline">
									<Copy className="mr-2 h-4 w-4" />
									Clone
								</Button>
								<Button size="sm" variant="outline">
									<Edit className="mr-2 h-4 w-4" />
									Edit
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{filteredTemplates.length === 0 && (
				<Card>
					<CardContent className="p-8 text-center">
						<FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
						<h3 className="mb-2 text-lg font-semibold">No templates found</h3>
						<p className="mb-4 text-muted-foreground">
							No templates match your current filters. Try adjusting your search
							criteria.
						</p>
						<Button
							onClick={() => {
								setSearchTerm("")
								setStatusFilter("all")
								setTypeFilter("all")
								setCategoryFilter("all")
							}}
						>
							Clear Filters
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
