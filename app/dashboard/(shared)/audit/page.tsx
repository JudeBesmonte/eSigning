"use client"

import { useState } from "react"
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Download,
	Eye,
	FileCheck,
	FileText,
	Filter,
	Hash,
	Search,
	Shield,
	User
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

export default function AuditTrailPage() {
	const [searchTerm, setSearchTerm] = useState("")
	const [actionFilter, setActionFilter] = useState("all")
	const [dateFilter, setDateFilter] = useState("all")

	const auditLogs = [
		{
			id: "1",
			timestamp: "2024-01-14 10:30:25",
			action: "document_signed",
			user: "John Smith",
			userRole: "individual",
			document: "Employment Contract",
			details: "Document signed with digital signature",
			ipAddress: "192.168.1.100",
			location: "New York, NY",
			hash: "a1b2c3d4e5f6...",
			verified: true
		},
		{
			id: "2",
			timestamp: "2024-01-14 09:15:42",
			action: "document_uploaded",
			user: "Sarah Johnson",
			userRole: "business",
			document: "Partnership Agreement",
			details: "New document uploaded for signing",
			ipAddress: "10.0.0.50",
			location: "San Francisco, CA",
			hash: "f6e5d4c3b2a1...",
			verified: true
		},
		{
			id: "3",
			timestamp: "2024-01-14 08:45:18",
			action: "identity_verified",
			user: "Michael Chen",
			userRole: "legal",
			document: "N/A",
			details: "Identity verification completed successfully",
			ipAddress: "172.16.0.25",
			location: "Los Angeles, CA",
			hash: "9z8y7x6w5v4u...",
			verified: true
		},
		{
			id: "4",
			timestamp: "2024-01-13 16:20:33",
			action: "document_viewed",
			user: "Emily Davis",
			userRole: "regulatory",
			document: "Corporate Merger Agreement",
			details: "Document accessed for regulatory review",
			ipAddress: "203.0.113.15",
			location: "Washington, DC",
			hash: "3t2s1r0q9p8o...",
			verified: true
		},
		{
			id: "5",
			timestamp: "2024-01-13 14:55:07",
			action: "access_denied",
			user: "Unknown User",
			userRole: "unknown",
			document: "Confidential Agreement",
			details: "Unauthorized access attempt blocked",
			ipAddress: "198.51.100.42",
			location: "Unknown",
			hash: "7n6m5l4k3j2i...",
			verified: false
		}
	]

	const getActionColor = (action: string) => {
		switch (action) {
			case "document_signed":
				return "bg-green-100 text-green-800"
			case "document_uploaded":
				return "bg-blue-100 text-blue-800"
			case "identity_verified":
				return "bg-purple-100 text-purple-800"
			case "document_viewed":
				return "bg-gray-100 text-gray-800"
			case "access_denied":
				return "bg-red-100 text-red-800"
			default:
				return "bg-gray-100 text-gray-800"
		}
	}

	const getActionIcon = (action: string) => {
		switch (action) {
			case "document_signed":
				return <CheckCircle className="h-4 w-4 text-green-600" />
			case "document_uploaded":
				return <FileText className="h-4 w-4 text-blue-600" />
			case "identity_verified":
				return <Shield className="h-4 w-4 text-purple-600" />
			case "document_viewed":
				return <Eye className="h-4 w-4 text-gray-600" />
			case "access_denied":
				return <AlertTriangle className="h-4 w-4 text-red-600" />
			default:
				return <Clock className="h-4 w-4 text-gray-600" />
		}
	}

	const formatAction = (action: string) => {
		return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
	}

	const filteredLogs = auditLogs.filter((log) => {
		const matchesSearch =
			log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
			log.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
			log.details.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesAction = actionFilter === "all" || log.action === actionFilter
		return matchesSearch && matchesAction
	})

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
						Audit Trail
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Immutable record of all platform activities and transactions
					</p>
				</div>
				<Button>
					<Download className="mr-2 h-4 w-4" />
					Export Audit Log
				</Button>
			</div>

			{/* Audit Statistics */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Events</CardTitle>
						<FileCheck className="h-4 w-4 text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">1,247</div>
						<p className="text-xs text-muted-foreground">+23 from yesterday</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Documents Signed
						</CardTitle>
						<CheckCircle className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">89</div>
						<p className="text-xs text-muted-foreground">+12 from yesterday</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Security Events
						</CardTitle>
						<Shield className="h-4 w-4 text-purple-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">156</div>
						<p className="text-xs text-muted-foreground">+8 from yesterday</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Failed Attempts
						</CardTitle>
						<AlertTriangle className="h-4 w-4 text-red-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">3</div>
						<p className="text-xs text-muted-foreground">-2 from yesterday</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Filter Audit Logs</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-4 md:flex-row">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
								<Input
									placeholder="Search by user, document, or activity..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<Select value={actionFilter} onValueChange={setActionFilter}>
							<SelectTrigger className="w-full md:w-48">
								<Filter className="mr-2 h-4 w-4" />
								<SelectValue placeholder="Filter by action" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Actions</SelectItem>
								<SelectItem value="document_signed">Document Signed</SelectItem>
								<SelectItem value="document_uploaded">
									Document Uploaded
								</SelectItem>
								<SelectItem value="identity_verified">
									Identity Verified
								</SelectItem>
								<SelectItem value="document_viewed">Document Viewed</SelectItem>
								<SelectItem value="access_denied">Access Denied</SelectItem>
							</SelectContent>
						</Select>
						<Select value={dateFilter} onValueChange={setDateFilter}>
							<SelectTrigger className="w-full md:w-48">
								<SelectValue placeholder="Filter by date" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Time</SelectItem>
								<SelectItem value="today">Today</SelectItem>
								<SelectItem value="week">This Week</SelectItem>
								<SelectItem value="month">This Month</SelectItem>
								<SelectItem value="quarter">This Quarter</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Audit Logs */}
			<Card>
				<CardHeader>
					<CardTitle>Audit Log Entries</CardTitle>
					<CardDescription>
						{filteredLogs.length} event(s) found
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{filteredLogs.map((log) => (
							<div
								key={log.id}
								className="rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
							>
								<div className="flex items-start justify-between">
									<div className="flex flex-1 items-start space-x-4">
										<div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
											{getActionIcon(log.action)}
										</div>
										<div className="min-w-0 flex-1">
											<div className="mb-2 flex items-center space-x-2">
												<Badge className={getActionColor(log.action)}>
													{formatAction(log.action)}
												</Badge>
												{log.verified && (
													<Badge className="bg-green-100 text-green-800">
														<Shield className="mr-1 h-3 w-3" />
														Verified
													</Badge>
												)}
											</div>
											<h3 className="mb-1 font-medium text-gray-900 dark:text-white">
												{log.details}
											</h3>
											<div className="grid grid-cols-1 gap-4 text-sm text-gray-600 dark:text-gray-400 md:grid-cols-2">
												<div className="space-y-1">
													<div className="flex items-center space-x-2">
														<User className="h-4 w-4" />
														<span>
															{log.user} ({log.userRole})
														</span>
													</div>
													<div className="flex items-center space-x-2">
														<FileText className="h-4 w-4" />
														<span>{log.document}</span>
													</div>
												</div>
												<div className="space-y-1">
													<div className="flex items-center space-x-2">
														<Clock className="h-4 w-4" />
														<span>{log.timestamp}</span>
													</div>
													<div className="flex items-center space-x-2">
														<Hash className="h-4 w-4" />
														<span className="font-mono text-xs">
															{log.hash}
														</span>
													</div>
												</div>
											</div>
											<div className="mt-2 text-xs text-gray-500">
												IP: {log.ipAddress} • Location: {log.location}
											</div>
										</div>
									</div>
									<Button variant="ghost" size="sm">
										<Eye className="h-4 w-4" />
									</Button>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Blockchain Verification */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Shield className="h-5 w-5 text-green-600" />
						<span>Blockchain Verification</span>
					</CardTitle>
					<CardDescription>
						All audit trail entries are cryptographically secured and immutable
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						<div className="text-center">
							<div className="mx-auto mb-3 w-fit rounded-full bg-green-100 p-3">
								<Hash className="h-6 w-6 text-green-600" />
							</div>
							<h3 className="mb-2 font-medium">Cryptographic Hashing</h3>
							<p className="text-sm text-gray-600">
								Each entry is secured with SHA-256 cryptographic hashing
							</p>
						</div>
						<div className="text-center">
							<div className="mx-auto mb-3 w-fit rounded-full bg-blue-100 p-3">
								<Shield className="h-6 w-6 text-blue-600" />
							</div>
							<h3 className="mb-2 font-medium">Immutable Records</h3>
							<p className="text-sm text-gray-600">
								Blockchain technology ensures records cannot be altered
							</p>
						</div>
						<div className="text-center">
							<div className="mx-auto mb-3 w-fit rounded-full bg-purple-100 p-3">
								<CheckCircle className="h-6 w-6 text-purple-600" />
							</div>
							<h3 className="mb-2 font-medium">Timestamp Verification</h3>
							<p className="text-sm text-gray-600">
								Precise timestamps verified through distributed consensus
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
