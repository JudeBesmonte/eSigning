"use client"

import Link from "next/link"
import { useState } from "react"
import {
	Building,
	Copy,
	Download,
	Eye,
	FileText,
	Filter,
	Plus,
	Scale,
	Search,
	Star,
	Users
} from "lucide-react"

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

export default function TemplatesPage() {
	const [searchTerm, setSearchTerm] = useState("")
	const [categoryFilter, setCategoryFilter] = useState("all")

	const templates = [
		{
			id: "1",
			name: "Employment Contract Template",
			description:
				"Comprehensive employment agreement with standard terms and conditions",
			category: "HR",
			industry: "General",
			uses: 156,
			rating: 4.8,
			lastUpdated: "2024-01-10",
			tags: ["employment", "contract", "hr"],
			featured: true,
			complexity: "Medium"
		},
		{
			id: "2",
			name: "Non-Disclosure Agreement (NDA)",
			description:
				"Standard NDA template for protecting confidential information",
			category: "Legal",
			industry: "Technology",
			uses: 234,
			rating: 4.9,
			lastUpdated: "2024-01-08",
			tags: ["nda", "confidentiality", "legal"],
			featured: true,
			complexity: "Simple"
		},
		{
			id: "3",
			name: "Service Agreement Template",
			description: "Professional services agreement for client engagements",
			category: "Business",
			industry: "Consulting",
			uses: 89,
			rating: 4.6,
			lastUpdated: "2024-01-12",
			tags: ["service", "agreement", "consulting"],
			featured: false,
			complexity: "Medium"
		},
		{
			id: "4",
			name: "Partnership Agreement",
			description:
				"Comprehensive partnership agreement for business collaborations",
			category: "Corporate",
			industry: "General",
			uses: 67,
			rating: 4.7,
			lastUpdated: "2024-01-05",
			tags: ["partnership", "business", "collaboration"],
			featured: false,
			complexity: "Complex"
		},
		{
			id: "5",
			name: "Lease Agreement Template",
			description: "Residential and commercial lease agreement template",
			category: "Real Estate",
			industry: "Property",
			uses: 123,
			rating: 4.5,
			lastUpdated: "2024-01-15",
			tags: ["lease", "rental", "property"],
			featured: false,
			complexity: "Medium"
		},
		{
			id: "6",
			name: "Software License Agreement",
			description: "End-user license agreement for software products",
			category: "Technology",
			industry: "Software",
			uses: 78,
			rating: 4.4,
			lastUpdated: "2024-01-11",
			tags: ["software", "license", "technology"],
			featured: false,
			complexity: "Complex"
		}
	]

	const categories = [
		{ value: "all", label: "All Categories" },
		{ value: "HR", label: "Human Resources" },
		{ value: "Legal", label: "Legal" },
		{ value: "Business", label: "Business" },
		{ value: "Corporate", label: "Corporate" },
		{ value: "Real Estate", label: "Real Estate" },
		{ value: "Technology", label: "Technology" }
	]

	const getCategoryIcon = (category: string) => {
		switch (category) {
			case "HR":
				return <Users className="h-4 w-4" />
			case "Legal":
				return <Scale className="h-4 w-4" />
			case "Business":
				return <Building className="h-4 w-4" />
			case "Corporate":
				return <Building className="h-4 w-4" />
			case "Real Estate":
				return <Building className="h-4 w-4" />
			case "Technology":
				return <FileText className="h-4 w-4" />
			default:
				return <FileText className="h-4 w-4" />
		}
	}

	const getComplexityColor = (complexity: string) => {
		switch (complexity) {
			case "Simple":
				return "bg-green-100 text-green-800"
			case "Medium":
				return "bg-orange-100 text-orange-800"
			case "Complex":
				return "bg-red-100 text-red-800"
			default:
				return "bg-gray-100 text-gray-800"
		}
	}

	const filteredTemplates = templates.filter((template) => {
		const matchesSearch =
			template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
			template.tags.some((tag) =>
				tag.toLowerCase().includes(searchTerm.toLowerCase())
			)
		const matchesCategory =
			categoryFilter === "all" || template.category === categoryFilter
		return matchesSearch && matchesCategory
	})

	const featuredTemplates = templates.filter((template) => template.featured)

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
						Template Library
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Professional document templates for legal and business use
					</p>
				</div>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Create Template
				</Button>
			</div>

			{/* Featured Templates */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Star className="h-5 w-5 text-yellow-500" />
						<span>Featured Templates</span>
					</CardTitle>
					<CardDescription>
						Most popular and highly-rated templates
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{featuredTemplates.map((template) => (
							<div
								key={template.id}
								className="rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
							>
								<div className="mb-2 flex items-start justify-between">
									<div className="flex items-center space-x-2">
										{getCategoryIcon(template.category)}
										<h3 className="font-medium">{template.name}</h3>
									</div>
									<div className="flex items-center space-x-1">
										<Star className="h-4 w-4 fill-current text-yellow-500" />
										<span className="text-sm">{template.rating}</span>
									</div>
								</div>
								<p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
									{template.description}
								</p>
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Badge variant="secondary">{template.category}</Badge>
										<Badge className={getComplexityColor(template.complexity)}>
											{template.complexity}
										</Badge>
									</div>
									<Button size="sm">Use Template</Button>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Find Templates</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-4 md:flex-row">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
								<Input
									placeholder="Search templates by name, description, or tags..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<Select value={categoryFilter} onValueChange={setCategoryFilter}>
							<SelectTrigger className="w-full md:w-48">
								<Filter className="mr-2 h-4 w-4" />
								<SelectValue placeholder="Filter by category" />
							</SelectTrigger>
							<SelectContent>
								{categories.map((category) => (
									<SelectItem key={category.value} value={category.value}>
										{category.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Templates Grid */}
			<Card>
				<CardHeader>
					<CardTitle>All Templates</CardTitle>
					<CardDescription>
						{filteredTemplates.length} template(s) found
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{filteredTemplates.map((template) => (
							<div
								key={template.id}
								className="rounded-lg border p-4 transition-shadow hover:shadow-md"
							>
								<div className="mb-3 flex items-start justify-between">
									<div className="flex items-center space-x-2">
										{getCategoryIcon(template.category)}
										<Badge variant="secondary">{template.category}</Badge>
									</div>
									{template.featured && (
										<Star className="h-4 w-4 fill-current text-yellow-500" />
									)}
								</div>

								<h3 className="mb-2 font-medium text-gray-900 dark:text-white">
									{template.name}
								</h3>
								<p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
									{template.description}
								</p>

								<div className="mb-4 space-y-2">
									<div className="flex items-center justify-between text-sm">
										<span className="text-gray-600">Industry:</span>
										<span>{template.industry}</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-gray-600">Uses:</span>
										<span>{template.uses}</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-gray-600">Rating:</span>
										<div className="flex items-center space-x-1">
											<Star className="h-3 w-3 fill-current text-yellow-500" />
											<span>{template.rating}</span>
										</div>
									</div>
								</div>

								<div className="mb-4 flex items-center space-x-1">
									<Badge className={getComplexityColor(template.complexity)}>
										{template.complexity}
									</Badge>
									{template.tags.slice(0, 2).map((tag) => (
										<Badge key={tag} variant="outline" className="text-xs">
											{tag}
										</Badge>
									))}
								</div>

								<div className="flex items-center justify-between">
									<div className="flex space-x-1">
										<Button variant="ghost" size="sm">
											<Eye className="h-4 w-4" />
										</Button>
										<Button variant="ghost" size="sm">
											<Copy className="h-4 w-4" />
										</Button>
										<Button variant="ghost" size="sm">
											<Download className="h-4 w-4" />
										</Button>
									</div>
									<Button size="sm" asChild>
										<Link href={`/dashboard/templates/${template.id}/use`}>
											Use Template
										</Link>
									</Button>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Template Categories */}
			<Card>
				<CardHeader>
					<CardTitle>Browse by Category</CardTitle>
					<CardDescription>
						Explore templates organized by business function
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
						{categories.slice(1).map((category) => (
							<Button
								key={category.value}
								variant="outline"
								className="h-20 flex-col"
								onClick={() => setCategoryFilter(category.value)}
							>
								{getCategoryIcon(category.value)}
								<span className="mt-2 text-xs">{category.label}</span>
							</Button>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
