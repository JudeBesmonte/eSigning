"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { type EnvelopeStatus } from "@prisma/client"
import { format } from "date-fns"

import { Button } from "@/core/components/ui/button"

import { trpc } from "@/services/trpc/client"

import { AuditEventsView } from "@/features/notary-book/components/audit-events-view"
import { MonthsView } from "@/features/notary-book/components/months-view"
import { NotaryBookLayout } from "@/features/notary-book/components/notary-book-layout"
import type { Document } from "@/features/notary-book/types"
import { RecipientRole, RecipientStatus } from "@/features/notary-book/types"

import Loading from "../notary-book/loading"

// Using the Document type from @/features/notary-book/types
type DocumentInfo = Omit<Document, "signers"> & {
	recipients?: Array<{
		id: string
		role: RecipientRole
		status: RecipientStatus
		user?: {
			id: string
			name: string | null
			email: string | null
		}
	}>
}

interface EnvelopeInfo {
	id: string
	title: string
	status: EnvelopeStatus
	createdAt: Date
	updatedAt: Date
	documentCount: number
	signedCount: number
	action: string
	documents: DocumentInfo[]
}

interface Month {
	id: string
	name: string
	year: number
	month: number
	envelopeCount: number
	envelopes: EnvelopeInfo[]
}

// Base interface for all notary book entries
interface BaseNotaryBookEntry {
	id: string
	title: string
	description: string | null
	entryType:
		| "ENVELOPE"
		| "AUDIT_EVENT"
		| "DOCUMENT"
		| "SIGNATURE"
		| "NOTARIZATION"
	entryDate: Date
	createdAt: Date
	updatedAt: Date
	metadata: Record<string, unknown> | null
	createdBy: {
		id: string
		name: string | null
		email: string | null
	}
	envelope: {
		id: string
		status: EnvelopeStatus
		title: string
		description: string | null
		createdAt: Date
		updatedAt: Date
		userId: string
	} | null
	auditEvent: {
		id: string
		eventType: string
		timestamp: Date
		metadata: Record<string, unknown> | null
		envelopeId: string | null
		documentId: string | null
		description: string
		userId: string
		recipientId: string | null
	} | null
}

// Specific entry types
interface EnvelopeEntry extends BaseNotaryBookEntry {
	entryType: "ENVELOPE"
	envelope: NonNullable<BaseNotaryBookEntry["envelope"]>
	auditEvent: null
}

interface AuditEventEntry extends BaseNotaryBookEntry {
	entryType: "AUDIT_EVENT"
	auditEvent: NonNullable<BaseNotaryBookEntry["auditEvent"]>
	envelope: null
}

interface DocumentEntry
	extends Omit<BaseNotaryBookEntry, "entryType" | "metadata"> {
	entryType: "DOCUMENT"
	metadata: NonNullable<BaseNotaryBookEntry["metadata"]> & {
		type?: string
		size?: number
		status?: string
		notarized?: boolean
	}
	envelope: null
	auditEvent: {
		id: string
		eventType: string
		timestamp: Date
		metadata: Record<string, unknown> | null
		envelopeId: string | null
		documentId: string | null
		description: string
		userId: string
		recipientId: string | null
	} | null
}

type NotaryBookEntry = EnvelopeEntry | AuditEventEntry | DocumentEntry

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type NotaryBookResponse = {
	entries: NotaryBookEntry[]
	nextCursor: string | null
	total: number
}

