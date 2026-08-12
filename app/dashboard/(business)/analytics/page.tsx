"use client"

import { useState } from "react"
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Download,
	FileText,
	TrendingDown,
	TrendingUp,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"

export default function AnalyticsPage() {
	const [timeRange, setTimeRange] = useState("30d")

	const metrics = [
		{
			title: "Total Documents",
			value: "1,247",
			change: "+12.5%",
			trend: "up",
			icon: FileText,
			color: "text-blue-600"
		},
		{
			title: "Documents Signed",
			value: "1,089",
			change: "+8.3%",
			trend: "up",
			icon: CheckCircle,
			color: "text-green-600"
		},
		{
			title: "Active Users",
			value: "342",
			change: "+15.2%",
			trend: "up",
			icon: Users,
			color: "text-purple-600"
		},
		{
			title: "Avg. Signing Time",
			value: "2.4 days",
			change: "-18.7%",
			trend: "down",
			icon: Clock,
			color: "text-orange-600"
		}
	]

	const documentStats = [
		{ type: "Contracts", count: 456, percentage: 36.6, color: "bg-blue-500" },
		{ type: "NDAs", count: 298, percentage: 23.9, color: "bg-green-500" },
		{
			type: "Employment",
			count: 234,
			percentage: 18.8,
			color: "bg-purple-500"
		},
		{
			type: "Agreements",
			count: 156,
			percentage: 12.5,
			color: "bg-orange-500"
		},
		{ type: "Other", count: 103, percentage: 8.2, color: "bg-gray-500" }
	]

	const recentActivity = [
		{
			action: "Document Signed",
			user: "John Smith",
			document: "Employment Contract",
			time: "2 hours ago",
			status: "completed"
		},
		{
			action: "Document Created",
			user: "Sarah Johnson",
			document: "Partnership Agreement",
			time: "4 hours ago",
			status: "pending"
		},
		{
			action: "User Registered",
			user: "Michael Chen",
			document: "N/A",
			time: "6 hours ago",
			status: "active"
		},
		{
			action: "Document Expired",
			user: "Emily Davis",
			document: "Service Agreement",
			time: "8 hours ago",
			status: "expired"
		}
	]

	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "bg-green-100 text-green-800"
			case "pending":
				return "bg-orange-100 text-orange-800"
			case "active":
				return "bg-blue-100 text-blue-800"
			case "expired":
				return "bg-red-100 text-red-800"
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
						Analytics Dashboard
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Track performance and usage metrics
					</p>
				</div>
				<div className="flex space-x-2">
					<Select value={timeRange} onValueChange={setTimeRange}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="7d">Last 7 days</SelectItem>
							<SelectItem value="30d">Last 30 days</SelectItem>
							<SelectItem value="90d">Last 90 days</SelectItem>
							<SelectItem value="1y">Last year</SelectItem>
						</SelectContent>
					</Select>
					<Button variant="outline">
						<Download className="mr-2 h-4 w-4" />
						Export
					</Button>
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				{metrics.map((metric) => (
					<Card key={metric.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{metric.title}
							</CardTitle>
							<metric.icon className={`h-4 w-4 ${metric.color}`} />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{metric.value}</div>
							<div className="flex items-center text-xs">
								{metric.trend === "up" ? (
									<TrendingUp className="mr-1 h-3 w-3 text-green-600" />
								) : (
									<TrendingDown className="mr-1 h-3 w-3 text-red-600" />
								)}
								<span
									className={
										metric.trend === "up" ? "text-green-600" : "text-red-600"
									}
								>
									{metric.change}
								</span>
								<span className="ml-1 text-muted-foreground">
									from last period
								</span>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Document Types Distribution */}
				<Card>
					<CardHeader>
						<CardTitle>Document Types</CardTitle>
						<CardDescription>
							Distribution of document types created
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{documentStats.map((stat) => (
								<div
									key={stat.type}
									className="flex items-center justify-between"
								>
									<div className="flex items-center space-x-3">
										<div className={`h-3 w-3 rounded-full ${stat.color}`}></div>
										<span className="font-medium">{stat.type}</span>
									</div>
									<div className="flex items-center space-x-2">
										<span className="text-sm text-gray-600">{stat.count}</span>
										<span className="text-sm text-gray-500">
											({stat.percentage}%)
										</span>
									</div>
								</div>
							))}
						</div>
						<div className="mt-6">
							<div className="flex h-2 overflow-hidden rounded-full">
								{documentStats.map((stat) => (
									<div
										key={stat.type}
										className={stat.color}
										style={{ width: `${stat.percentage}%` }}
									></div>
								))}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Signing Performance */}
				<Card>
					<CardHeader>
						<CardTitle>Signing Performance</CardTitle>
						<CardDescription>
							Document completion rates and times
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-6">
							<div>
								<div className="mb-2 flex justify-between text-sm">
									<span>Completion Rate</span>
									<span className="font-medium">87.3%</span>
								</div>
								<div className="h-2 w-full rounded-full bg-gray-200">
									<div
										className="h-2 rounded-full bg-green-600"
										style={{ width: "87.3%" }}
									></div>
								</div>
							</div>

							<div>
								<div className="mb-2 flex justify-between text-sm">
									<span>On-Time Completion</span>
									<span className="font-medium">92.1%</span>
								</div>
								<div className="h-2 w-full rounded-full bg-gray-200">
									<div
										className="h-2 rounded-full bg-blue-600"
										style={{ width: "92.1%" }}
									></div>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4 pt-4">
								<div className="text-center">
									<p className="text-2xl font-bold text-green-600">2.4</p>
									<p className="text-sm text-gray-600">Avg. Days to Sign</p>
								</div>
								<div className="text-center">
									<p className="text-2xl font-bold text-blue-600">1.2</p>
									<p className="text-sm text-gray-600">Avg. Reminders Sent</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Recent Activity */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
					<CardDescription>
						Latest platform activities and events
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{recentActivity.map((activity, index) => (
							<div
								key={index}
								className="flex items-center justify-between rounded-lg border p-4"
							>
								<div className="flex items-center space-x-4">
									<div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
										{activity.action === "Document Signed" && (
											<CheckCircle className="h-4 w-4 text-green-600" />
										)}
										{activity.action === "Document Created" && (
											<FileText className="h-4 w-4 text-blue-600" />
										)}
										{activity.action === "User Registered" && (
											<Users className="h-4 w-4 text-purple-600" />
										)}
										{activity.action === "Document Expired" && (
											<AlertTriangle className="h-4 w-4 text-red-600" />
										)}
									</div>
									<div>
										<p className="font-medium">{activity.action}</p>
										<p className="text-sm text-gray-600">
											{activity.user} •{" "}
											{activity.document !== "N/A" && activity.document}
										</p>
									</div>
								</div>
								<div className="flex items-center space-x-3">
									<Badge className={getStatusColor(activity.status)}>
										{activity.status}
									</Badge>
									<span className="text-sm text-gray-500">{activity.time}</span>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Usage Trends */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Monthly Growth</CardTitle>
						<CardDescription>
							Document creation and user growth trends
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">Documents Created</span>
								<div className="flex items-center space-x-2">
									<TrendingUp className="h-4 w-4 text-green-600" />
									<span className="font-medium text-green-600">+23%</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">New Users</span>
								<div className="flex items-center space-x-2">
									<TrendingUp className="h-4 w-4 text-green-600" />
									<span className="font-medium text-green-600">+18%</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">Completion Rate</span>
								<div className="flex items-center space-x-2">
									<TrendingUp className="h-4 w-4 text-green-600" />
									<span className="font-medium text-green-600">+5%</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">Response Time</span>
								<div className="flex items-center space-x-2">
									<TrendingDown className="h-4 w-4 text-green-600" />
									<span className="font-medium text-green-600">-12%</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Peak Usage Times</CardTitle>
						<CardDescription>
							When users are most active on the platform
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-sm">9:00 AM - 11:00 AM</span>
								<div className="flex items-center space-x-2">
									<div className="h-2 w-20 rounded-full bg-gray-200">
										<div
											className="h-2 rounded-full bg-blue-600"
											style={{ width: "85%" }}
										></div>
									</div>
									<span className="text-sm text-gray-600">85%</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">1:00 PM - 3:00 PM</span>
								<div className="flex items-center space-x-2">
									<div className="h-2 w-20 rounded-full bg-gray-200">
										<div
											className="h-2 rounded-full bg-blue-600"
											style={{ width: "92%" }}
										></div>
									</div>
									<span className="text-sm text-gray-600">92%</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">3:00 PM - 5:00 PM</span>
								<div className="flex items-center space-x-2">
									<div className="h-2 w-20 rounded-full bg-gray-200">
										<div
											className="h-2 rounded-full bg-blue-600"
											style={{ width: "78%" }}
										></div>
									</div>
									<span className="text-sm text-gray-600">78%</span>
								</div>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">7:00 PM - 9:00 PM</span>
								<div className="flex items-center space-x-2">
									<div className="h-2 w-20 rounded-full bg-gray-200">
										<div
											className="h-2 rounded-full bg-blue-600"
											style={{ width: "45%" }}
										></div>
									</div>
									<span className="text-sm text-gray-600">45%</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
