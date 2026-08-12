"use client"

import Link from "next/link"
import {
	BookOpen,
	Calendar,
	CheckCircle,
	Clock,
	FileText,
	MessageSquare,
	Plus,
	Scale,
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
import { Progress } from "@/core/components/ui/progress"

export function LegalDashboard() {
	const stats = [
		{
			title: "Active Cases",
			value: "18",
			change: "+3",
			icon: Scale,
			color: "text-blue-600"
		},
		{
			title: "Client Documents",
			value: "45",
			change: "+12",
			icon: FileText,
			color: "text-green-600"
		},
		{
			title: "Pending Reviews",
			value: "7",
			change: "-2",
			icon: Clock,
			color: "text-orange-600"
		},
		{
			title: "Templates Used",
			value: "23",
			change: "+8",
			icon: BookOpen,
			color: "text-purple-600"
		}
	]

	const activeContracts = [
		{
			id: "1",
			name: "Corporate Merger Agreement - TechCorp & InnovateLtd",
			client: "TechCorp Industries",
			status: "review",
			progress: 75,
			dueDate: "2024-01-20"
		},
		{
			id: "2",
			name: "Employment Contract - Senior Developer",
			client: "StartupXYZ",
			status: "pending_signature",
			progress: 90,
			dueDate: "2024-01-15"
		},
		{
			id: "3",
			name: "Non-Disclosure Agreement - Project Alpha",
			client: "Enterprise Solutions Inc.",
			status: "draft",
			progress: 40,
			dueDate: "2024-01-25"
		}
	]

	const recentTemplates = [
		{ name: "Employment Contract Template", uses: 12, category: "HR" },
		{ name: "NDA Standard Template", uses: 8, category: "Legal" },
		{ name: "Service Agreement Template", uses: 6, category: "Business" },
		{ name: "Partnership Agreement Template", uses: 4, category: "Corporate" }
	]

	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "bg-green-100 text-green-800"
			case "pending_signature":
				return "bg-orange-100 text-orange-800"
			case "review":
				return "bg-blue-100 text-blue-800"
			case "draft":
				return "bg-gray-100 text-gray-800"
			default:
				return "bg-gray-100 text-gray-800"
		}
	}

	const formatStatus = (status: string) => {
		return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
						Legal Dashboard
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Manage contracts, clients, and legal documentation
					</p>
				</div>
				<div className="flex space-x-2">
					<Button asChild variant="outline">
						<Link href="/dashboard/templates">
							<BookOpen className="mr-2 h-4 w-4" />
							Templates
						</Link>
					</Button>
					<Button asChild>
						<Link href="/dashboard/documents/new">
							<Plus className="mr-2 h-4 w-4" />
							New Contract
						</Link>
					</Button>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => (
					<Card key={stat.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{stat.title}
							</CardTitle>
							<stat.icon className={`h-4 w-4 ${stat.color}`} />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stat.value}</div>
							<p className="text-xs text-muted-foreground">
								<span
									className={
										stat.change.startsWith("+")
											? "text-green-600"
											: "text-red-600"
									}
								>
									{stat.change}
								</span>{" "}
								from last month
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Active Contracts */}
				<Card>
					<CardHeader>
						<CardTitle>Active Contracts</CardTitle>
						<CardDescription>
							Track progress of ongoing legal documents
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{activeContracts.map((contract) => (
								<div key={contract.id} className="rounded-lg border p-4">
									<div className="mb-2 flex items-start justify-between">
										<div className="flex-1">
											<h4 className="text-sm font-medium">{contract.name}</h4>
											<p className="mt-1 text-sm text-gray-600">
												Client: {contract.client}
											</p>
										</div>
										<Badge className={getStatusColor(contract.status)}>
											{formatStatus(contract.status)}
										</Badge>
									</div>
									<div className="space-y-2">
										<div className="flex justify-between text-sm">
											<span>Progress</span>
											<span>{contract.progress}%</span>
										</div>
										<Progress value={contract.progress} className="h-2" />
										<div className="flex items-center justify-between">
											<span className="text-sm text-gray-600">
												Due: {contract.dueDate}
											</span>
											<Button variant="ghost" size="sm" asChild>
												<Link href={`/dashboard/documents/${contract.id}`}>
													View
												</Link>
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Template Usage */}
				<Card>
					<CardHeader>
						<CardTitle>Popular Templates</CardTitle>
						<CardDescription>
							Most frequently used contract templates
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{recentTemplates.map((template, index) => (
								<div
									key={index}
									className="flex items-center justify-between rounded-lg border p-3"
								>
									<div className="flex-1">
										<h4 className="text-sm font-medium">{template.name}</h4>
										<p className="text-xs text-gray-600">{template.category}</p>
									</div>
									<div className="text-right">
										<p className="text-sm font-medium">{template.uses} uses</p>
										<Button variant="ghost" size="sm" asChild>
											<Link
												href={`/dashboard/templates/${template.name.toLowerCase().replace(/\s+/g, "-")}`}
											>
												Use
											</Link>
										</Button>
									</div>
								</div>
							))}
						</div>
						<Button variant="outline" className="mt-4 w-full" asChild>
							<Link href="/dashboard/templates">View All Templates</Link>
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Quick Actions */}
			<Card>
				<CardHeader>
					<CardTitle>Quick Actions</CardTitle>
					<CardDescription>Streamline your legal workflow</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
						<Button variant="outline" className="h-20 flex-col" asChild>
							<Link href="/dashboard/documents/new">
								<FileText className="mb-2 h-6 w-6" />
								Draft Contract
							</Link>
						</Button>
						<Button variant="outline" className="h-20 flex-col" asChild>
							<Link href="/dashboard/clients">
								<Users className="mb-2 h-6 w-6" />
								Manage Clients
							</Link>
						</Button>
						<Button variant="outline" className="h-20 flex-col" asChild>
							<Link href="/dashboard/messages">
								<MessageSquare className="mb-2 h-6 w-6" />
								Client Messages
							</Link>
						</Button>
						<Button variant="outline" className="h-20 flex-col" asChild>
							<Link href="/dashboard/scheduling">
								<Calendar className="mb-2 h-6 w-6" />
								Schedule Meeting
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Recent Activity */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
					<CardDescription>
						Latest updates from your legal practice
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-start space-x-4">
							<div className="rounded-full bg-green-100 p-2">
								<CheckCircle className="h-4 w-4 text-green-600" />
							</div>
							<div className="flex-1">
								<p className="text-sm">
									<strong>TechCorp Industries</strong> signed the merger
									agreement
								</p>
								<p className="text-xs text-gray-600">1 hour ago</p>
							</div>
						</div>
						<div className="flex items-start space-x-4">
							<div className="rounded-full bg-blue-100 p-2">
								<MessageSquare className="h-4 w-4 text-blue-600" />
							</div>
							<div className="flex-1">
								<p className="text-sm">
									New message from <strong>StartupXYZ Legal Team</strong>
								</p>
								<p className="text-xs text-gray-600">3 hours ago</p>
							</div>
						</div>
						<div className="flex items-start space-x-4">
							<div className="rounded-full bg-orange-100 p-2">
								<Clock className="h-4 w-4 text-orange-600" />
							</div>
							<div className="flex-1">
								<p className="text-sm">
									Employment contract review deadline approaching
								</p>
								<p className="text-xs text-gray-600">5 hours ago</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
