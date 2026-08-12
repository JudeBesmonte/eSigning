"use client"

import { useCallback, useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  Search,
  Shield,
  Trash2,
  Users
} from "lucide-react"
import { useSession } from "next-auth/react"

import { Avatar, AvatarFallback } from "@/core/components/ui/avatar"
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import { Calendar } from "@/core/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/core/components/ui/pagination"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/core/components/ui/popover"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from "@/core/components/ui/drawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/core/components/ui/select"

import { trpc } from "@/services/trpc/client"

import type { AuditEventWithIncludes } from "../api/audit.types"
import { getEventCategory, getEventTypeDisplayName } from "../utils/audit.utils"

interface AuditEventDashboardProps {
  title?: string
  description?: string
  showHeader?: boolean
  limit?: number
}

export function AuditEventDashboard({
  title = "Audit Events",
  description = "Complete log of system activities and user actions",
  showHeader = true
}: AuditEventDashboardProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Date filtering states
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // CSV export states
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<"user" | "all">("all")

  // Delete functionality


  // Calculate pagination offset
  const offset = (currentPage - 1) * itemsPerPage

  // Prepare date filters - ensure end date includes the full day
  const startDateFilter = dateFrom
    ? new Date(dateFrom.setHours(0, 0, 0, 0))
    : undefined
  const endDateFilter = dateTo
    ? new Date(dateTo.setHours(23, 59, 59, 999))
    : undefined

  // Fetch audit events from our API with pagination and date filtering
  const { data, isLoading, error } =
    trpc.auditEvent.getAll.useQuery({
      limit: itemsPerPage,
      offset,
      startDate: startDateFilter,
      endDate: endDateFilter
      // We'll handle category filtering on the frontend since categories map to multiple event types
    })

  // Process events data first to ensure hooks are called in consistent order
  const events = useMemo(() => {
    console.log('Audit Events Query Debug:', {
      data,
      isLoading,
      error,
      eventsCount: data?.data?.length ?? 0,
      total: data?.total ?? 0
    })
    return data?.data ?? []
  }, [data, isLoading, error])

  // Apply user filter to events for display
  const displayEvents = useMemo(() => {
    if (exportType === "user" && session?.user?.email) {
      // Filter to only events where the current user was the actor
      return events.filter((event) => event.userEmail === session.user.email)
    }
    return events
  }, [events, exportType, session?.user?.email])

  // Filter events with useMemo for performance optimization
  const filteredEvents = useMemo(() => {
    return displayEvents.filter((event) => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        if (
          !event.description.toLowerCase().includes(searchLower) &&
          !getEventTypeDisplayName(event.eventType)
            .toLowerCase()
            .includes(searchLower) &&
          !(event.userEmail?.toLowerCase().includes(searchLower) ?? false) &&
          !(event.userName?.toLowerCase().includes(searchLower) ?? false)
        ) {
          return false
        }
      }

      // Category filter
      if (selectedCategory !== "all") {
        // Check if it's a specific event type filter
        if (selectedCategory === "DOCUMENT_SIGNED" ||
          selectedCategory === "ENVELOPE_CREATED" ||
          selectedCategory === "DOCUMENT_UPLOADED") {
          if (event.eventType !== selectedCategory) {
            return false
          }
        } else {
          // Check category-based filtering
          if (getEventCategory(event.eventType) !== selectedCategory) {
            return false
          }
        }
      }

      return true
    })
  }, [displayEvents, searchQuery, selectedCategory])

  // For CSV export - use the same filtered data
  const csvExportData = useMemo(() => filteredEvents, [filteredEvents])

  // Reset pagination when filters change
  const resetPagination = useCallback(() => {
    setCurrentPage(1)
  }, [])

  // Handle filter changes with useCallback to prevent unnecessary re-renders
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    // Don't reset pagination for search to allow real-time filtering
  }, [])

  const handleCategoryChange = useCallback(
    (value: string) => {
      setSelectedCategory(value)
      resetPagination()
    },
    [resetPagination]
  )

  const handleDateFromChange = useCallback(
    (date: Date | undefined) => {
      // Create a new date to avoid mutating the original
      const newDate = date ? new Date(date) : undefined
      setDateFrom(newDate)
      resetPagination()
    },
    [resetPagination]
  )

  const handleDateToChange = useCallback(
    (date: Date | undefined) => {
      // Create a new date to avoid mutating the original
      const newDate = date ? new Date(date) : undefined
      setDateTo(newDate)
      resetPagination()
    },
    [resetPagination]
  )

  // CSV Export function
  const downloadCSV = useCallback(async () => {
    setIsExporting(true)
    try {
      // Use filtered data for export
      const events = csvExportData

      if (events.length === 0) {
        console.warn("No events to export")
        return
      }

      // Helper function to safely extract string values from metadata
      const getMetadataValue = (
        metadata: AuditEventWithIncludes["metadata"],
        key: string
      ): string => {
        if (
          !metadata ||
          typeof metadata !== "object" ||
          Array.isArray(metadata)
        ) {
          return "N/A"
        }
        if (!(key in metadata)) {
          return "N/A"
        }
        const value = metadata[key]
        if (typeof value === "string" || typeof value === "number") {
          return String(value)
        }
        return "N/A"
      }

      // Create clean, readable CSV content
      const headers = [
        "Event ID",
        "Event Type",
        "Description",
        "Date & Time",
        "User",
        "Envelope",
        "Document",
        "Recipient",
        "Category",
        "IP Address"
      ]

      const rows: string[][] = events.map((event: AuditEventWithIncludes) => {
        const eventDate = new Date(event.timestamp)

        // Clean up data for better readability
        const userInfo = event.userName && event.userEmail
          ? `${event.userName} (${event.userEmail})`
          : event.userName ?? event.userEmail ?? "N/A"

        const envelopeInfo = event.envelope?.title
          ? `${event.envelope.title} (${event.envelope.status ?? 'N/A'})`
          : "N/A"

        const documentInfo = event.document?.name
          ? `${event.document.name} (${event.document.type ?? 'N/A'})`
          : "N/A"

        const recipientInfo = event.recipient?.user?.name && event.recipient?.user?.email
          ? `${event.recipient.user.name} (${event.recipient.user.email}) - ${event.recipient.role ?? 'N/A'}`
          : event.recipient?.user?.name ?? event.recipient?.user?.email ?? "N/A"

        return [
          event.id,
          getEventTypeDisplayName(event.eventType),
          event.description,
          format(eventDate, "yyyy-MM-dd HH:mm:ss"),
          userInfo,
          envelopeInfo,
          documentInfo,
          recipientInfo,
          getEventCategory(event.eventType),
          getMetadataValue(event.metadata, "ipAddress")
        ]
      })

      const csvContent = [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n")

      // Download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute(
          "download",
          `audit-events-${exportType}-${format(new Date(), "yyyy-MM-dd")}.csv`
        )
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }, [csvExportData, exportType])

  // PDF Export function
  const downloadPDF = useCallback(async () => {
    setIsExporting(true)
    try {
      const events = csvExportData

      if (events.length === 0) {
        console.warn("No events to export")
        return
      }

      const pdfDoc = await PDFDocument.create()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      let currentPage = pdfDoc.addPage([595.28, 841.89]) // A4 size
      const { width, height } = currentPage.getSize()
      let yPosition = height - 50

      // Helper function to add new page if needed
      const checkAndAddPage = () => {
        if (yPosition < 100) {
          currentPage = pdfDoc.addPage([595.28, 841.89])
          yPosition = currentPage.getSize().height - 50
          return true
        }
        return false
      }

      // Header
      currentPage.drawText('Audit Events Report', {
        x: 50,
        y: yPosition,
        size: 22,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2)
      })
      yPosition -= 35

      // Header line
      currentPage.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: width - 50, y: yPosition },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      })
      yPosition -= 20

      const currentDate = format(new Date(), 'PPP')
      const currentTime = format(new Date(), 'p')

      // Generation info
      currentPage.drawText(`Generated: ${currentDate} at ${currentTime}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      })

      currentPage.drawText('Quanby Sign Platform', {
        x: width - 150,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      })
      yPosition -= 30

      // Summary
      currentPage.drawText(`Total Events: ${events.length}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2)
      })
      yPosition -= 40

      // Events
      events.forEach((event, index) => {
        checkAndAddPage()

        // Event number and type
        currentPage.drawText(`${index + 1}.`, {
          x: 50,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2)
        })

        const eventType = getEventTypeDisplayName(event.eventType)
        currentPage.drawText(eventType, {
          x: 80,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2)
        })
        yPosition -= 25

        // Event details
        const eventTime = format(event.timestamp, 'PPP p')
        const description = event.description.length > 80 ? event.description.substring(0, 80) + '...' : event.description

        currentPage.drawText(`Description: ${description}`, {
          x: 80,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0.4, 0.4, 0.4)
        })
        yPosition -= 15

        currentPage.drawText(`Time: ${eventTime}`, {
          x: 80,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0.4, 0.4, 0.4)
        })
        yPosition -= 15

        if (event.userName) {
          currentPage.drawText(`User: ${event.userName}`, {
            x: 80,
            y: yPosition,
            size: 9,
            font: font,
            color: rgb(0.6, 0.6, 0.6)
          })
          yPosition -= 15
        }

        const id = event.id.length > 30 ? event.id.substring(0, 30) + '...' : event.id
        currentPage.drawText(`ID: ${id}`, {
          x: 80,
          y: yPosition,
          size: 9,
          font: font,
          color: rgb(0.6, 0.6, 0.6)
        })
        yPosition -= 40
      })

      // Footer
      const footerY = 50
      currentPage.drawText('Generated by Quanby Sign System', {
        x: 50,
        y: footerY,
        size: 9,
        font: font,
        color: rgb(0.7, 0.7, 0.7)
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-events-${exportType}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }, [csvExportData, exportType])


  // Utility functions for UI - memoized to prevent unnecessary re-renders
  const getActionIcon = useCallback((eventType: string) => {
    if (eventType.includes("SIGNED"))
      return (
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      )
    if (eventType.includes("CREATED") || eventType.includes("UPLOADED"))
      return <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    if (eventType.includes("VIEWED"))
      return <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    if (
      eventType.includes("REJECTED") ||
      eventType.includes("CANCELLED") ||
      eventType.includes("DECLINED")
    )
      return (
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
      )
    if (eventType.includes("UPDATED") || eventType.includes("ADDED"))
      return <Edit className="h-4 w-4 text-orange-600 dark:text-orange-400" />
    if (eventType.includes("REMOVED"))
      return <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
    return <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
  }, [])

  const getCategoryColor = useCallback((category: string) => {
    switch (category) {
      case "document":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "recipient":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "envelope":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
      case "system":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }, [])




  // Loading state
  if (isLoading) {
    return (
      <div className={showHeader ? "container mx-auto py-8" : ""}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>{title}</span>
            </CardTitle>
            <CardDescription>Loading audit events...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={showHeader ? "container mx-auto py-8" : ""}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>{title}</span>
            </CardTitle>
            <CardDescription>Error loading audit events</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">
              Failed to load audit events. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto space-y-8 py-8">
        {showHeader && (
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground text-base">{description}</p>
          </div>
        )}

        {/* Main Dashboard Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  {title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {description}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {events.length} events
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* Filters Section */}
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search audit events..."
                    className="pl-10 h-10 text-sm"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>

                {/* Category Filter */}
                <Select
                  value={selectedCategory}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="w-full h-10 text-sm lg:w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="envelope">Envelope</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="recipient">Recipient</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="DOCUMENT_SIGNED">Document Signed</SelectItem>
                    <SelectItem value="ENVELOPE_CREATED">Create Envelope</SelectItem>
                    <SelectItem value="DOCUMENT_UPLOADED">Upload Documents</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Range Picker */}
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal text-sm h-10 lg:w-[140px]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">{dateFrom ? format(dateFrom, "MMM dd") : "From date"}</span>
                        <span className="sm:hidden">{dateFrom ? format(dateFrom, "MM/dd") : "From"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={handleDateFromChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal text-sm h-10 lg:w-[140px]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">{dateTo ? format(dateTo, "MMM dd") : "To date"}</span>
                        <span className="sm:hidden">{dateTo ? format(dateTo, "MM/dd") : "To"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={handleDateToChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Clear Date Filters */}
                  {(dateFrom ?? dateTo) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleDateFromChange(undefined)
                        handleDateToChange(undefined)
                      }}
                      className="w-full sm:w-auto text-sm h-10"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Export and Controls Section */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Items per page:
                    </span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value))
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[70px] h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Export:
                    </span>
                    <Select
                      value={exportType}
                      onValueChange={(value: "all" | "user") =>
                        setExportType(value)
                      }
                    >
                      <SelectTrigger className="w-[140px] h-10 text-sm">
                        <SelectValue>
                          {exportType === "user"
                            ? `My Actions (${csvExportData.length})`
                            : `All Events (${events.length})`}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex flex-col">
                            <span className="text-sm">All Events ({events.length})</span>
                            <span className="text-xs text-muted-foreground">
                              All events in accessible envelopes
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="user">
                          <div className="flex flex-col">
                            <span className="text-sm">My Actions ({csvExportData.length})</span>
                            <span className="text-xs text-muted-foreground">
                              Events where I was the actor
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCSV}
                    disabled={isExporting || csvExportData.length === 0}
                    className="gap-2 text-sm h-10 px-3"
                  >
                    <Download className="h-4 w-4" />
                    {isExporting
                      ? "Exporting..."
                      : `CSV (${csvExportData.length})`}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadPDF}
                    disabled={isExporting || csvExportData.length === 0}
                    className="gap-2 text-sm h-10 px-3"
                  >
                    <FileText className="h-4 w-4" />
                    {isExporting
                      ? "Exporting..."
                      : `PDF (${csvExportData.length})`}
                  </Button>
                </div>
              </div>
            </div>

            {/* Events List Section */}
            <div className="space-y-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold">All Events</h3>
                <Badge variant="outline" className="text-xs w-fit">
                  {filteredEvents.length} events
                </Badge>
              </div>

              <div className="max-h-[400px] sm:max-h-[600px] overflow-y-auto space-y-2">
                {filteredEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Shield className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <h4 className="text-lg font-medium text-muted-foreground">No audit events found</h4>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filters
                    </p>
                  </div>
                ) : (
                  filteredEvents.map((event) => {
                    const category = getEventCategory(event.eventType)

                    return (
                      <Card
                        key={event.id}
                        className="group border-l-2 border-l-primary/20 transition-all hover:shadow-sm hover:border-l-primary/40"
                      >
                        <CardContent className="p-3">
                          {/* Event Header */}
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 flex-shrink-0">
                              {getActionIcon(event.eventType)}
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-foreground text-xs">
                                  {getEventTypeDisplayName(event.eventType)}
                                </h4>
                                <Badge variant="secondary" className={getCategoryColor(category)}>
                                  <span className="text-xs">{category}</span>
                                </Badge>
                              </div>

                              <div className="flex items-center gap-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-xs">
                                    {event.userName
                                      ? event.userName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                      : (event.userEmail?.[0]?.toUpperCase() ?? "U")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium text-muted-foreground">
                                  {event.userName ?? event.userEmail ?? "System"}
                                </span>
                                {event.envelope && (
                                  <>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="truncate text-xs text-muted-foreground">
                                      {event.envelope.title}
                                    </span>
                                  </>
                                )}
                              </div>

                              <p className="text-xs text-foreground leading-relaxed line-clamp-1">
                                {event.description}
                              </p>

                              {/* Quick Info Bar */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{format(new Date(event.timestamp), 'MMM dd, h:mm a')}</span>
                                </div>
                                {event.document && (
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    <span className="truncate max-w-[100px]">{event.document.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(event.timestamp), {
                                  addSuffix: true
                                })}
                              </p>
                              <Drawer>
                                <DrawerTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1 text-xs h-6 px-2"
                                  >
                                    <Eye className="h-3 w-3" />
                                    Details
                                  </Button>
                                </DrawerTrigger>
                                <DrawerContent className="max-h-[75vh] flex flex-col">
                                  <div className="mx-auto w-full max-w-4xl flex-1 flex flex-col overflow-hidden">
                                    <DrawerHeader className="flex-shrink-0">
                                      <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-primary/10 p-2 flex-shrink-0">
                                          {getActionIcon(event.eventType)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <DrawerTitle className="text-lg font-semibold leading-tight">
                                            {getEventTypeDisplayName(event.eventType)}
                                          </DrawerTitle>
                                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <Badge variant="secondary" className={getCategoryColor(getEventCategory(event.eventType))}>
                                              {getEventCategory(event.eventType)}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                              {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <DrawerDescription className="text-sm leading-relaxed mt-2">
                                        {event.description}
                                      </DrawerDescription>
                                    </DrawerHeader>

                                    <div className="flex-1 overflow-y-auto p-4 pb-0">
                                      <div className="space-y-4">
                                        {/* Event Overview Card */}
                                        <div className="rounded-lg border bg-card p-4">
                                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            <div className="space-y-1">
                                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                Event Date
                                              </p>
                                              <p className="text-sm font-semibold">
                                                {format(new Date(event.timestamp), 'MMM dd, yyyy')}
                                              </p>
                                            </div>
                                            <div className="space-y-1">
                                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                Event Time
                                              </p>
                                              <p className="text-sm font-semibold">
                                                {format(new Date(event.timestamp), 'h:mm:ss a')}
                                              </p>
                                            </div>
                                            {event.userName && (
                                              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                  Actor
                                                </p>
                                                <div className="flex items-center gap-2">
                                                  <Avatar className="size-6">
                                                    <AvatarFallback className="text-xs">
                                                      {event.userName.split(" ").map((n) => n[0]).join("")}
                                                    </AvatarFallback>
                                                  </Avatar>
                                                  <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold truncate">{event.userName}</p>
                                                    {event.userEmail && (
                                                      <p className="text-xs text-muted-foreground truncate">{event.userEmail}</p>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                Event ID
                                              </p>
                                              <div className="p-2 bg-muted/50 rounded border">
                                                <p className="break-all font-mono text-xs text-muted-foreground">
                                                  {event.id}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Document Information */}
                                        {event.document && (
                                          <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                                                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                              </div>
                                              <h4 className="font-semibold">Document Information</h4>
                                            </div>
                                            <div className="rounded-lg border bg-card p-4">
                                              <div className="space-y-4">
                                                <div>
                                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                                    Document Name
                                                  </p>
                                                  <div className="p-2 bg-muted/50 rounded border">
                                                    <p className="text-sm font-medium break-words">{event.document.name}</p>
                                                  </div>
                                                </div>
                                                {event.document.type && (
                                                  <div>
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                                      Document Type
                                                    </p>
                                                    <Badge variant="outline" className="text-xs">
                                                      {event.document.type}
                                                    </Badge>
                                                  </div>
                                                )}
                                                <div>
                                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                                    Document ID
                                                  </p>
                                                  <div className="p-2 bg-muted/50 rounded border">
                                                    <p className="break-all font-mono text-xs text-muted-foreground">
                                                      {event.document.id}
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* Envelope Information */}
                                        {event.envelope && (
                                          <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
                                                <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                                              </div>
                                              <h4 className="font-semibold">Envelope Information</h4>
                                            </div>
                                            <div className="rounded-lg border bg-card p-4">
                                              <div className="space-y-4">
                                                <div>
                                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                                    Envelope Title
                                                  </p>
                                                  <div className="p-2 bg-muted/50 rounded border">
                                                    <p className="text-sm font-medium break-words">{event.envelope.title}</p>
                                                  </div>
                                                </div>
                                                <div>
                                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                                    Status
                                                  </p>
                                                  <Badge variant="outline" className="text-xs">
                                                    {event.envelope.status}
                                                  </Badge>
                                                </div>
                                                <div>
                                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                                    Envelope ID
                                                  </p>
                                                  <div className="p-2 bg-muted/50 rounded border">
                                                    <p className="break-all font-mono text-xs text-muted-foreground">
                                                      {event.envelope.id}
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* Recipient Information */}
                                        {event.recipient && (
                                          <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                              <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/20">
                                                <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                              </div>
                                              <h4 className="font-semibold">Recipient Information</h4>
                                            </div>
                                            <div className="rounded-lg border bg-card p-4">
                                              <div className="space-y-4">
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                  <div>
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                                      Role
                                                    </p>
                                                    <Badge variant="outline" className="text-xs">
                                                      {event.recipient.role}
                                                    </Badge>
                                                  </div>
                                                  <div>
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                                      Status
                                                    </p>
                                                    <Badge variant="outline" className="text-xs">
                                                      {event.recipient.status}
                                                    </Badge>
                                                  </div>
                                                </div>
                                                {event.recipient.user && (
                                                  <div>
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                                      User Details
                                                    </p>
                                                    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded border">
                                                      <Avatar className="size-6">
                                                        <AvatarFallback className="text-xs">
                                                          {event.recipient.user.name?.split(" ").map((n) => n[0]).join("") ?? "U"}
                                                        </AvatarFallback>
                                                      </Avatar>
                                                      <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium truncate">{event.recipient.user.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{event.recipient.user.email}</p>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                                <div>
                                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                                    Recipient ID
                                                  </p>
                                                  <div className="p-2 bg-muted/50 rounded border">
                                                    <p className="break-all font-mono text-xs text-muted-foreground">
                                                      {event.recipient.id}
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* Additional Metadata */}
                                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                                          <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                              <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                                                <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                              </div>
                                              <h4 className="font-semibold">Additional Details</h4>
                                            </div>
                                            <div className="rounded-lg border bg-card p-4">
                                              <div className="space-y-4">
                                                {Object.entries(event.metadata as Record<string, unknown>).map(([key, value]) => (
                                                  <div key={key} className="space-y-2">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                      {key.replace(/([A-Z])/g, " $1")}
                                                    </p>
                                                    <div className="p-3 bg-muted/50 rounded-md border">
                                                      <p className="break-all text-sm font-mono leading-relaxed">
                                                        {typeof value === "object" && value !== null
                                                          ? JSON.stringify(value, null, 2)
                                                          : typeof value === "string" || typeof value === "number" || typeof value === "boolean"
                                                            ? String(value)
                                                            : value === null || value === undefined
                                                              ? "N/A"
                                                              : "Unknown"}
                                                      </p>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <DrawerFooter className="flex-shrink-0 border-t bg-background/95 backdrop-blur">
                                      <DrawerClose asChild>
                                        <Button variant="outline" className="w-full">Close</Button>
                                      </DrawerClose>
                                    </DrawerFooter>
                                  </div>
                                </DrawerContent>
                              </Drawer>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>

            {/* Pagination Section */}
            <div className="space-y-3">
              {data && data.total > itemsPerPage && (
                <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:justify-between">
                  <div className="text-center lg:text-left">
                    <div className="text-sm text-muted-foreground">
                      Showing {offset + 1} to{" "}
                      {Math.min(offset + itemsPerPage, data.total)} of {data.total}{" "}
                      events
                    </div>
                  </div>

                  <Pagination>
                    <PaginationContent className="flex-wrap gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1)
                            }
                          }}
                          className={
                            currentPage <= 1
                              ? "pointer-events-none opacity-50"
                              : "text-sm"
                          }
                        />
                      </PaginationItem>

                      {/* Page Numbers - Show fewer on mobile */}
                      {Array.from(
                        {
                          length: Math.min(
                            5,
                            Math.ceil(data.total / itemsPerPage)
                          )
                        },
                        (_, i) => {
                          const totalPages = Math.ceil(data.total / itemsPerPage)
                          let pageNumber

                          if (totalPages <= 5) {
                            pageNumber = i + 1
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i
                          } else {
                            pageNumber = currentPage - 2 + i
                          }

                          if (pageNumber <= totalPages && pageNumber > 0) {
                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setCurrentPage(pageNumber)
                                  }}
                                  isActive={currentPage === pageNumber}
                                  className="text-sm"
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          }
                          return null
                        }
                      )}

                      {Math.ceil(data.total / itemsPerPage) > 5 &&
                        currentPage <
                        Math.ceil(data.total / itemsPerPage) - 2 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (
                              currentPage < Math.ceil(data.total / itemsPerPage)
                            ) {
                              setCurrentPage(currentPage + 1)
                            }
                          }}
                          className={
                            currentPage >= Math.ceil(data.total / itemsPerPage)
                              ? "pointer-events-none opacity-50"
                              : "text-sm"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {/* Summary Stats
						<div className="border-t border-gray-200 pt-4 dark:border-gray-700">
							<div className="text-center">
								<p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
									{data?.total ?? 0}
								</p>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									Total Events {dateFrom ?? dateTo ? "in selected range" : ""}
								</p>
							</div>
						</div> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
