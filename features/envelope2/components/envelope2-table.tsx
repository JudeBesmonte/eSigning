"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import {
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	FileText,
	Loader2,
	MoreHorizontal,
	Search
} from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/core/components/ui/dropdown-menu"
import { Input } from "@/core/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"
import { Skeleton } from "@/core/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/core/components/ui/table"

import { trpc } from "@/services/trpc/client"

import { statusVariantMap } from "../types/envelope"

// Define the envelope type based on what the router returns
interface Envelope {
	id: string
	title: string
	description: string | null
	status: string
	createdAt: Date
	updatedAt: Date
	documents: Array<{
		id: string
		name: string
		type: string
		size: number
		createdAt: Date
		path: string
	}>
	recipient: Array<{
		id: string
		role: string
		status: string
		user: {
			id: string
			name: string | null
			email: string | null
			image: string | null
		} | null
	}>
}

type SortField = "title" | "status" | "createdAt" | "updatedAt" | "documents"
type SortDirection = "asc" | "desc"

interface SortConfig {
	field: SortField
	direction: SortDirection
}

interface EnvelopeTableProps {
	isAdmin?: boolean
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => {
			clearTimeout(timer)
		}
	}, [value, delay])

	return debouncedValue
}

export function EnvelopeTable({
	isAdmin: _isAdmin = false
}: EnvelopeTableProps) {
	const router = useRouter()
	const [searchQuery, setSearchQuery] = useState<string>("")
	const debouncedSearchQuery = useDebounce(searchQuery, 500) // Increased debounce time to 500ms
	const [currentPage, setCurrentPage] = useState(1)
	const [rowsPerPage, setRowsPerPage] = useState(5)
	const [isInitialLoad, setIsInitialLoad] = useState(true)
	const [sortConfig, setSortConfig] = useState<SortConfig>({
		field: "createdAt",
		direction: "desc"
	})

	const {
		data: envelopesResponse,
		isLoading,
		isFetching,
		error
	} = trpc.envelope2.getLocalEnvelopes.useQuery(
		{
			page: currentPage,
			limit: rowsPerPage,
			search: debouncedSearchQuery || undefined
		},
		{
			refetchOnWindowFocus: false,
			// Using placeholderData instead of keepPreviousData for tRPC
			placeholderData: (previousData) => previousData,
			// Prevent refetching when component remounts with same parameters
			staleTime: 1000 * 60 * 5 // 5 minutes
		}
	)

	// Handle page change
	const handlePreviousPage = () => {
		if (currentPage > 1) setCurrentPage(currentPage - 1)
	}

	const handleNextPage = () => {
		if (currentPage < totalPages) {
			setCurrentPage(currentPage + 1)
		}
	}

	// Only reset to page 1 on search query change, not on initial load
	useEffect(() => {
		if (!isInitialLoad) {
			setCurrentPage(1)
		} else {
			setIsInitialLoad(false)
		}
		// Add isInitialLoad to the dependency array to fix the React Hook warning
	}, [debouncedSearchQuery, isInitialLoad])

	const paginatedEnvelopes = useMemo<Envelope[]>(() => {
		if (!envelopesResponse?.data || !Array.isArray(envelopesResponse.data)) {
			return []
		}
		// Type assertion since we know from the router that data is Envelope[]
		return envelopesResponse.data as Envelope[]
	}, [envelopesResponse])

	// Sort envelopes client-side
	const sortedEnvelopes = useMemo((): Envelope[] => {
		if (!paginatedEnvelopes.length) return []

		return [...paginatedEnvelopes].sort((a, b) => {
			let aValue: string | number | Date | undefined
			let bValue: string | number | Date | undefined

			switch (sortConfig.field) {
				case "title":
					aValue = a.title?.toLowerCase() ?? ""
					bValue = b.title?.toLowerCase() ?? ""
					break
				case "status":
					aValue = a.status?.toLowerCase() ?? ""
					bValue = b.status?.toLowerCase() ?? ""
					break
				case "documents":
					aValue = a.documents?.length ?? 0
					bValue = b.documents?.length ?? 0
					break
				case "createdAt":
					aValue = new Date(a.createdAt).getTime()
					bValue = new Date(b.createdAt).getTime()
					break
				case "updatedAt":
					aValue = new Date(a.updatedAt).getTime()
					bValue = new Date(b.updatedAt).getTime()
					break
				default:
					return 0
			}

			if (aValue < bValue) {
				return sortConfig.direction === "asc" ? -1 : 1
			}
			if (aValue > bValue) {
				return sortConfig.direction === "asc" ? 1 : -1
			}
			return 0
		})
	}, [paginatedEnvelopes, sortConfig])

	// Type assertions for response fields that we know exist from router
	const totalItems = (envelopesResponse?.total as number) ?? 0
	const currentPageNum = (envelopesResponse?.page as number) ?? 1
	const totalPages = (envelopesResponse?.totalPages as number) ?? 1

	const requestSort = useCallback(
		(field: SortField) => {
			const direction = sortConfig.direction === "asc" ? "desc" : "asc"
			setSortConfig({ field, direction })
		},
		[sortConfig]
	)

	if (isLoading && !envelopesResponse) {
		return <EnvelopeTableSkeleton />
	}

	if (error) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-destructive">
					Error loading envelopes. Please try again.
				</div>
			</div>
		)
	}

	// Show empty state if no results after search
	if (searchQuery && totalItems === 0) {
		return (
			<div className="space-y-6">
				<div className="mx-4 rounded-lg border bg-card p-8 text-center">
					<FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="text-lg font-medium">No envelopes found</h3>
					<p className="text-muted-foreground">
						No results found for &quot;{searchQuery}&quot;. Try a different
						search term.
					</p>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => {
							setSearchQuery("")
							setCurrentPage(1)
						}}
					>
						Clear search
					</Button>
				</div>
			</div>
		)
	}

	// Show empty state if no envelopes exist at all
	if (totalItems === 0) {
		return (
			<div className="space-y-6">
				<div className="mx-4 rounded-lg border bg-card p-8 text-center">
					<FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="text-lg font-medium">No envelopes yet</h3>
					<p className="text-muted-foreground">
						Create your first envelope to get started.
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Wrapped title and table in a bordered container */}
			<div className="mx-4 rounded-lg border bg-card">
				{/* Title section with padding */}
				<div className="p-6">
					<h1 className="text-2xl font-bold tracking-tight">Envelopes</h1>
					<p className="text-muted-foreground">
						Manage your envelopes and track their status.
					</p>
				</div>

				{/* Inner bordered container for search and table */}
				<div className="mx-4 my-4 rounded-lg border">
					{/* Search bar */}
					<div className="border-b p-4 px-6">
						<div className="relative max-w-md">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<Search className="h-4 w-4 text-muted-foreground" />
							</div>
							<Input
								type="search"
								placeholder="Search envelopes..."
								className="pl-9"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
					</div>

					{/* Table */}
					<Table>
						<TableHeader className="bg-muted/50">
							<TableRow className="hover:bg-transparent">
								<TableHead className="px-6">
									<button
										type="button"
										onClick={() => requestSort("title")}
										className="flex items-center font-medium hover:text-primary"
									>
										Title
										<ArrowUpDown className="ml-2 h-4 w-4" />
									</button>
								</TableHead>
								<TableHead className="px-4">
									<button
										type="button"
										onClick={() => requestSort("status")}
										className="flex items-center font-medium hover:text-primary"
									>
										Status
										<ArrowUpDown className="ml-2 h-4 w-4" />
									</button>
								</TableHead>
								<TableHead className="px-4">
									<button
										type="button"
										onClick={() => requestSort("documents")}
										className="flex items-center font-medium hover:text-primary"
									>
										Documents
										<ArrowUpDown className="ml-2 h-4 w-4" />
									</button>
								</TableHead>
								<TableHead className="px-4">
									<button
										type="button"
										onClick={() => requestSort("createdAt")}
										className="flex items-center font-medium hover:text-primary"
									>
										Created
										<ArrowUpDown className="ml-2 h-4 w-4" />
									</button>
								</TableHead>
								<TableHead className="px-4">
									<button
										type="button"
										onClick={() => requestSort("updatedAt")}
										className="flex items-center font-medium hover:text-primary"
									>
										Last Updated
										<ArrowUpDown className="ml-2 h-4 w-4" />
									</button>
								</TableHead>
								<TableHead className="px-6 text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isFetching ? (
								<TableRow>
									<TableCell colSpan={6} className="h-24 text-center">
										<div className="flex items-center justify-center">
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Loading...
										</div>
									</TableCell>
								</TableRow>
							) : sortedEnvelopes.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="h-24 text-center">
										<div className="flex flex-col items-center justify-center py-8">
											<FileText className="mb-2 h-10 w-10 text-muted-foreground" />
											<p className="text-muted-foreground">
												No envelopes found
											</p>
											<p className="text-sm text-muted-foreground">
												Try adjusting your search criteria
											</p>
										</div>
									</TableCell>
								</TableRow>
							) : (
								sortedEnvelopes.map((envelope) => (
									<TableRow
										key={envelope.id}
										className="cursor-pointer border-b hover:bg-muted/50"
										onClick={() =>
											router.push(`/dashboard/envelope2/${envelope.id}`)
										}
									>
										<TableCell className="px-6 font-medium">
											<div className="flex items-center gap-3">
												<div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
													<span className="text-sm font-medium text-primary">
														{envelope.title.charAt(0).toUpperCase()}
													</span>
												</div>
												<div>
													<div className="font-medium">{envelope.title}</div>
													<div className="line-clamp-1 text-sm text-muted-foreground">
														{envelope.description ?? "No description"}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell className="px-4">
											<Badge
												variant={
													envelope.status in statusVariantMap
														? statusVariantMap[
																envelope.status as keyof typeof statusVariantMap
															]
														: "outline"
												}
											>
												{envelope.status.replace(/_/g, " ")}
											</Badge>
										</TableCell>
										<TableCell className="px-4">
											<div className="flex -space-x-2">
												{envelope.documents?.slice(0, 3).map((doc, i) => (
													<div
														key={doc.id}
														className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium"
														style={{ zIndex: 3 - i }}
													>
														{doc.name.charAt(0).toUpperCase()}
													</div>
												))}
											</div>
										</TableCell>
										<TableCell className="px-4">
											{format(new Date(envelope.createdAt), "MMM d, yyyy")}
										</TableCell>
										<TableCell className="px-4">
											{format(new Date(envelope.updatedAt), "MMM d, yyyy")}
										</TableCell>
										<TableCell className="px-6 text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" className="h-8 w-8 p-0">
														<span className="sr-only">Open menu</span>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={(e) => {
															e.stopPropagation()
															router.push(`/dashboard/envelope2/${envelope.id}`)
														}}
													>
														View Details
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>

				{/* Pagination */}
				<div className="flex flex-col items-center justify-between space-y-4 px-6 py-4 sm:flex-row sm:space-y-0">
					<div className="text-sm text-muted-foreground">
						Showing{" "}
						<span className="font-medium">
							{(currentPageNum - 1) * rowsPerPage + 1}
						</span>{" "}
						to{" "}
						<span className="font-medium">
							{Math.min(currentPageNum * rowsPerPage, totalItems)}
						</span>{" "}
						of <span className="font-medium">{totalItems}</span> envelopes
					</div>

					<div className="flex items-center space-x-2">
						<div className="flex items-center space-x-1">
							<span className="text-sm text-muted-foreground">
								Rows per page:
							</span>
							<Select
								value={rowsPerPage.toString()}
								onValueChange={(value) => {
									const newRowsPerPage = parseInt(value, 10)
									setRowsPerPage(newRowsPerPage)
									setCurrentPage(1)
								}}
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
							<span className="font-medium">
								{envelopesResponse?.totalPages ?? 1}
							</span>
						</div>

						<div className="flex space-x-1">
							<Button
								variant="outline"
								size="icon"
								onClick={handlePreviousPage}
								disabled={currentPage === 1 || isFetching}
								className="h-8 w-8"
							>
								<ChevronLeft className="h-4 w-4" />
								<span className="sr-only">Previous page</span>
							</Button>
							<Button
								variant="outline"
								size="icon"
								onClick={handleNextPage}
								disabled={
									!envelopesResponse ||
									currentPage >= (envelopesResponse.totalPages ?? 0) ||
									isFetching
								}
								className="h-8 w-8"
							>
								<ChevronRight className="h-4 w-4" />
								<span className="sr-only">Next page</span>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

function EnvelopeTableSkeleton() {
	return (
		<div className="space-y-6 px-4">
			<div className="rounded-lg border">
				<div className="border-b p-6">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="mt-2 h-4 w-64" />
				</div>
				<div className="mx-4 my-4 rounded-lg border">
					<div className="border-b p-4 px-6">
						<div className="relative max-w-md">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<Search className="h-4 w-4 text-muted-foreground" />
							</div>
							<Skeleton className="h-9 w-full pl-9" />
						</div>
					</div>
					<div className="p-6">
						<div className="space-y-4">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="h-16 w-full rounded-md" />
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
