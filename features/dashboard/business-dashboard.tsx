"use client"

import Link from "next/link"
import {
	AlertCircle,
	Calendar,
	CheckCircle,
	Clock,
	FileText,
	MessageSquare,
	Plus,
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

export function BusinessDashboard() {
	const stats = [
		{
			title: "Active Documents",
			value: "24",
			change: "+12%",
			icon: FileText,
			color: "text-blue-600"
		},
		{
			title: "Team Members",
			value: "8",
			change: "+2",
			icon: Users,
			color: "text-green-600"
		},
		{
			title: "Pending Signatures",
			value: "6",
			change: "-3",
			icon: Clock,
			color: "text-orange-600"
		},
		{
			title: "Completed This Month",
			value: "42",
			change: "+18%",
			icon: CheckCircle,
			color: "text-emerald-600"
		}
	]

	const recentDocuments = [
		{
			id: "1",
			name: "Partnership Agreement - TechCorp",
			status: "pending",
			signers: 3,
			completed: 2,
			dueDate: "2024-01-15"
		},
		{
			id: "2",
			name: "Employee Contract - John Smith",
			status: "completed",
			signers: 2,
			completed: 2,
			dueDate: "2024-01-10"
		},
		{
			id: "3",
			name: "NDA - Client Project Alpha",
			status: "draft",
			signers: 4,
			completed: 0,
			dueDate: "2024-01-20"
		}
	]

	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "bg-green-100 text-green-800"
			case "pending":
				return "bg-orange-100 text-orange-800"
			case "draft":
				return "bg-gray-100 text-gray-800"
			default:
				return "bg-gray-100 text-gray-800"
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
						Business Dashboard
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Manage your documents, team, and signing workflows
					</p>
				</div>
				<div className="flex space-x-2">
					<Button asChild>
						<Link href="/dashboard/documents/new">
							<Plus className="mr-2 h-4 w-4" />
							New Document
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
				{/* Recent Documents */}
				<Card>
					<CardHeader>
						<CardTitle>Recent Documents</CardTitle>
						<CardDescription>
							Track the progress of your latest documents
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{recentDocuments.map((doc) => (
								<div
									key={doc.id}
									className="flex items-center justify-between rounded-lg border p-4"
								>
									<div className="flex-1">
										<h4 className="font-medium">{doc.name}</h4>
										<div className="mt-2 flex items-center space-x-4">
											<Badge className={getStatusColor(doc.status)}>
												{doc.status}
											</Badge>
											<span className="text-sm text-gray-600">
												{doc.completed}/{doc.signers} signatures
											</span>
											<span className="text-sm text-gray-600">
												Due: {doc.dueDate}
											</span>
										</div>
										<Progress
											value={(doc.completed / doc.signers) * 100}
											className="mt-2 h-2"
										/>
									</div>
									<Button variant="ghost" size="sm" asChild>
										<Link href={`/dashboard/documents/${doc.id}`}>View</Link>
									</Button>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Quick Actions */}
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
						<CardDescription>Common tasks and shortcuts</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-4">
							<Button variant="outline" className="h-20 flex-col" asChild>
								<Link href="/dashboard/documents/new">
									<FileText className="mb-2 h-6 w-6" />
									Upload Document
								</Link>
							</Button>
							<Button variant="outline" className="h-20 flex-col" asChild>
								<Link href="/dashboard/team">
									<Users className="mb-2 h-6 w-6" />
									Manage Team
								</Link>
							</Button>
							<Button variant="outline" className="h-20 flex-col" asChild>
								<Link href="/dashboard/messages">
									<MessageSquare className="mb-2 h-6 w-6" />
									Send Message
								</Link>
							</Button>
							<Button variant="outline" className="h-20 flex-col" asChild>
								<Link href="/dashboard/scheduling">
									<Calendar className="mb-2 h-6 w-6" />
									Schedule Session
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Activity Feed */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
					<CardDescription>
						Latest updates from your team and documents
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
									<strong>John Smith</strong> signed the Employee Contract
								</p>
								<p className="text-xs text-gray-600">2 hours ago</p>
							</div>
						</div>
						<div className="flex items-start space-x-4">
							<div className="rounded-full bg-blue-100 p-2">
								<MessageSquare className="h-4 w-4 text-blue-600" />
							</div>
							<div className="flex-1">
								<p className="text-sm">
									New message from <strong>TechCorp Legal Team</strong>
								</p>
								<p className="text-xs text-gray-600">4 hours ago</p>
							</div>
						</div>
						<div className="flex items-start space-x-4">
							<div className="rounded-full bg-orange-100 p-2">
								<AlertCircle className="h-4 w-4 text-orange-600" />
							</div>
							<div className="flex-1">
								<p className="text-sm">
									Partnership Agreement requires your signature
								</p>
								<p className="text-xs text-gray-600">6 hours ago</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