function NotaryBookPage() {
	// Fetch notary book entries with infinite query for pagination
	const utils = trpc.useContext()

	const { data, isLoading, error, refetch } =
		trpc.notaryBook.getNotaryBookEntries.useInfiniteQuery(
			{
				limit: 50
			},
			{
				getNextPageParam: (lastPage) => lastPage.nextCursor,
				refetchOnWindowFocus: false,
				refetchOnMount: true,
				refetchOnReconnect: true
			}
		)

	// Track last update time to prevent rapid refetches
	const lastUpdateRef = useRef<number>(0)

	// Subscribe to real-time updates
	trpc.notaryBook.onUpdate.useSubscription(undefined, {
		onData: () => {
			const now = Date.now()
			// Only refetch if last update was more than 5 seconds ago and we're not currently syncing
			if (now - lastUpdateRef.current > 5000 && !isSyncing) {
				lastUpdateRef.current = now
				// Invalidate the query to trigger a refetch when updates are received
				void utils.notaryBook.getNotaryBookEntries.invalidate()
			}
		},
		onError: (err) => {
			console.error("Subscription error:", err)
		}
	})

	// Manually trigger an update
	const triggerUpdate = trpc.notaryBook.triggerUpdate.useMutation()

	// Sync notary book data
	const syncNotaryBook = trpc.notaryBook.syncNotaryBook.useMutation({
		onSuccess: async () => {
			try {
				// Invalidate and refetch the data
				await utils.notaryBook.getNotaryBookEntries.invalidate()
				await refetch()

				// Also trigger an update to notify other clients
				await triggerUpdate.mutateAsync()
			} catch (error) {
				console.error("Failed to refetch notary book:", error)
			}
		},
		onError: (error) => {
			console.error("Failed to sync notary book:", error.message)
		}
	})

	// Memoize the sync function to prevent unnecessary re-renders
	const handleSyncNotaryBook = useCallback(async () => {
		try {
			await syncNotaryBook.mutateAsync(undefined) // Use mutateAsync from the mutation object
		} catch (error) {
			if (error instanceof Error) {
				console.error("Sync failed:", error.message)
			} else {
				console.error("An unknown error occurred during sync")
			}
		}
	}, [syncNotaryBook])

	// Track if sync is in progress to prevent multiple syncs
	const [isSyncing, setIsSyncing] = useState(false)

	// Initial sync when component mounts
	useEffect(() => {
		const syncData = async () => {
			if (!isSyncing) {
				setIsSyncing(true)
				try {
					await handleSyncNotaryBook()
				} catch (error) {
					console.error("Sync error:", error)
				} finally {
					setIsSyncing(false)
				}
			}
		}

		// Only run sync on initial mount
		const timer = setTimeout(() => {
			// Only sync if we don't have any data yet
			if (
				!data?.pages?.[0]?.entries ||
				!Array.isArray(data.pages[0].entries) ||
				data.pages[0].entries.length === 0
			) {
				void syncData()
			}
		}, 1000) // Small delay to allow initial render

		return () => clearTimeout(timer)
	}, [handleSyncNotaryBook, isSyncing, data])

	if (isLoading) {
		return <Loading />
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center p-8">
				<div className="mb-4 text-destructive">
					Error loading notary book data
				</div>
				<Button variant="outline" onClick={() => refetch()}>
					Retry
				</Button>
			</div>
		)
	}

	if (!data) {
		return (
			<div className="flex flex-col items-center justify-center p-8">
				<div className="mb-4 text-muted-foreground">
					No notary book data available
				</div>
				<Button variant="outline" onClick={() => refetch()}>
					Refresh
				</Button>
			</div>
		)
	}

	// Process the data from the API response
	const entries = data.pages.flatMap(
		(page) =>
			(page as unknown as { entries: NotaryBookEntry[] }).entries || page
	)

	// Type guard function for AuditEventEntry
	const isAuditEventEntry = (
		entry: NotaryBookEntry
	): entry is AuditEventEntry => {
		return entry.entryType === "AUDIT_EVENT" && entry.auditEvent !== null
	}

	// Extract audit events with proper type checking and include required fields
	const auditEvents = entries.filter(isAuditEventEntry).map((entry) => {
		const auditEvent = entry.auditEvent
		const metadata = auditEvent.metadata

		// Ensure status is one of the allowed values
		const getStatus = ():
			| "success"
			| "failed"
			| "warning"
			| "info"
			| "pending" => {
			const statusValue = metadata?.status
			if (
				statusValue === "success" ||
				statusValue === "failed" ||
				statusValue === "warning" ||
				statusValue === "info" ||
				statusValue === "pending"
			) {
				return statusValue
			}
			return "info"
		}

		const status = getStatus()

		const auditEventData = {
			id: auditEvent.id,
			eventType: auditEvent.eventType,
			timestamp: auditEvent.timestamp.toISOString(),
			metadata: {
				documentId: auditEvent.documentId ?? null,
				envelopeId: auditEvent.envelopeId ?? null,
				recipientEmail: metadata?.recipientEmail as string | undefined,
				actionType: metadata?.actionType as string | undefined,
				...(metadata ?? {})
			},
			description: auditEvent.description,
			status,
			ipAddress: metadata?.ipAddress as string | null | undefined,
			userAgent: metadata?.userAgent as string | undefined,
			user: {
				id: auditEvent.userId,
				name: entry.createdBy?.name ?? "System",
				email: entry.createdBy?.email ?? null,
				role: metadata?.userRole as string | undefined,
				avatar: metadata?.userAvatar as string | undefined
			},
			// Keep these for backward compatibility
			userEmail: entry.createdBy?.email ?? null,
			userName: entry.createdBy?.name ?? "System",
			envelopeId: auditEvent.envelopeId ?? null,
			documentId: auditEvent.documentId ?? null,
			recipientId: auditEvent.recipientId ?? null
		}

		return auditEventData
	})

	// Process the data from the API response with proper type assertions
	const allEntries = data.pages.flatMap((page) => {
		try {
			// Safely cast the page to the expected shape
			const pageWithEntries = page as unknown as { entries?: unknown[] }
			const entries = Array.isArray(pageWithEntries.entries)
				? pageWithEntries.entries
				: []

			// Ensure we return properly typed entries
			return entries.length > 0
				? entries.filter(
						(e): e is NotaryBookEntry =>
							e !== null &&
							typeof e === "object" &&
							"entryType" in e &&
							(e.entryType === "ENVELOPE" ||
								e.entryType === "AUDIT_EVENT" ||
								e.entryType === "DOCUMENT") &&
							"metadata" in e &&
							typeof e.metadata === "object" &&
							e.metadata !== null
					)
				: []
		} catch (error) {
			console.error("Error processing page entries:", error)
			return []
		}
	})

	// Group entries by month for display
	const envelopesByMonth = new Map<string, EnvelopeEntry[]>()

	// First, group envelopes by month with proper type checking
	allEntries.forEach((entry) => {
		if (entry.entryType !== "ENVELOPE" || !entry.envelope) return

		const envelope = entry.envelope
		const date = new Date(envelope.createdAt)
		const year = date.getFullYear()
		const month = date.getMonth() + 1
		const key = `${year}-${month.toString().padStart(2, "0")}`

		const monthEnvelopes = envelopesByMonth.get(key) ?? []
		monthEnvelopes.push(entry)
		envelopesByMonth.set(key, monthEnvelopes)
	})

	// Get current date for reference
	const now = new Date()
	const currentYear = now.getFullYear()
	const currentMonth = now.getMonth() + 1 // 1-12

	// Find the earliest month with data
	let earliestYear = currentYear
	let earliestMonth = currentMonth

	for (const [key] of envelopesByMonth.entries()) {
		const [yearStr, monthStr] = key.split("-") as [string, string]
		const year = parseInt(yearStr, 10)
		const month = parseInt(monthStr, 10)

		if (
			year < earliestYear ||
			(year === earliestYear && month < earliestMonth)
		) {
			earliestYear = year
			earliestMonth = month
		}
	}

	// Generate all months from earliest to current
	const allMonths: { year: number; month: number; key: string }[] = []
	let currentYearIter = earliestYear
	let currentMonthIter = earliestMonth

	while (
		currentYearIter < currentYear ||
		(currentYearIter === currentYear && currentMonthIter <= currentMonth)
	) {
		allMonths.push({
			year: currentYearIter,
			month: currentMonthIter,
			key: `${currentYearIter}-${currentMonthIter.toString().padStart(2, "0")}`
		})

		// Move to next month
		currentMonthIter++
		if (currentMonthIter > 12) {
			currentMonthIter = 1
			currentYearIter++
		}
	}

	// Process each month's envelopes with proper type safety
	const monthData = allMonths
		.map(({ year, month, key }) => {
			const monthEnvelopes = envelopesByMonth.get(key) ?? []
			const date = new Date(year, month - 1)

			// Convert EnvelopeEntry[] to EnvelopeInfo[] with proper type safety
			const validEnvelopes = monthEnvelopes
				.filter((entry): entry is EnvelopeEntry => {
					return entry.entryType === "ENVELOPE" && !!entry.envelope
				})
				.map((entry) => {
					const env = entry.envelope

					// Create a default document for each envelope with required fields
					const defaultDocument: DocumentInfo = {
						id: `doc-${env.id}`,
						name: "Document",
						status: "pending",
						date: env.createdAt.toISOString(),
						size: 1024, // Default size in bytes
						notarized: false,
						// Add default signers/recipients if available
						recipients: [
							{
								id: `recipient-${env.userId ?? "1"}`,
								role: RecipientRole.SIGNER,
								status: RecipientStatus.PENDING,
								user: {
									id: env.userId ?? "1",
									name: "Signer",
									email: "signer@example.com"
								}
							}
						]
					}

					// Handle documents from the envelope if they exist
					const envelopeDocuments = (env as { documents?: Document[] })
						.documents
					const documents: DocumentInfo[] = envelopeDocuments?.length
						? envelopeDocuments.map((doc) => ({
								...doc,
								id: doc.id ?? `doc-${crypto.randomUUID()}`,
								name: doc.name ?? "Document",
								status: doc.status ?? "pending",
								date: doc.date ?? new Date().toISOString(),
								size: doc.size ?? 0,
								notarized: doc.notarized ?? false,
								recipients:
									(doc as DocumentInfo).recipients ?? defaultDocument.recipients
							}))
						: [defaultDocument]

					// Create the envelope info with proper typing
					return {
						id: env.id,
						title:
							typeof env.title === "string" ? env.title : "Untitled Envelope",
						status: env.status,
						createdAt: env.createdAt,
						updatedAt: env.updatedAt,
						documentCount: documents.length,
						signedCount: documents.filter((doc) => doc.status === "signed")
							.length,
						action: "",
						documents: documents
					}
				})
				.filter((env): env is EnvelopeInfo => env !== null)

			// Format the month name and determine if it's the current month
			const monthName = date.toLocaleString("default", { month: "long" })
			const isCurrentMonth = year === currentYear && month === currentMonth

			return {
				id: key,
				name: monthName,
				year,
				month,
				envelopeCount: validEnvelopes.length,
				envelopes: validEnvelopes,
				isCurrentMonth
			} satisfies Month & { isCurrentMonth: boolean }
		})
		.filter(
			(month): month is Month & { isCurrentMonth: boolean } => month !== null
		)
		.sort((a, b) => {
			// Always put current month first
			if (a.isCurrentMonth) return -1
			if (b.isCurrentMonth) return 1

			// Then sort by date descending (newest first)
			if (a.year !== b.year) return b.year - a.year
			return b.month - a.month
		})

	return (
		<NotaryBookLayout
			title="Notary Book"
			onSync={handleSyncNotaryBook}
			isSyncing={syncNotaryBook.isPending}
		>
			<div className="space-y-12">
				<MonthsView months={monthData} />
				<AuditEventsView events={auditEvents} />
			</div>
			{monthData.length > 0 && (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<span>
						Showing {monthData.length}{" "}
						{monthData.length === 1 ? "month" : "months"}
					</span>
					<span>•</span>
					<span>
						{monthData.reduce((total, month) => total + month.envelopeCount, 0)}
						{monthData.reduce(
							(total, month) => total + month.envelopeCount,
							0
						) === 1
							? "envelope"
							: "envelopes"}{" "}
						total
					</span>
					{monthData[0]?.envelopes?.[0] && (
						<>
							<span>•</span>
							<span>
								Last updated{" "}
								{format(
									new Date(
										monthData[0].envelopes[0].updatedAt ||
											monthData[0].envelopes[0].createdAt
									),
									"MMM d, yyyy"
								)}
							</span>
						</>
					)}
				</div>
			)}
		</NotaryBookLayout>
	)
}

export default function Page() {
	return (
		<Suspense fallback={<Loading />}>
			<NotaryBookPage />
		</Suspense>
	)
}
