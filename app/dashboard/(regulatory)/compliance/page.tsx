"use client"

import { useState } from "react"
import {
	AlertTriangle,
	Calendar,
	CheckCircle,
	Clock,
	Download,
	FileCheck,
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
import { Progress } from "@/core/components/ui/progress"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"

export default function CompliancePage() {
	const [reportPeriod, setReportPeriod] = useState("current-quarter")

	const complianceMetrics = [
		{
			title: "Overall Compliance Score",
			value: "94.2%",
			target: "95%",
			status: "warning",
			icon: Shield,
			color: "text-orange-600"
		},
		{
			title: "Documents Audited",
			value: "1,156",
			target: "1,200",
			status: "good",
			icon: FileCheck,
			color: "text-green-600"
		},
		{
			title: "Regulatory Violations",
			value: "2",
			target: "0",
			status: "critical",
			icon: AlertTriangle,
			color: "text-red-600"
		},
		{
			title: "Compliance Reviews",
			value: "45",
			target: "50",
			status: "good",
			icon: CheckCircle,
			color: "text-blue-600"
		}
	]

	const regulations = [
		{
			name: "GDPR",
			description: "General Data Protection Regulation",
			compliance: 96,
			status: "compliant",
			lastReview: "2024-01-10",
			nextReview: "2024-04-10"
		},
		{
			name: "SOX",
			description: "Sarbanes-Oxley Act",
			compliance: 98,
			status: "compliant",
			lastReview: "2024-01-08",
			nextReview: "2024-04-08"
		},
		{
			name: "HIPAA",
			description: "Health Insurance Portability and Accountability Act",
			compliance: 92,
			status: "warning",
			lastReview: "2024-01-05",
			nextReview: "2024-04-05"
		},
		{
			name: "PCI DSS",
			description: "Payment Card Industry Data Security Standard",
			compliance: 89,
			status: "warning",
			lastReview: "2024-01-12",
			nextReview: "2024-04-12"
		},
		{
			name: "ISO 27001",
			description: "Information Security Management",
			compliance: 94,
			status: "compliant",
			lastReview: "2024-01-15",
			nextReview: "2024-04-15"
		}
	]

	const recentAudits = [
		{
			id: "1",
			type: "Internal Audit",
			scope: "Document Security Protocols",
			auditor: "Internal Compliance Team",
			date: "2024-01-14",
			status: "completed",
			findings: 3,
			severity: "low"
		},
		{
			id: "2",
			type: "External Audit",
			scope: "GDPR Compliance Review",
			auditor: "External Auditing Firm",
			date: "2024-01-10",
			status: "completed",
			findings: 1,
			severity: "medium"
		},
		{
			id: "3",
			type: "Regulatory Review",
			scope: "Financial Services Compliance",
			auditor: "Financial Services Authority",
			date: "2024-01-08",
			status: "in-progress",
			findings: 0,
			severity: "none"
		}
	]

	const getStatusColor = (status: string) => {
		switch (status) {
			case "compliant":
				return "bg-green-100 text-green-800"
			case "warning":
				return "bg-orange-100 text-orange-800"
			case "critical":
				return "bg-red-100 text-red-800"
			case "good":
				return "bg-green-100 text-green-800"
			default:
				return "bg-gray-100 text-gray-800"
		}
	}

	const getComplianceColor = (score: number) => {
		if (score >= 95) return "text-green-600"
		if (score >= 90) return "text-orange-600"
		return "text-red-600"
	}

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case "low":
				return "bg-green-100 text-green-800"
			case "medium":
				return "bg-orange-100 text-orange-800"
			case "high":
				return "bg-red-100 text-red-800"
			case "none":
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
						Compliance Dashboard
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Monitor regulatory compliance and audit activities
					</p>
				</div>
				<div className="flex space-x-2">
					<Select value={reportPeriod} onValueChange={setReportPeriod}>
						<SelectTrigger className="w-48">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="current-quarter">Current Quarter</SelectItem>
							<SelectItem value="last-quarter">Last Quarter</SelectItem>
							<SelectItem value="current-year">Current Year</SelectItem>
							<SelectItem value="last-year">Last Year</SelectItem>
						</SelectContent>
					</Select>
					<Button>
						<Download className="mr-2 h-4 w-4" />
						Export Report
					</Button>
				</div>
			</div>

			{/* Compliance Metrics */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				{complianceMetrics.map((metric) => (
					<Card key={metric.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{metric.title}
							</CardTitle>
							<metric.icon className={`h-4 w-4 ${metric.color}`} />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{metric.value}</div>
							<div className="mt-2 flex items-center justify-between">
								<span className="text-xs text-muted-foreground">
									Target: {metric.target}
								</span>
								<Badge className={getStatusColor(metric.status)}>
									{metric.status}
								</Badge>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Regulatory Compliance */}
			<Card>
				<CardHeader>
					<CardTitle>Regulatory Compliance Status</CardTitle>
					<CardDescription>
						Current compliance levels across different regulations
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						{regulations.map((regulation) => (
							<div key={regulation.name} className="space-y-3">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="font-medium">{regulation.name}</h3>
										<p className="text-sm text-gray-600">
											{regulation.description}
										</p>
									</div>
									<div className="flex items-center space-x-4">
										<Badge className={getStatusColor(regulation.status)}>
											{regulation.status}
										</Badge>
										<span
											className={`font-bold ${getComplianceColor(regulation.compliance)}`}
										>
											{regulation.compliance}%
										</span>
									</div>
								</div>
								<Progress value={regulation.compliance} className="h-2" />
								<div className="flex justify-between text-sm text-gray-500">
									<span>Last Review: {regulation.lastReview}</span>
									<span>Next Review: {regulation.nextReview}</span>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Recent Audits */}
				<Card>
					<CardHeader>
						<CardTitle>Recent Audits</CardTitle>
						<CardDescription>
							Latest compliance audits and reviews
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{recentAudits.map((audit) => (
								<div key={audit.id} className="rounded-lg border p-4">
									<div className="mb-2 flex items-start justify-between">
										<div>
											<h4 className="font-medium">{audit.type}</h4>
											<p className="text-sm text-gray-600">{audit.scope}</p>
										</div>
										<Badge
											className={
												audit.status === "completed"
													? "bg-green-100 text-green-800"
													: "bg-blue-100 text-blue-800"
											}
										>
											{audit.status}
										</Badge>
									</div>
									<div className="mt-3 grid grid-cols-2 gap-2 text-sm">
										<div className="flex items-center space-x-2">
											<Calendar className="h-4 w-4 text-gray-500" />
											<span>{audit.date}</span>
										</div>
										<div className="flex items-center space-x-2">
											<AlertTriangle className="h-4 w-4 text-gray-500" />
											<span>
												{audit.findings}{" "}
												{audit.findings === 1 ? "finding" : "findings"}
											</span>
										</div>
										<div className="flex items-center space-x-2">
											<Shield className="h-4 w-4 text-gray-500" />
											<span>{audit.auditor}</span>
										</div>
										<div className="flex items-center space-x-2">
											<Badge className={getSeverityColor(audit.severity)}>
												{audit.severity} severity
											</Badge>
										</div>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Compliance Calendar */}
				<Card>
					<CardHeader>
						<CardTitle>Compliance Calendar</CardTitle>
						<CardDescription>
							Upcoming compliance deadlines and reviews
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="rounded-lg border bg-yellow-50 p-4">
								<div className="flex items-center space-x-3">
									<div className="rounded-full bg-yellow-100 p-2">
										<Clock className="h-4 w-4 text-yellow-800" />
									</div>
									<div>
										<h4 className="font-medium">GDPR Quarterly Review</h4>
										<p className="text-sm text-gray-600">Due in 5 days</p>
									</div>
								</div>
							</div>

							<div className="rounded-lg border p-4">
								<div className="flex items-center space-x-3">
									<div className="rounded-full bg-gray-100 p-2">
										<Calendar className="h-4 w-4 text-gray-800" />
									</div>
									<div>
										<h4 className="font-medium">ISO 27001 Annual Assessment</h4>
										<p className="text-sm text-gray-600">Due in 14 days</p>
									</div>
								</div>
							</div>

							<div className="rounded-lg border p-4">
								<div className="flex items-center space-x-3">
									<div className="rounded-full bg-gray-100 p-2">
										<Calendar className="h-4 w-4 text-gray-800" />
									</div>
									<div>
										<h4 className="font-medium">PCI DSS Compliance Check</h4>
										<p className="text-sm text-gray-600">Due in 21 days</p>
									</div>
								</div>
							</div>

							<div className="rounded-lg border p-4">
								<div className="flex items-center space-x-3">
									<div className="rounded-full bg-gray-100 p-2">
										<Calendar className="h-4 w-4 text-gray-800" />
									</div>
									<div>
										<h4 className="font-medium">SOX Controls Testing</h4>
										<p className="text-sm text-gray-600">Due in 30 days</p>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Compliance Resources */}
			<Card>
				<CardHeader>
					<CardTitle>Compliance Resources</CardTitle>
					<CardDescription>
						Documentation and guidelines for maintaining compliance
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						<Button variant="outline" className="h-auto justify-start p-4">
							<div className="flex flex-col items-start text-left">
								<h4 className="font-medium">Compliance Handbook</h4>
								<p className="text-sm text-gray-600">
									Complete guide to regulatory compliance
								</p>
							</div>
						</Button>
						<Button variant="outline" className="h-auto justify-start p-4">
							<div className="flex flex-col items-start text-left">
								<h4 className="font-medium">Audit Procedures</h4>
								<p className="text-sm text-gray-600">
									Standard operating procedures for audits
								</p>
							</div>
						</Button>
						<Button variant="outline" className="h-auto justify-start p-4">
							<div className="flex flex-col items-start text-left">
								<h4 className="font-medium">Regulatory Updates</h4>
								<p className="text-sm text-gray-600">
									Latest changes in compliance requirements
								</p>
							</div>
						</Button>
						<Button variant="outline" className="h-auto justify-start p-4">
							<div className="flex flex-col items-start text-left">
								<h4 className="font-medium">Training Materials</h4>
								<p className="text-sm text-gray-600">
									Compliance training resources
								</p>
							</div>
						</Button>
						<Button variant="outline" className="h-auto justify-start p-4">
							<div className="flex flex-col items-start text-left">
								<h4 className="font-medium">Risk Assessment Templates</h4>
								<p className="text-sm text-gray-600">
									Tools for evaluating compliance risks
								</p>
							</div>
						</Button>
						<Button variant="outline" className="h-auto justify-start p-4">
							<div className="flex flex-col items-start text-left">
								<h4 className="font-medium">Incident Response Plan</h4>
								<p className="text-sm text-gray-600">
									Procedures for handling compliance incidents
								</p>
							</div>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
