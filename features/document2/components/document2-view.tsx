"use client"

import React, { useEffect, useMemo, useState, type JSX } from "react"
import {
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  Search
} from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/core/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/core/components/ui/table"
import { cn } from "@/core/lib/utils"

import { trpc } from "@/services/trpc/client"

import type { DocumentWithRelations } from "../api/document2.schema"
import { SimplePdfViewer } from "@/features/envelopes-lite/components/simple-pdf-viewer-alt"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog"

type SigningStatus = "SIGNED" | "UNSIGNED" | "PARTIALLY_SIGNED"

type SortDirection = "asc" | "desc"

interface SortConfig {
  key: "name" | "createdAt" | "updatedAt"
  direction: SortDirection
}

export default function Document2View(): JSX.Element {
  const [signingStatusFilter, setSigningStatusFilter] = useState<SigningStatus | "all">(
    "all"
  )
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("")
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "createdAt",
    direction: "desc"
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [previewDocument, setPreviewDocument] = useState<{
    id: string
    name: string
    path: string | null
    signedDoc?: {
      id: string
      name: string
      path: string | null
    } | null
  } | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Function to determine signing status based on recipients
  const getSigningStatus = (document: DocumentWithRelations): SigningStatus => {
    if (!document.recipients || document.recipients.length === 0) {
      return "UNSIGNED"
    }

    const signedCount = document.recipients.filter(r => r.status === "SIGNED").length
    const totalCount = document.recipients.length

    if (signedCount === 0) {
      return "UNSIGNED"
    } else if (signedCount === totalCount) {
      return "SIGNED"
    } else {
      return "PARTIALLY_SIGNED"
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1) // Reset to first page when search query changes
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset page when signing status filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [signingStatusFilter])

  // Fetch ALL documents (no server-side pagination since we filter client-side)
  const {
    data: documentsResponse,
    error,
    isLoading
  } = trpc.document2.getAll.useQuery({
    page: 1,
    limit: 100, // Reduced limit to prevent timeout
    search: debouncedSearchQuery,
    sortBy: "createdAt",
    sortOrder: "desc"
  })

  // Filter, sort, and paginate documents client-side
  const { paginatedDocuments, totalFilteredCount, totalPages: calculatedTotalPages } = useMemo(() => {
    if (isLoading || !documentsResponse?.data) {
      return { paginatedDocuments: [], totalFilteredCount: 0, totalPages: 0 }
    }
    if (error) {
      console.error("Error fetching documents:", error)
      return { paginatedDocuments: [], totalFilteredCount: 0, totalPages: 0 }
    }

    // First, filter out "_signed" duplicates
    let filtered = documentsResponse.data.filter(doc => {
      // Filter out documents with "_signed" suffix (duplicates)
      if (doc.name.includes("_signed")) {
        return false
      }
      return true
    })

    // Then filter by signing status
    if (signingStatusFilter !== "all") {
      filtered = filtered.filter(doc => {
        const signingStatus = getSigningStatus(doc)
        return signingStatus === signingStatusFilter
      })
    }

    // Then sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number | Date | null | undefined
      let bValue: string | number | Date | null | undefined

      // Get the values to compare based on the current sort field
      switch (sortConfig.key) {
        case "name":
          aValue = a.name?.toLowerCase() ?? ""
          bValue = b.name?.toLowerCase() ?? ""
          break
        case "createdAt":
          aValue = a.createdAt
          bValue = b.createdAt
          break
        case "updatedAt":
          aValue = a.updatedAt
          bValue = b.updatedAt
          break
        default:
          aValue = a.createdAt
          bValue = b.createdAt
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Compare the values
      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })

    // Finally, apply client-side pagination
    const totalFiltered = sorted.length
    const totalPagesCalc = Math.ceil(totalFiltered / rowsPerPage)
    const startIndex = (currentPage - 1) * rowsPerPage
    const endIndex = startIndex + rowsPerPage
    const paginated = sorted.slice(startIndex, endIndex)

    return {
      paginatedDocuments: paginated,
      totalFilteredCount: totalFiltered,
      totalPages: totalPagesCalc
    }
  }, [documentsResponse?.data, error, isLoading, sortConfig, signingStatusFilter, currentPage, rowsPerPage])

  // Use the filtered count for pagination display
  const totalCount = totalFilteredCount
  const totalPages = calculatedTotalPages

  // Status filter options

  // Handle page change
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  // Handle sort request
  const handleSort = (key: "name" | "createdAt" | "updatedAt") => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc"
    }))
    setCurrentPage(1) // Reset to first page when sort changes
  }

  // Handle rows per page change
  const handleRowsPerPageChange = (value: string) => {
    const newRowsPerPage = parseInt(value, 10)
    setRowsPerPage(newRowsPerPage)
    setCurrentPage(1) // Reset to first page when rows per page changes
  }


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading documents...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading documents
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error.message}</p>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4">
      {/* Title and Description */}
      <div className="space-y-2 px-4 pt-6">
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Manage your documents and track their status.
        </p>
      </div>

      {/* Documents Table */}
      <div className="mx-4 overflow-hidden rounded-lg border">
        {/* Search and Filters */}
        <div className="border-b p-4 px-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="relative max-w-md flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                placeholder="Search documents by name or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Signing Status Filter */}
              <Select
                value={signingStatusFilter}
                onValueChange={(value: SigningStatus | "all") =>
                  setSigningStatusFilter(value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <div
                    className={cn(
                      "mr-2 h-2 w-2 rounded-full",
                      signingStatusFilter === "all"
                        ? "bg-gray-400"
                        : signingStatusFilter === "SIGNED"
                          ? "bg-green-500"
                          : signingStatusFilter === "UNSIGNED"
                            ? "bg-red-500"
                            : "bg-yellow-500" // PARTIALLY_SIGNED
                    )}
                  />
                  <SelectValue placeholder="Filter by Signing Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="flex items-center">
                    <span className="mr-2 h-2 w-2 rounded-full bg-gray-400" />
                    All Documents
                  </SelectItem>
                  <SelectItem value="SIGNED" className="flex items-center">
                    <span className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                    Signed
                  </SelectItem>
                  <SelectItem value="UNSIGNED" className="flex items-center">
                    <span className="mr-2 h-2 w-2 rounded-full bg-red-500" />
                    Unsigned
                  </SelectItem>
                  <SelectItem value="PARTIALLY_SIGNED" className="flex items-center">
                    <span className="mr-2 h-2 w-2 rounded-full bg-yellow-500" />
                    Partially Signed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px] px-6">
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className="flex items-center font-medium hover:text-primary"
                >
                  Document
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </button>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center font-medium hover:text-primary"
                >
                  Created
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </button>
              </TableHead>
              <TableHead>Signing Status</TableHead>
              <TableHead className="px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center py-8">
                    <FileText className="mb-2 h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No documents found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedDocuments.map((doc) => (
                <TableRow
                  key={doc.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted/20">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {doc.name || "Untitled Document"}
                        </span>
                        {doc.envelope?.title && (
                          <span className="text-xs text-muted-foreground">
                            {doc.envelope.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {doc.type || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {doc.size ? `${(doc.size / 1024).toFixed(2)} KB` : "-"}
                  </TableCell>
                  <TableCell>
                    {doc.createdAt
                      ? new Date(doc.createdAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const signingStatus = getSigningStatus(doc)
                      return (
                        <Badge
                          variant={
                            signingStatus === "SIGNED"
                              ? "default"
                              : signingStatus === "UNSIGNED"
                                ? "destructive"
                                : "secondary" // PARTIALLY_SIGNED
                          }
                          className="whitespace-nowrap"
                        >
                          {signingStatus === "SIGNED"
                            ? "Signed"
                            : signingStatus === "UNSIGNED"
                              ? "Unsigned"
                              : "Partially Signed"}
                        </Badge>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="px-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPreviewDocument({
                          id: doc.id,
                          name: doc.name ?? "Untitled Document",
                          path: doc.path,
                          signedDoc: doc.signedDoc
                        })
                        setIsDialogOpen(true)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <span className="sr-only">View document</span>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between space-y-4 px-2 py-4 sm:flex-row sm:space-y-0">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium">
            {(currentPage - 1) * rowsPerPage + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(currentPage * rowsPerPage, totalCount)}
          </span>{" "}
          of <span className="font-medium">{totalCount}</span> documents
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <span className="text-sm text-muted-foreground">
              Rows per page:
            </span>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={handleRowsPerPageChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={rowsPerPage} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <span>Page</span>
            <span className="font-medium">{currentPage}</span>
            <span>of</span>
            <span className="font-medium">{totalPages}</span>
          </div>

          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Document Preview Dialog */}
      {previewDocument && (
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setPreviewDocument(null)
        }}>
          <DialogContent className="max-w-6xl h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="size-5" />
                {previewDocument.signedDoc ? previewDocument.signedDoc.name : previewDocument.name}
                {previewDocument.signedDoc && (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    Signed Version
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {(() => {
                // Use signed document if available, otherwise use original
                const documentToShow = previewDocument.signedDoc ?? previewDocument
                const documentPath = documentToShow.path

                return documentPath ? (
                  <SimplePdfViewer
                    fileUrl={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/envelopes/${documentPath}`}
                    documentName={documentToShow.name}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <FileText className="mx-auto mb-2 size-12 text-gray-400" />
                      <p className="text-sm text-gray-500">Document path not available</p>
                    </div>
                  </div>
                )
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
