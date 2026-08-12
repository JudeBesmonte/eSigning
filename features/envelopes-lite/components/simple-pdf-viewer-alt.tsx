"use client"

import React, { useCallback, useState } from "react"
import {
	ChevronLeft,
	ChevronRight,
	RotateCw,
	ZoomIn,
	ZoomOut
} from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"

import { Button } from "@/core/components/ui/button"

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js"

interface SimplePdfViewerProps {
	fileUrl: string
	documentName: string
}

interface PdfViewerState {
	numPages: number
	pageNumber: number
	scale: number
	rotation: number
	error: string | null
}

const SCALE_LIMITS = {
	min: 0.5,
	max: 3.0,
	step: 0.25
} as const

export function SimplePdfViewer({
	fileUrl,
	documentName: _documentName
}: SimplePdfViewerProps) {
	const [state, setState] = useState<PdfViewerState>({
		numPages: 0,
		pageNumber: 1,
		// default to actual size (scale 1)
		scale: 1.0,
		rotation: 0,
		error: null
	})

	const onDocumentLoadSuccess = useCallback(
		({ numPages }: { numPages: number }) => {
			setState((prev) => ({ ...prev, numPages, error: null }))
		},
		[]
	)

	const onPageLoadSuccess = useCallback(() => {
		// Page loaded successfully - no action needed
	}, [])

	const onDocumentLoadError = useCallback((error: Error) => {
		console.error("PDF load error:", error)
		setState((prev) => ({ ...prev, error: "Failed to load PDF document" }))
	}, [])

	const changePage = useCallback((offset: number) => {
		setState((prev) => {
			const newPageNumber = prev.pageNumber + offset
			return {
				...prev,
				pageNumber: Math.min(Math.max(1, newPageNumber), prev.numPages)
			}
		})
	}, [])

	const changeScale = useCallback((newScale: number) => {
		setState((prev) => ({
			...prev,
			scale: Math.max(SCALE_LIMITS.min, Math.min(SCALE_LIMITS.max, newScale))
		}))
	}, [])

	const rotate = useCallback(() => {
		setState((prev) => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))
	}, [])

	// If no file URL, show empty state
	if (!fileUrl && !state.error) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div className="text-center">
					<p className="text-sm text-muted-foreground">
						No document to display
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="flex h-full flex-col overflow-hidden">
			{/* Toolbar */}
			<div className="flex shrink-0 items-center justify-between px-2 py-2">
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => changePage(-1)}
						disabled={state.pageNumber <= 1}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<span className="text-sm">
						Page {state.pageNumber} of {state.numPages || 1}
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => changePage(1)}
						disabled={state.pageNumber >= state.numPages}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => changeScale(state.scale - SCALE_LIMITS.step)}
						disabled={state.scale <= SCALE_LIMITS.min}
					>
						<ZoomOut className="h-4 w-4" />
					</Button>
					<span className="min-w-[60px] text-center text-sm">
						{Math.round(state.scale * 100)}%
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => changeScale(state.scale + SCALE_LIMITS.step)}
						disabled={state.scale >= SCALE_LIMITS.max}
					>
						<ZoomIn className="h-4 w-4" />
					</Button>
					<Button variant="outline" size="sm" onClick={rotate}>
						<RotateCw className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* PDF Content */}
			<div className="flex-1 overflow-auto py-4">
				<div className="mx-auto w-full max-w-7xl">
					<div className="flex min-h-[60vh] w-full items-center justify-center">
						<div className="flex flex-1 items-center justify-center">
							<Document
								file={fileUrl}
								onLoadSuccess={onDocumentLoadSuccess}
								onLoadError={onDocumentLoadError}
								loading={null}
								error={
									<div className="flex h-96 items-center justify-center">
										<div className="text-center">
											<p className="mb-4 text-sm text-destructive">
												Failed to load PDF document
											</p>
											<p className="mb-4 text-xs text-muted-foreground">
												{state.error ?? "Unknown error"}
											</p>
											<div className="space-y-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => window.open(fileUrl, "_blank")}
												>
													Open in New Tab
												</Button>
											</div>
										</div>
									</div>
								}
								className="w-auto"
							>
								<div className="relative inline-block w-auto">
									<Page
										pageNumber={state.pageNumber}
										scale={state.scale}
										rotate={state.rotation}
										renderTextLayer={false}
										renderAnnotationLayer={false}
										onLoadSuccess={onPageLoadSuccess}
										className="block"
										loading={null}
									/>
								</div>
							</Document>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
