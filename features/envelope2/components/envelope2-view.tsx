"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { format } from "date-fns"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Clock as ClockIcon,
  Eye,
  FileText,
  XCircle
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/core/components/ui/avatar"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/core/components/ui/dialog"
import { Skeleton } from "@/core/components/ui/skeleton"

import { trpc } from "@/services/trpc/client"

import { statusVariantMap, type EnvelopeStatus } from "../types/envelope"
import { SimplePdfViewer } from "@/features/envelopes-lite/components/simple-pdf-viewer-alt"

interface Document {
  id: string
  name: string
  type: string
  size: number
  createdAt: Date
  url?: string
  path: string
}

interface EnvelopeViewProps {
  envelopeId: string
}

// Document info modal state
interface DocumentInfoState {
  isOpen: boolean
  document: Document | null
}

interface DocumentViewerState {
  isOpen: boolean
  document: Document | null
}

const getStatusIcon = (status: EnvelopeStatus) => {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case "PUBLISHED":
      return <ClockIcon className="h-5 w-5 text-blue-500" />
    case "DRAFT":
      return <ClockIcon className="h-5 w-5 text-muted-foreground" />
    case "PENDING_APPROVAL":
      return <AlertCircle className="h-5 w-5 text-yellow-500" />
    case "APPROVED":
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case "REJECTED":
      return <XCircle className="h-5 w-5 text-destructive" />
    default:
      return <ClockIcon className="h-5 w-5 text-muted-foreground" />
  }
}

