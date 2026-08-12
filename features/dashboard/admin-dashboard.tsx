"use client"

import { useState } from "react"
import Link from "next/dist/client/link"
import { formatDistanceToNow, format } from "date-fns"
import {
  CheckCircle,
  FileText,
  Folder,
  Shield,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  X
} from "lucide-react"

import { Button } from "@/core/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/core/components/ui/select"

// Type for dashboard activity data
interface DashboardActivity {
  id: string
  title: string
  status: string
  createdAt: Date
  updatedAt: Date
  recipientCount: number
  documentCount: number
}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/core/components/ui/card"
import { Progress } from "@/core/components/ui/progress"
import { Separator } from "@/core/components/ui/separator"

import {
  useAdminStats,
  usePerformanceMetrics,
  useRecentActivity
} from "./api/dashboard.hooks"


// Utility function to get activity color based on audit event type
const getActivityColor = (eventType: string) => {
  switch (eventType) {
    case "ENVELOPE_COMPLETED":
    case "DOCUMENT_SIGNED":
    case "ENVELOPE_APPROVED":
      return "bg-primary"
    case "ENVELOPE_EXPIRED":
    case "ENVELOPE_CANCELLED":
    case "ENVELOPE_REJECTED":
    case "RECIPIENT_DECLINED":
      return "bg-destructive"
    case "ENVELOPE_PENDING_APPROVAL":
    case "ENVELOPE_VIEWED":
    case "DOCUMENT_VIEWED":
    case "RECIPIENT_VIEWED":
      return "bg-muted"
    case "ENVELOPE_CREATED":
    case "ENVELOPE_PUBLISHED":
    case "DOCUMENT_UPLOADED":
    case "RECIPIENT_ADDED":
      return "bg-accent"
    default:
      return "bg-secondary"
  }
}


