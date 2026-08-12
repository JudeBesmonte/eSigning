"use client"

import Link from "next/link"
import {
	AlertTriangle,
	BarChart3,
	CheckCircle,
	Clock,
	Download,
	FileText,
	Search,
	Shield
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

export function RegulatoryDashboard() {
	const stats = [
		{
			title: "Documents Reviewed",
			value: "156",
			change: "+23",
			icon: FileText,
			color: "text-blue-600"
		},
		{
			title: "Compliance Issues",
			value: "3",
			change: "-5",
			icon: AlertTriangle,
			color: "text-red-600"
		},
		{
			title: "Verified Identities",
			value: "89",
			change: "+12",
			icon: Shield,
			color: "text-green-600"
		},
		{
			title: "Audit Reports",
			value: "12",
			change: "+4",
			icon: BarChart3,
			color: "text-purple-600"
		}
	]

	const pendingReviews = [
		{
			id: "1",
			documentType: "Corporate Merger Agreement",
			organization: "TechCorp Industries",
			submittedDate: "2024-01-10",
			priority: "high",
			riskLevel: "medium"
		},
		{
			id: "2",
			documentType: "Financial Services Contract",
			organization: "SecureBank Ltd.",
			submittedDate: "2024-01-12",
			priority: "medium",
			riskLevel: "low"
		},
		{
			id: "3",
			documentType: "Healthcare Data Agreement",
			organization: "MedTech Solutions",
			submittedDate: "2024-01-13",
			priority: "high",
			riskLevel: "high"
		}
	]

	const complianceAlerts = [
		{
			id: "1",
			type: "Identity Verification",
			message: "Multiple failed verification attempts detected",
			severity: "high",
			timestamp: "2024-01-14 09:30"
		},
		{
			id: "2",
			type: "Document Integrity",
			message: "Suspicious modification pattern in document chain",
			severity: "medium",
			timestamp: "2024-01-14 08:15"
		},
		{
			id: "3",
			type: "Access Control",
			message: "Unauthorized access attempt to restricted documents",
			severity: "high",
			timestamp: "2024-01-13 16:45"
		}
	]

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "high":
				return "bg-red-100 text-red-800"
			case "medium":
				return "bg-orange-100 text-orange-800"
			case "low":
				return "bg-green-100 text-green-800"
			default:
				return "bg-gray-100 text-gray-800"
		}
	}

	const getRiskColor = (risk: string) => {
		switch (risk) {
			case "high":
				return "bg-red-100 text-red-800"
			case "medium":
				return "bg-yellow-100 text-yellow-800"
			case "low":
				return "bg-green-100 text-green-800"
			default:
				return "bg-gray-100 text-gray-800"
		}
	}

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case "high":
				return "bg-red-100 text-red-800"
			case "medium":
				return "bg-orange-100 text-orange-800"
			case "low":
				return "bg-green-100 text-green-800"
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
						Regulatory Dashboard
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Monitor compliance, review documents, and ensure regulatory
						adherence
					</p>
				</div>
				<div className="flex space-x-2">
					<Button asChild variant="outline">
						<Link href="/dashboard/compliance">
							<Download className="mr-2 h-4 w-4" />
							Export Report
						</Link>
					</Button>
					<Button asChild>
						<Link href="/dashboard/review">
							<Search className="mr-2 h-4 w-4" />
							Review Documents
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
				{/* Pending Reviews */}
				<Card>
					<CardHeader>
						<CardTitle>Pending Document Reviews</CardTitle>
						<CardDescription>
							Documents requiring regulatory review and approval
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{pendingReviews.map((review) => (
								<div key={review.id} className="rounded-lg border p-4">
									<div className="mb-2 flex items-start justify-between">
										<div className="flex-1">
											<h4 className="text-sm font-medium">
												{review.documentType}
											</h4>
											<p className="mt-1 text-sm text-gray-600">
												{review.organization}
											</p>
											<p className="text-xs text-gray-500">
												Submitted: {review.submittedDate}
											</p>
										</div>
									</div>
									<div className="mt-3 flex items-center justify-between">
										<div className="flex space-x-2">
											<Badge className={getPriorityColor(review.priority)}>
												{review.priority} priority
											</Badge>
											<Badge className={getRiskColor(review.riskLevel)}>
												{review.riskLevel} risk
											</Badge>
										</div>
										<Button variant="ghost" size="sm" asChild>
											<Link href={`/dashboard/review/${review.id}`}>
												Review
											</Link>
										</Button>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Compliance Alerts */}
				<Card>
					<CardHeader>
						<CardTitle>Compliance Alerts</CardTitle>
						<CardDescription>
							Recent security and compliance notifications
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{complianceAlerts.map((alert) => (
								<div key={alert.id} className="rounded-lg border p-4">
									<div className="mb-2 flex items-start justify-between">
										<div className="flex-1">
											<div className="mb-1 flex items-center space-x-2">
												<h4 className="text-sm font-medium">{alert.type}</h4>
												<Badge className={getSeverityColor(alert.severity)}>
													{alert.severity}
												</Badge>
											</div>
											<p className="text-sm text-gray-600">{alert.message}</p>
											<p className="mt-1 text-xs text-gray-500">
												{alert.timestamp}
											</p>
										</div>
									</div>
									<div className="mt-3 flex justify-end">
										<Button variant="ghost" size="sm">
											Investigate
										</Button>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Quick Actions */}
			<Card>
				<CardHeader>
					<CardTitle>Regulatory Tools</CardTitle>
					<CardDescription>
						Access key regulatory and compliance functions
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
						<Button variant="outline" className="h-20 flex-col" asChild>
							<Link href="/dashboard/review">
								<Search className="mb-2 h-6 w-6" />
								Document Review
							</Link>
						</Button>
						<Button variant="outline" className="h-20 flex-col" asChild>
							<Link href="/dashboard/verification-audit">
								<Shield className="mb-2 h-6 w-6" />
								Identity Audit
							</Link>
						</Button>
						<Button variant="outline" className="h-20 flex-col" asChild>
							<Link href="/dashboard/compliance">
								<BarChart3 className="mb-2 h-6 w-6" />
								Compliance Reports
							</Link>
						</Button>
						<Button variant="outline" className="h-20 flex-col" asChild>
							<Link href="/dashboard/activity-monitoring">
								<Clock className="mb-2 h-6 w-6" />
								Activity Monitor
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Recent Activity */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Regulatory Activity</CardTitle>
					<CardDescription>
						Latest compliance and review activities
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
									Approved <strong>Financial Services Contract</strong> for
									SecureBank Ltd.
								</p>
								<p className="text-xs text-gray-600">2 hours ago</p>
							</div>
						</div>
						<div className="flex items-start space-x-4">
							<div className="rounded-full bg-red-100 p-2">
								<AlertTriangle className="h-4 w-4 text-red-600" />
							</div>
							<div className="flex-1">
								<p className="text-sm">
									Flagged compliance issue in{" "}
									<strong>Healthcare Data Agreement</strong>
								</p>
								<p className="text-xs text-gray-600">4 hours ago</p>
							</div>
						</div>
						<div className="flex items-start space-x-4">
							<div className="rounded-full bg-blue-100 p-2">
								<FileText className="h-4 w-4 text-blue-600" />
							</div>
							<div className="flex-1">
								<p className="text-sm">
									Generated compliance report for Q4 2024
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
