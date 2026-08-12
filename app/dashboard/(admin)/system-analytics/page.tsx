"use client"

import { useState } from "react"
import {
	Activity,
	CheckCircle,
	Clock,
	Cpu,
	Database,
	Download,
	FileText,
	Globe,
	HardDrive,
	Monitor,
	RefreshCw,
	Server,
	Smartphone,
	Tablet,
	TrendingDown,
	TrendingUp,
	Users,
	Wifi
} from "lucide-react"
import {
	Area,
	AreaChart,
	CartesianGrid,
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis
} from "recharts"

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
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from "@/core/components/ui/tabs"

const performanceData = [
	{ name: "Jan", requests: 45000, responseTime: 120, errors: 45 },
	{ name: "Feb", requests: 52000, responseTime: 115, errors: 38 },
	{ name: "Mar", requests: 48000, responseTime: 125, errors: 52 },
	{ name: "Apr", requests: 61000, responseTime: 110, errors: 29 },
	{ name: "May", requests: 55000, responseTime: 118, errors: 41 },
	{ name: "Jun", requests: 67000, responseTime: 108, errors: 33 }
]

const usageData = [
	{ name: "Documents", value: 45, color: "#3b82f6" },
	{ name: "Templates", value: 25, color: "#10b981" },
	{ name: "Signatures", value: 20, color: "#f59e0b" },
	{ name: "Verifications", value: 10, color: "#ef4444" }
]

const deviceData = [
	{ name: "Desktop", value: 65, color: "#3b82f6" },
	{ name: "Mobile", value: 25, color: "#10b981" },
	{ name: "Tablet", value: 10, color: "#f59e0b" }
]

const trafficData = [
	{ time: "00:00", users: 120, sessions: 95 },
	{ time: "04:00", users: 85, sessions: 68 },
	{ time: "08:00", users: 340, sessions: 285 },
	{ time: "12:00", users: 520, sessions: 445 },
	{ time: "16:00", users: 480, sessions: 410 },
	{ time: "20:00", users: 290, sessions: 245 }
]

const systemMetrics = {
	cpu: { usage: 68, trend: "up", change: "+5%" },
	memory: { usage: 74, trend: "up", change: "+8%" },
	storage: { usage: 45, trend: "down", change: "-2%" },
	network: { usage: 32, trend: "up", change: "+12%" }
}

const recentAlerts = [
	{
		id: "1",
		type: "warning",
		message: "High CPU usage detected on server-02",
		timestamp: "2024-01-15T14:30:00Z",
		resolved: false
	},
	{
		id: "2",
		type: "info",
		message: "Database backup completed successfully",
		timestamp: "2024-01-15T12:00:00Z",
		resolved: true
	},
	{
		id: "3",
		type: "error",
		message: "API rate limit exceeded for client xyz-corp",
		timestamp: "2024-01-15T11:45:00Z",
		resolved: true
	},
	{
		id: "4",
		type: "success",
		message: "System update deployed successfully",
		timestamp: "2024-01-15T10:15:00Z",
		resolved: true
	}
]

