"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Search } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"

import { trpc } from "@/services/trpc/client"

import { DocumentEmptyState } from "@/features/envelopes-lite/components/document-empty-state"
import { DocumentListWithDisclosure } from "@/features/envelopes-lite/components/document-list-with-disclosure"
import { DocumentLoadingSkeleton } from "@/features/envelopes-lite/components/document-loading-skeleton"
import { DocumentUploadDialog } from "@/features/envelopes-lite/components/document-upload-dialog"

type StatusFilter = "all" | "SIGNED" | "PENDING" | "REJECTED"

export function EnvelopeViewPage({ envelopeId }: { envelopeId: string }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [tabFilteredCount, setTabFilteredCount] = useState<number | null>(null)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()

  const {
    data: envelope,
    error,
    isLoading: isLoadingEnvelope
  } = trpc.envelopeLite.getEnvelopeById.useQuery({
    envelopeId
  })

  // Authorization check: Redirect signers who try to access envelope directly
  useEffect(() => {
    if (sessionStatus === "loading") {
      return // Wait for session to load
    }

    if (sessionStatus === "unauthenticated") {
      console.log("🚫 Unauthenticated access attempt. Redirecting to homepage.")
      router.push("/")
      return
    }

    // When envelope data is loaded, immediately check authorization
    if (envelope && session?.user) {
      const isEnvelopeCreator = envelope.userId === session.user.id

      if (!isEnvelopeCreator) {
        console.log("🚫 Unauthorized access attempt to envelope view by non-creator. Redirecting to homepage.")
        setIsAuthorized(false)
        router.push("/")
        return
      }

      // User is authorized
      setIsAuthorized(true)
    } else if (envelope === null && !isLoadingEnvelope && !error) {
      // Envelope doesn't exist or user has no access
      console.log("🚫 Envelope not found or access denied. Redirecting to homepage.")
      setIsAuthorized(false)
      router.push("/")
    }
  }, [envelope, session, sessionStatus, router, isLoadingEnvelope, error])

  // Redirect to envelopes list if envelope is not found (e.g., after deletion)
  useEffect(() => {
    if (
      error?.data?.code === "NOT_FOUND" ||
      error?.message?.includes("not found") ||
      error?.message?.includes("NOT_FOUND")
    ) {
      router.push("/envelopes")
    }
  }, [error, router])

  const {
    data: documents,
    isPending,
    refetch: refetchDocuments
  } = trpc.envelopeLite.getEnvelopeDocuments.useQuery({ envelopeId }, {
    enabled: isAuthorized === true
  })

  // Filter and search documents
  const filteredDocuments = useMemo(() => {
    if (!documents) return []

    return documents.filter((document) => {
      // Filter out documents with "_signed" in the name
      if (document.name.includes("_signed")) {
        return false
      }
      // Status filter
      if (statusFilter !== "all" && document.status !== statusFilter) {
        return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        return (
          document.name.toLowerCase().includes(query) ||
          document.type.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [documents, statusFilter, searchQuery])

  const handleDocumentUploadSuccess = async () => {
    await refetchDocuments()
  }

  // Don't render anything until authorization is complete
  if (sessionStatus === "loading" || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-muted dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  // If not authorized, don't render anything (redirect is already happening)
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-muted dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted dark:bg-background">
      {/* Header */}
      <div className="border-b bg-background backdrop-blur dark:bg-muted/60">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-medium text-foreground">
                {isLoadingEnvelope
                  ? "Loading..."
                  : (envelope?.title ?? "Untitled Envelope")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {envelope?.description ?? "No description"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-4">
              {/* Search */}
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Upload Button */}
              <DocumentUploadDialog
                envelopeId={envelopeId}
                onSuccess={handleDocumentUploadSuccess}
              />

              {/* Delete Envelope Button - Commented out */}
              {/*
							<DeleteEnvelopeDialog
								envelopeId={envelopeId}
								envelopeTitle={envelope?.title ?? "Untitled Envelope"}
								trigger={
									<Button
										variant="outline"
										size="sm"
										className="border-red-200 bg-red-50 text-red-700 transition-colors hover:border-red-300 hover:bg-red-100"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete Envelope
									</Button>
								}
							/>
							*/}
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {(isPending || isLoadingEnvelope) && <DocumentLoadingSkeleton />}

        {!isPending && !isLoadingEnvelope && filteredDocuments.length === 0 && (
          <div className="py-12 text-center">
            {documents?.length === 0 ? (
              <DocumentEmptyState envelopeId={envelopeId} />
            ) : (
              <div className="space-y-3">
                <div className="text-lg font-medium text-muted-foreground">
                  No documents found
                </div>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Upload your first document to get started."}
                </p>
                {(searchQuery || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setStatusFilter("all")
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Documents List */}
        {!isPending && !isLoadingEnvelope && filteredDocuments.length > 0 && (
          <DocumentListWithDisclosure
            documents={filteredDocuments}
            envelopeId={envelopeId}
            onFilteredCountChange={setTabFilteredCount}
          />
        )}
      </div>

      {/* Documents Count */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Results count */}
        {!isPending && !isLoadingEnvelope && (
          <div className="text-sm text-muted-foreground">
            {tabFilteredCount ?? filteredDocuments.length} of{" "}
            {documents?.filter((doc) => !doc.name.includes("_signed")).length ??
              0}{" "}
            documents
            {statusFilter !== "all" &&
              ` (filtered by ${statusFilter.toLowerCase()})`}
            {searchQuery && ` (matching "${searchQuery}")`}
          </div>
        )}
      </div>
    </div>
  )
}