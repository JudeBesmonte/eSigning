import { useEffect, useState } from "react"
import { format, isThisMonth } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight, FileText } from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"

import type { Document, Envelope, Month } from "../types"
import { DocumentsView } from "./documents-view"
import { EnvelopesView } from "./envelopes-view"

type MonthsViewProps = {
	months: Month[]
	onEnvelopeClick?: (envelopeId: string) => void
}

export function MonthsView({ months, onEnvelopeClick }: MonthsViewProps) {
	// State hooks - must be called unconditionally at the top level
	const [selectedMonth, setSelectedMonth] = useState<Month | null>(null)
	const [selectedEnvelope, setSelectedEnvelope] = useState<Envelope | null>(
		null
	)
	const selectedEnvelopeId = selectedEnvelope?.id
	const [hasMonths, setHasMonths] = useState(!!(months && months.length > 0))

	// Effect hooks - must be called unconditionally at the top level
	useEffect(() => {
		setHasMonths(!!(months && months.length > 0))
	}, [months])

	// Update selectedEnvelope when selectedMonth changes
	useEffect(() => {
		// Only proceed if we have a selected month with envelopes and a selected envelope
		if (!selectedMonth?.envelopes?.length || !selectedEnvelope) {
			return
		}

		// Find the current envelope in the selected month
		const currentEnvelope = selectedMonth.envelopes.find(
			(env) => env.id === selectedEnvelope.id
		)

		// If envelope is not found, clear the selection
		if (!currentEnvelope) {
			setSelectedEnvelope(null)
			return
		}

		// Check if any relevant fields have changed
		const hasChanged =
			currentEnvelope.title !== selectedEnvelope.title ||
			currentEnvelope.documentCount !== selectedEnvelope.documentCount ||
			currentEnvelope.createdAt?.getTime() !==
				selectedEnvelope.createdAt.getTime()

		// Only update if something actually changed
		if (hasChanged) {
			setSelectedEnvelope(currentEnvelope)
		}
	}, [selectedMonth, selectedEnvelope]) // Include all dependencies used in the effect

	// Handle empty state
	const renderEmptyState = () => (
		<div className="py-12 text-center">
			<p className="text-muted-foreground">
				No months with notary activity found
			</p>
		</div>
	)

	// Return early if no months after all hooks
	if (!hasMonths) {
		return renderEmptyState()
	}

	const formatMonthYear = (year: number, month: number) => {
		const date = new Date(year, month - 1, 1)
		return format(date, "MMMM yyyy")
	}

	const handleMonthClick = (month: Month) => {
		setSelectedMonth(month)
		setSelectedEnvelope(null)
	}

	const handleBackClick = () => {
		if (selectedEnvelope) {
			// If we have a selected envelope, just clear that to go back to envelopes list
			setSelectedEnvelope(null)
		} else {
			// If no envelope is selected, go back to months list
			setSelectedMonth(null)
			setSelectedEnvelope(null)
		}
	}

	// Handle going back to envelopes list from document view
	const handleBackToEnvelopes = () => {
		setSelectedEnvelope(null)
	}

	// Handle when an envelope is clicked from the EnvelopesView
	const handleEnvelopeIdClick = (envelopeId: string) => {
		// Find the full envelope from the selected month
		const envelope = selectedMonth?.envelopes?.find(
			(env) => env.id === envelopeId
		)

		if (envelope) {
			setSelectedEnvelope(envelope)
		} else {
			setSelectedEnvelope(null)
		}

		if (onEnvelopeClick) {
			onEnvelopeClick(envelopeId)
		}
	}

	const formatDate = (date: Date) => {
		return format(new Date(date), "MMM d, yyyy")
	}

	if (selectedMonth) {
		const monthYear = formatMonthYear(selectedMonth.year, selectedMonth.month)

		// If an envelope is selected, show its documents
		if (selectedEnvelope) {
			const selectedEnvelopeData = selectedMonth.envelopes?.find(
				(e: Envelope) => e.id === selectedEnvelope.id
			)
			const documents: Document[] = (selectedEnvelopeData?.documents?.map(
				(doc) => ({
					...doc,
					// Ensure required fields are present with default values if missing
					status: doc.status || "pending",
					date: doc.date || new Date().toISOString(),
					notarized: doc.notarized || false,
					size: doc.size || 0
				})
			) ?? []) as Document[]
			const documentCount = documents.length

			return (
				<div className="space-y-4">
					<div className="mb-6 flex items-start justify-between">
						<div>
							<h2 className="text-2xl font-semibold">
								Documents in {selectedEnvelope.title}
							</h2>
							<p className="text-sm text-muted-foreground">
								{documentCount} document{documentCount !== 1 ? "s" : ""} •
								Created on {formatDate(selectedEnvelope.createdAt)}
							</p>
						</div>
						<Button
							variant="ghost"
							onClick={handleBackToEnvelopes}
							className="text-muted-foreground hover:text-foreground"
						>
							<ChevronLeft className="mr-1 h-4 w-4" />
							Back to Envelopes
						</Button>
					</div>

					<DocumentsView
						documents={documents}
						onDocumentClick={(documentId: string) => {
							// Handle document click if needed
							console.log("Document clicked:", documentId)
						}}
					/>
				</div>
			)
		}

		// Otherwise show the list of envelopes
		return (
			<div className="space-y-4">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-semibold">{monthYear}</h2>
						<p className="text-sm text-muted-foreground">
							{selectedMonth.envelopes?.length ?? 0} envelope
							{selectedMonth.envelopes?.length !== 1 ? "s" : ""}
						</p>
					</div>
					<Button
						variant="ghost"
						onClick={handleBackClick}
						className="text-muted-foreground hover:text-foreground"
					>
						<ChevronLeft className="mr-1 h-4 w-4" />
						Back to all months
					</Button>
				</div>

				<div className="grid gap-4">
					{selectedMonth.envelopes && selectedMonth.envelopes.length > 0 ? (
						<EnvelopesView
							envelopes={selectedMonth.envelopes}
							onEnvelopeClick={handleEnvelopeIdClick}
							selectedEnvelopeId={selectedEnvelopeId}
						/>
					) : (
						<div className="py-8 text-center text-muted-foreground">
							No envelopes found for this month
						</div>
					)}
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="grid gap-4">
				{months.map((month) => {
					const monthDate = new Date(month.year, month.month - 1, 1)
					const isCurrentMonth = isThisMonth(monthDate)
					const monthName = format(monthDate, "MMMM yyyy")

					return (
						<Card
							key={`${month.year}-${month.month}`}
							className="cursor-pointer transition-shadow hover:shadow-md"
							onClick={() => handleMonthClick(month)}
						>
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">{monthName}</CardTitle>
									{isCurrentMonth && (
										<Badge variant="outline" className="text-xs">
											Current
										</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent>
								<div className="flex items-center justify-between">
									<div className="flex items-center text-muted-foreground">
										<FileText className="mr-2 h-4 w-4" />
										{month.envelopeCount} envelope
										{month.envelopeCount !== 1 ? "s" : ""}
									</div>
									<Button variant="ghost" size="sm" className="h-8 px-2">
										View
										<ChevronRight className="ml-1 h-4 w-4" />
									</Button>
								</div>
							</CardContent>
						</Card>
					)
				})}
			</div>

			{months.length === 0 && (
				<div className="rounded-lg border-2 border-dashed py-12 text-center">
					<Calendar className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
					<h3 className="text-lg font-medium">No months found</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						There are no months with notary activity to display.
					</p>
				</div>
			)}
		</div>
	)
}