export default function SystemAnalyticsPage() {
	const [timeRange, setTimeRange] = useState("7d")
	const [refreshing, setRefreshing] = useState(false)

	const handleRefresh = () => {
		setRefreshing(true)
		setTimeout(() => setRefreshing(false), 2000)
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						System Analytics
					</h1>
					<p className="text-muted-foreground">
						Monitor system performance, usage patterns, and infrastructure
						health
					</p>
				</div>
				<div className="flex gap-2">
					<Select value={timeRange} onValueChange={setTimeRange}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Time Range" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="1h">Last Hour</SelectItem>
							<SelectItem value="24h">Last 24 Hours</SelectItem>
							<SelectItem value="7d">Last 7 Days</SelectItem>
							<SelectItem value="30d">Last 30 Days</SelectItem>
							<SelectItem value="90d">Last 90 Days</SelectItem>
						</SelectContent>
					</Select>
					<Button
						variant="outline"
						onClick={handleRefresh}
						disabled={refreshing}
					>
						<RefreshCw
							className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
					<Button variant="outline">
						<Download className="mr-2 h-4 w-4" />
						Export Report
					</Button>
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Active Users
								</p>
								<p className="text-2xl font-bold">2,847</p>
								<p className="flex items-center gap-1 text-xs text-green-600">
									<TrendingUp className="h-3 w-3" />
									+12% from last week
								</p>
							</div>
							<Users className="h-8 w-8 text-blue-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									API Requests
								</p>
								<p className="text-2xl font-bold">1.2M</p>
								<p className="flex items-center gap-1 text-xs text-green-600">
									<TrendingUp className="h-3 w-3" />
									+8% from last week
								</p>
							</div>
							<Activity className="h-8 w-8 text-green-600" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Avg Response Time
								</p>
								<p className="text-2xl font-bold">112ms</p>
								<p className="flex items-center gap-1 text-xs text-red-600">
									<TrendingDown className="h-3 w-3" />
									+3ms from last week
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
									System Uptime
								</p>
								<p className="text-2xl font-bold">99.96%</p>
								<p className="flex items-center gap-1 text-xs text-green-600">
									<CheckCircle className="h-3 w-3" />
									Excellent
								</p>
							</div>
							<Server className="h-8 w-8 text-purple-600" />
						</div>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="performance" className="space-y-4">
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="performance">Performance</TabsTrigger>
					<TabsTrigger value="usage">Usage Analytics</TabsTrigger>
					<TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
					<TabsTrigger value="traffic">Traffic Analysis</TabsTrigger>
					<TabsTrigger value="alerts">Alerts & Logs</TabsTrigger>
				</TabsList>

				<TabsContent value="performance" className="space-y-4">
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>API Performance Trends</CardTitle>
								<CardDescription>
									Request volume and response times over time
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<AreaChart data={performanceData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="name" />
										<YAxis />
										<Tooltip />
										<Area
											type="monotone"
											dataKey="requests"
											stroke="#3b82f6"
											fill="#3b82f6"
											fillOpacity={0.1}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Response Time Analysis</CardTitle>
								<CardDescription>
									Average response times and error rates
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<LineChart data={performanceData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="name" />
										<YAxis />
										<Tooltip />
										<Line
											type="monotone"
											dataKey="responseTime"
											stroke="#10b981"
											strokeWidth={2}
										/>
										<Line
											type="monotone"
											dataKey="errors"
											stroke="#ef4444"
											strokeWidth={2}
										/>
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<Card>
							<CardContent className="p-4">
								<div className="text-center">
									<p className="text-sm font-medium text-muted-foreground">
										Peak Requests/Hour
									</p>
									<p className="text-3xl font-bold text-blue-600">12,450</p>
									<p className="text-xs text-muted-foreground">
										Today at 2:00 PM
									</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<div className="text-center">
									<p className="text-sm font-medium text-muted-foreground">
										Error Rate
									</p>
									<p className="text-3xl font-bold text-red-600">0.08%</p>
									<p className="text-xs text-green-600">
										-0.02% from yesterday
									</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<div className="text-center">
									<p className="text-sm font-medium text-muted-foreground">
										Throughput
									</p>
									<p className="text-3xl font-bold text-green-600">8.2K/min</p>
									<p className="text-xs text-green-600">+15% from last hour</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="usage" className="space-y-4">
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Feature Usage Distribution</CardTitle>
								<CardDescription>
									Most used features across the platform
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<PieChart>
										<Pie
											data={usageData}
											cx="50%"
											cy="50%"
											outerRadius={100}
											fill="#8884d8"
											dataKey="value"
											label={({ name, value }) => `${name}: ${value}%`}
										>
											{usageData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Pie>
										<Tooltip />
									</PieChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Device Usage</CardTitle>
								<CardDescription>
									User access patterns by device type
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{deviceData.map((device) => (
										<div key={device.name} className="space-y-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													{device.name === "Desktop" && (
														<Monitor className="h-4 w-4" />
													)}
													{device.name === "Mobile" && (
														<Smartphone className="h-4 w-4" />
													)}
													{device.name === "Tablet" && (
														<Tablet className="h-4 w-4" />
													)}
													<span className="font-medium">{device.name}</span>
												</div>
												<span className="text-sm text-muted-foreground">
													{device.value}%
												</span>
											</div>
											<Progress value={device.value} className="h-2" />
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
						<Card>
							<CardContent className="p-4">
								<div className="text-center">
									<FileText className="mx-auto mb-2 h-8 w-8 text-blue-600" />
									<p className="text-sm font-medium text-muted-foreground">
										Documents Processed
									</p>
									<p className="text-2xl font-bold">15,847</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<div className="text-center">
									<CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600" />
									<p className="text-sm font-medium text-muted-foreground">
										Signatures Completed
									</p>
									<p className="text-2xl font-bold">12,394</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<div className="text-center">
									<Users className="mx-auto mb-2 h-8 w-8 text-purple-600" />
									<p className="text-sm font-medium text-muted-foreground">
										New Users
									</p>
									<p className="text-2xl font-bold">1,247</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<div className="text-center">
									<Globe className="mx-auto mb-2 h-8 w-8 text-orange-600" />
									<p className="text-sm font-medium text-muted-foreground">
										Countries Served
									</p>
									<p className="text-2xl font-bold">47</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="infrastructure" className="space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
						{Object.entries(systemMetrics).map(([key, metric]) => (
							<Card key={key}>
								<CardContent className="p-4">
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												{key === "cpu" && <Cpu className="h-4 w-4" />}
												{key === "memory" && <Database className="h-4 w-4" />}
												{key === "storage" && <HardDrive className="h-4 w-4" />}
												{key === "network" && <Wifi className="h-4 w-4" />}
												<span className="font-medium capitalize">{key}</span>
											</div>
											<Badge
												variant={
													metric.trend === "up" ? "destructive" : "default"
												}
											>
												{metric.change}
											</Badge>
										</div>
										<div className="space-y-1">
											<div className="flex justify-between text-sm">
												<span>Usage</span>
												<span>{metric.usage}%</span>
											</div>
											<Progress
												value={metric.usage}
												className={`h-2 ${metric.usage > 80 ? "bg-red-100" : metric.usage > 60 ? "bg-yellow-100" : "bg-green-100"}`}
											/>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Server Health Status</CardTitle>
								<CardDescription>
									Real-time status of all server instances
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{[
										{
											name: "Web Server 01",
											status: "healthy",
											load: 45,
											uptime: "99.98%"
										},
										{
											name: "Web Server 02",
											status: "warning",
											load: 78,
											uptime: "99.95%"
										},
										{
											name: "Database Primary",
											status: "healthy",
											load: 52,
											uptime: "99.99%"
										},
										{
											name: "Database Replica",
											status: "healthy",
											load: 34,
											uptime: "99.97%"
										},
										{
											name: "Cache Server",
											status: "healthy",
											load: 28,
											uptime: "99.96%"
										}
									].map((server) => (
										<div
											key={server.name}
											className="flex items-center justify-between rounded-lg border p-3"
										>
											<div className="flex items-center gap-3">
												<div
													className={`h-3 w-3 rounded-full ${
														server.status === "healthy"
															? "bg-green-500"
															: server.status === "warning"
																? "bg-yellow-500"
																: "bg-red-500"
													}`}
												/>
												<div>
													<p className="font-medium">{server.name}</p>
													<p className="text-sm text-muted-foreground">
														Load: {server.load}%
													</p>
												</div>
											</div>
											<div className="text-right">
												<p className="text-sm font-medium">{server.uptime}</p>
												<p className="text-xs text-muted-foreground">Uptime</p>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Resource Allocation</CardTitle>
								<CardDescription>
									Current resource usage across services
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-6">
									<div>
										<div className="mb-2 flex justify-between">
											<span className="text-sm font-medium">API Gateway</span>
											<span className="text-sm text-muted-foreground">
												2.4 GB / 4 GB
											</span>
										</div>
										<Progress value={60} className="h-2" />
									</div>
									<div>
										<div className="mb-2 flex justify-between">
											<span className="text-sm font-medium">
												Document Processing
											</span>
											<span className="text-sm text-muted-foreground">
												6.8 GB / 8 GB
											</span>
										</div>
										<Progress value={85} className="h-2" />
									</div>
									<div>
										<div className="mb-2 flex justify-between">
											<span className="text-sm font-medium">
												Authentication Service
											</span>
											<span className="text-sm text-muted-foreground">
												1.2 GB / 2 GB
											</span>
										</div>
										<Progress value={60} className="h-2" />
									</div>
									<div>
										<div className="mb-2 flex justify-between">
											<span className="text-sm font-medium">
												Notification Service
											</span>
											<span className="text-sm text-muted-foreground">
												0.8 GB / 2 GB
											</span>
										</div>
										<Progress value={40} className="h-2" />
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="traffic" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Real-time Traffic Analysis</CardTitle>
							<CardDescription>
								User activity and session patterns throughout the day
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width="100%" height={400}>
								<AreaChart data={trafficData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="time" />
									<YAxis />
									<Tooltip />
									<Area
										type="monotone"
										dataKey="users"
										stackId="1"
										stroke="#3b82f6"
										fill="#3b82f6"
										fillOpacity={0.6}
									/>
									<Area
										type="monotone"
										dataKey="sessions"
										stackId="1"
										stroke="#10b981"
										fill="#10b981"
										fillOpacity={0.6}
									/>
								</AreaChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<Card>
							<CardContent className="p-4">
								<div className="text-center">
									<p className="text-sm font-medium text-muted-foreground">
										Peak Concurrent Users
									</p>
									<p className="text-3xl font-bold text-blue-600">1,847</p>
									<p className="text-xs text-muted-foreground">
										Today at 12:30 PM
									</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<div className="text-center">
									<p className="text-sm font-medium text-muted-foreground">
										Avg Session Duration
									</p>
									<p className="text-3xl font-bold text-green-600">24m 32s</p>
									<p className="text-xs text-green-600">
										+2m 15s from yesterday
									</p>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<div className="text-center">
									<p className="text-sm font-medium text-muted-foreground">
										Bounce Rate
									</p>
									<p className="text-3xl font-bold text-yellow-600">12.4%</p>
									<p className="text-xs text-red-600">+1.2% from yesterday</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="alerts" className="space-y-4">
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Recent Alerts</CardTitle>
								<CardDescription>
									System alerts and notifications from the last 24 hours
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{recentAlerts.map((alert) => (
										<div
											key={alert.id}
											className="flex items-start gap-3 rounded-lg border p-3"
										>
											<div
												className={`mt-2 h-2 w-2 rounded-full ${
													alert.type === "error"
														? "bg-red-500"
														: alert.type === "warning"
															? "bg-yellow-500"
															: alert.type === "success"
																? "bg-green-500"
																: "bg-blue-500"
												}`}
											/>
											<div className="flex-1">
												<p className="text-sm font-medium">{alert.message}</p>
												<p className="text-xs text-muted-foreground">
													{new Date(alert.timestamp).toLocaleString()}
												</p>
											</div>
											<Badge
												variant={alert.resolved ? "default" : "destructive"}
											>
												{alert.resolved ? "Resolved" : "Active"}
											</Badge>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>System Health Summary</CardTitle>
								<CardDescription>
									Overall system status and key indicators
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<CheckCircle className="h-5 w-5 text-green-600" />
											<span className="font-medium">
												All Systems Operational
											</span>
										</div>
										<Badge className="bg-green-100 text-green-800">
											Healthy
										</Badge>
									</div>

									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-sm">API Services</span>
											<div className="flex items-center gap-2">
												<div className="h-2 w-2 rounded-full bg-green-500" />
												<span className="text-sm text-green-600">
													Operational
												</span>
											</div>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm">Database Cluster</span>
											<div className="flex items-center gap-2">
												<div className="h-2 w-2 rounded-full bg-green-500" />
												<span className="text-sm text-green-600">
													Operational
												</span>
											</div>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm">File Storage</span>
											<div className="flex items-center gap-2">
												<div className="h-2 w-2 rounded-full bg-yellow-500" />
												<span className="text-sm text-yellow-600">
													Degraded
												</span>
											</div>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm">CDN Network</span>
											<div className="flex items-center gap-2">
												<div className="h-2 w-2 rounded-full bg-green-500" />
												<span className="text-sm text-green-600">
													Operational
												</span>
											</div>
										</div>
									</div>

									<div className="border-t pt-4">
										<div className="text-center">
											<p className="text-2xl font-bold text-green-600">
												99.96%
											</p>
											<p className="text-sm text-muted-foreground">
												Overall Uptime (30 days)
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	)
}