const getStatusVariant = (status: EnvelopeStatus) => {
  return statusVariantMap[status] || "secondary"
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export default function EnvelopeView({ envelopeId }: EnvelopeViewProps) {
  const router = useRouter()
  const [documentInfo, setDocumentInfo] = useState<DocumentInfoState>({
    isOpen: false,
    document: null
  })
  const [documentViewer, setDocumentViewer] = useState<DocumentViewerState>({
    isOpen: false,
    document: null
  })

  const {
    data: envelope,
    isLoading: isEnvelopeLoading,
    error
  } = trpc.envelope2.getEnvelope.useQuery(
    { id: envelopeId },
    {
      refetchOnWindowFocus: false
    }
  )

  const openDocumentInfo = (document: Document) => {
    setDocumentInfo({
      isOpen: true,
      document
    })
  }

  const closeDocumentInfo = () => {
    setDocumentInfo({
      isOpen: false,
      document: null
    })
  }

  const openDocumentViewer = (document: Document, hasSignedVersion: boolean) => {
    // Determine which document to show
    const documentToShow = hasSignedVersion
      ? envelope?.documents.find(doc => doc.name === `${document.name.replace('.pdf', '_signed.pdf')}`) ?? document
      : document

    setDocumentViewer({
      isOpen: true,
      document: documentToShow
    })
  }

  const closeDocumentViewer = () => {
    setDocumentViewer({
      isOpen: false,
      document: null
    })
  }

  if (isEnvelopeLoading) {
    return <EnvelopeViewSkeleton />
  }

  if (error || !envelope) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h3 className="text-lg font-medium text-destructive">
            Error loading envelope
          </h3>
          <p className="text-muted-foreground">
            {error?.message ??
              "Could not load envelope details. Please try again."}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Envelope Details
            </h1>
            <p className="text-muted-foreground">
              View and manage envelope information
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Envelope Info */}
        <div className="lg:col-span-2">
          {/* Envelope Overview Card */}
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{envelope.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {envelope.description ?? "No description provided"}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(envelope.status as EnvelopeStatus)}
                  <Badge
                    variant={getStatusVariant(
                      envelope.status as EnvelopeStatus
                    )}
                  >
                    {envelope.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(envelope.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(envelope.updatedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Recipients */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Recipients</CardTitle>
              <CardDescription>
                {envelope.recipient.length} recipient
                {envelope.recipient.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {envelope.recipient.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-muted-foreground">
                    No recipients assigned
                  </p>
                </div>
              ) : (
                envelope.recipient.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center space-x-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={recipient.user?.image ?? undefined} />
                      <AvatarFallback>
                        {recipient.user?.name?.charAt(0) ??
                          recipient.user?.email?.charAt(0) ??
                          "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {recipient.user?.name ??
                          recipient.user?.email ??
                          "Unknown User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {recipient.role} • {recipient.status}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs">
                        {recipient.role}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {recipient.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Documents Card - Full Width */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <CardTitle className="text-lg">Documents</CardTitle>
              <CardDescription>
                All documents associated with this envelope
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {envelope.documents.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No documents uploaded yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {envelope.documents
                  .filter((docItem) => !docItem.name.includes("_signed"))
                  .map((docItem) => {
                    // Check if this document has a signed version
                    const hasSignedVersion = envelope.documents.some(
                      (doc) => doc.name === `${docItem.name.replace('.pdf', '_signed.pdf')}`
                    )

                    return (
                      <div
                        key={docItem.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{docItem.name}</p>
                              {hasSignedVersion && (
                                <Badge variant="default" className="text-xs">
                                  Signed
                                </Badge>
                              )}
                              {!hasSignedVersion && (
                                <Badge variant="destructive" className="text-xs">
                                  Unsigned
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {docItem.type.toUpperCase()} •{" "}
                              {formatFileSize(docItem.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDocumentViewer(docItem, hasSignedVersion)}
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">View document</span>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Viewer Modal */}
      {documentViewer.document && (
        <Dialog open={documentViewer.isOpen} onOpenChange={(open) => {
          if (!open) closeDocumentViewer()
        }}>
          <DialogContent className="max-w-6xl h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="size-5" />
                {documentViewer.document.name}
                {documentViewer.document.name.includes("_signed") && (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    Signed Version
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <SimplePdfViewer
                fileUrl={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/envelopes/${documentViewer.document.path}`}
                documentName={documentViewer.document.name}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Document Info Modal */}
      <Dialog open={documentInfo.isOpen} onOpenChange={closeDocumentInfo}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-hidden p-0">
          <DialogHeader className="px-6 pb-4 pt-6">
            <div className="flex w-full items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold">
                  Document Information
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                  Details about the selected document
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {documentInfo.document && (
            <div className="w-full space-y-4 px-6 pb-6">
              {/* Document Icon and Name - Highlighted Section */}
              <div className="flex w-full items-center space-x-3 rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-border bg-background">
                  <FileText className="h-5 w-5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {documentInfo.document.name}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                    {documentInfo.document.type.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Document Properties */}
              <div className="w-full space-y-2">
                <div className="flex w-full items-center justify-between border-b border-border/50 py-3">
                  <span className="text-sm font-medium text-foreground">
                    File Size:
                  </span>
                  <span className="font-mono text-sm text-foreground">
                    {formatFileSize(documentInfo.document.size)}
                  </span>
                </div>
                <div className="flex w-full items-center justify-between border-b border-border/50 py-3">
                  <span className="text-sm font-medium text-foreground">
                    Created:
                  </span>
                  <span className="text-sm text-foreground">
                    {format(
                      new Date(documentInfo.document.createdAt),
                      "MMM d, yyyy"
                    )}
                  </span>
                </div>
                <div className="flex w-full items-center justify-between border-b border-border/50 py-3">
                  <span className="text-sm font-medium text-foreground">
                    File Type:
                  </span>
                  <span className="text-sm text-foreground">
                    {documentInfo.document.type}
                  </span>
                </div>
                <div className="flex w-full items-start justify-between py-3">
                  <span className="text-sm font-medium text-foreground">
                    Storage Path:
                  </span>
                  <div className="ml-4 max-w-[300px] flex-1 text-right">
                    <span className="break-all font-mono text-sm text-xs text-foreground">
                      {documentInfo.document.path}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EnvelopeViewSkeleton() {
  return (
    <div className="space-y-6 px-4 pb-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Main Content Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Envelope Overview Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-4" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column Skeleton */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Documents Skeleton - Full Width */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