export function AdminDashboard() {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedEventType, setSelectedEventType] = useState<string>("all")
  const [selectedTimeframe, setSelectedTimeframe] = useState<"all" | "today" | "week" | "month" | "custom">("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [showCustomDates, setShowCustomDates] = useState(false)
  const itemsPerPage = 5

  // Reset pagination when filters change
  const handleFilterChange = (newEventType: string, newTimeframe: "all" | "today" | "week" | "month" | "custom") => {
    setSelectedEventType(newEventType)
    setSelectedTimeframe(newTimeframe)
    setShowCustomDates(newTimeframe === "custom")
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Handle custom date changes
  const handleCustomDateChange = (field: "start" | "end", value: string) => {
    if (field === "start") {
      setStartDate(value)
    } else {
      setEndDate(value)
    }
    setCurrentPage(1) // Reset to first page when dates change
  }

  // Clear custom dates
  const clearCustomDates = () => {
    setStartDate("")
    setEndDate("")
    setSelectedTimeframe("all")
    setShowCustomDates(false)
    setCurrentPage(1)
  }

  const { data: adminStats, isLoading: adminStatsLoading } = useAdminStats()
  const { data: activityData, isLoading: activityLoading } = useRecentActivity({
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    eventType: selectedEventType === "all" ? undefined : selectedEventType,
    timeframe: selectedTimeframe,
    startDate: selectedTimeframe === "custom" ? startDate : undefined,
    endDate: selectedTimeframe === "custom" ? endDate : undefined
  })

  const { data: performanceMetrics, isLoading: metricsLoading } =
    usePerformanceMetrics()

  if (adminStatsLoading || activityLoading || metricsLoading) {
    return (
      <div className="min-h-screen bg-background p-6 text-foreground">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Envelopes */}
        <Card className="border-border bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Envelopes
            </CardTitle>
            <Folder
              className="h-4 w-4 text-muted-foreground"
              color="#214bbd
"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {adminStats?.totalEnvelopes ?? 0}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {adminStats?.recentEnvelopes ?? 0} recent envelopes
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="border-border bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
            <CheckCircle
              className="h-4 w-4 text-muted-foreground"
              color="#214bbd"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {adminStats?.completionRate ?? 0}%
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Overall completion rate
            </div>
          </CardContent>
        </Card>

        {/* Total Recipients */}
        <Card className="border-border bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recipients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" color="#214bbd" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {adminStats?.totalRecipients ?? 0}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Across all envelopes
            </div>
          </CardContent>
        </Card>

        {/* Total Documents */}
        <Card className="border-border bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Documents
            </CardTitle>
            <FileText
              className="h-4 w-4 text-muted-foreground"
              color="#214bbd"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {adminStats?.totalDocuments ?? 0}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Documents uploaded
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Envelope Status Distribution */}
        <Card className="border-border bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-foreground">
              Envelope Status Distribution
            </CardTitle>
            <CardDescription>
              Distribution of envelopes by their current status
            </CardDescription>
          </CardHeader>
          <Separator className="mb-4 w-[95%] justify-self-center" />

          <CardContent className="space-y-4">
            {adminStats?.statusDistribution?.map((status) => {
              const total = adminStats.statusDistribution.reduce(
                (sum, item) => sum + item.count,
                0
              )
              const percentage =
                total > 0 ? Math.round((status.count / total) * 100) : 0

              return (
                <div key={status.status} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize text-muted-foreground">
                      {status.status.toLowerCase()}
                    </span>
                    <span className="text-foreground">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2 bg-muted" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{status.count} envelopes</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border bg-card text-card-foreground">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Recent Activity</CardTitle>
                <CardDescription>
                  Recent actions and events across the platform
                </CardDescription>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="flex items-center gap-1">
                <Filter className="size-3 text-muted-foreground" />
                <Select value={selectedEventType} onValueChange={(value) => handleFilterChange(value, selectedTimeframe)}>
                  <SelectTrigger className="w-40 h-7 text-xs">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="ENVELOPE_CREATED">Envelope Created</SelectItem>
                    <SelectItem value="ENVELOPE_PUBLISHED">Envelope Published</SelectItem>
                    <SelectItem value="ENVELOPE_VIEWED">Envelope Viewed</SelectItem>
                    <SelectItem value="ENVELOPE_COMPLETED">Envelope Completed</SelectItem>
                    <SelectItem value="ENVELOPE_CANCELLED">Envelope Cancelled</SelectItem>
                    <SelectItem value="ENVELOPE_EXPIRED">Envelope Expired</SelectItem>
                    <SelectItem value="ENVELOPE_PENDING_APPROVAL">Pending Approval</SelectItem>
                    <SelectItem value="ENVELOPE_APPROVED">Envelope Approved</SelectItem>
                    <SelectItem value="ENVELOPE_REJECTED">Envelope Rejected</SelectItem>
                    <SelectItem value="DOCUMENT_UPLOADED">Document Uploaded</SelectItem>
                    <SelectItem value="DOCUMENT_VIEWED">Document Viewed</SelectItem>
                    <SelectItem value="DOCUMENT_SIGNED">Document Signed</SelectItem>
                    <SelectItem value="DOCUMENT_HASH_RECORDED">Document Hash Recorded</SelectItem>
                    <SelectItem value="DOCUMENT_HASH_UPDATED">Document Hash Updated</SelectItem>
                    <SelectItem value="RECIPIENT_ADDED">Recipient Added</SelectItem>
                    <SelectItem value="RECIPIENT_REMOVED">Recipient Removed</SelectItem>
                    <SelectItem value="RECIPIENT_VIEWED">Recipient Viewed</SelectItem>
                    <SelectItem value="RECIPIENT_SIGNED">Recipient Signed</SelectItem>
                    <SelectItem value="RECIPIENT_DECLINED">Recipient Declined</SelectItem>
                    <SelectItem value="REMINDER_SENT">Reminder Sent</SelectItem>
                    <SelectItem value="SETTINGS_UPDATED">Settings Updated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Calendar className="size-3 text-muted-foreground" />
                <Select value={selectedTimeframe} onValueChange={(value: "all" | "today" | "week" | "month" | "custom") => handleFilterChange(selectedEventType, value)}>
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue placeholder="Timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Date Range Picker */}
            {showCustomDates && (
              <div className="mt-3 p-3 bg-muted/30 rounded-md border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Custom Date Range</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCustomDates}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleCustomDateChange("start", e.target.value)}
                      className="w-full h-7 px-2 text-xs border border-input rounded-md bg-background"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => handleCustomDateChange("end", e.target.value)}
                      className="w-full h-7 px-2 text-xs border border-input rounded-md bg-background"
                    />
                  </div>
                </div>
                {startDate && endDate && new Date(startDate) > new Date(endDate) && (
                  <p className="text-xs text-destructive mt-1">Start date must be before end date</p>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityData?.activities?.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div
                    className={`mt-1 h-2 w-2 rounded-full ${getActivityColor(activity.status)}`}
                  />
                  <div className="flex-1 space-y-1">
                    <p
                      className="overflow-hidden text-ellipsis text-sm text-foreground"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        wordBreak: "break-word"
                      }}
                    >
                      {activity.title}
                    </p>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
                      <span>
                        {activity.status.replace(/_/g, " ").toLowerCase()}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(activity.updatedAt), {
                          addSuffix: true
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {activityData?.activities?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No activities found for the selected filters.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {activityData && activityData.totalCount > itemsPerPage && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, activityData.totalCount)} of {activityData.totalCount} activities
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 h-7 px-2 text-xs"
                  >
                    <ChevronLeft className="size-3" />
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">
                    Page {currentPage} of {Math.ceil(activityData.totalCount / itemsPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!activityData.hasMore}
                    className="flex items-center gap-1 h-7 px-2 text-xs"
                  >
                    Next
                    <ChevronRight className="size-3" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="mt-6 border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-card-foreground">
            Performance Metrics
          </CardTitle>
          <CardDescription>
            Key performance indicators across the platform
          </CardDescription>
        </CardHeader>
        <Separator className="mb-4 w-[95%] justify-self-center" />
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-primary">
                {Math.round(performanceMetrics?.completionRate ?? 0)}%
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Completion Rate
              </div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-primary">
                {performanceMetrics?.totalEnvelopes ?? 0}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Total Envelopes
              </div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-primary">
                {performanceMetrics?.avgTimeToComplete ?? 0}d
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Avg. Time to Complete
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Tools */}
      <Card className="mt-6 border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Administrative Tools</CardTitle>
          <CardDescription>
            Access key administrative and management functions
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link href="/dashboard/users">
                <Users className="mb-2 h-6 w-6" />
                User Management
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link href="/dashboard/template-management">
                <Shield className="mb-2 h-6 w-6" />
                Audit Events
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link href="/dashboard/system-analytics">
                <FileText className="mb-2 h-6 w-6" />
                All Documents{" "}
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col" asChild>
              <Link href="/settings">
                <Folder className="mb-2 h-6 w-6" />
                All Envelopes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
