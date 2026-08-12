"use client"

import { Download, Search } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"

interface AuditEventFiltersProps {
	searchQuery: string
	setSearchQuery: (query: string) => void
	selectedCategory: string
	setSelectedCategory: (category: string) => void
	selectedSeverity: string
	setSelectedSeverity: (severity: string) => void
	onExport?: () => void
}

export function AuditEventFilters({
	searchQuery,
	setSearchQuery,
	selectedCategory,
	setSelectedCategory,
	selectedSeverity,
	setSelectedSeverity,
	onExport
}: AuditEventFiltersProps) {
	return (
		<div className="flex flex-col gap-4 md:flex-row">
			<div className="relative flex-1">
				<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
				<Input
					placeholder="Search audit events..."
					className="pl-8 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>
			<Select value={selectedCategory} onValueChange={setSelectedCategory}>
				<SelectTrigger className="w-full md:w-[150px]">
					<SelectValue placeholder="Category" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Categories</SelectItem>
					<SelectItem value="envelope">Envelope</SelectItem>
					<SelectItem value="document">Document</SelectItem>
					<SelectItem value="recipient">Recipient</SelectItem>
					<SelectItem value="system">System</SelectItem>
				</SelectContent>
			</Select>
			<Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
				<SelectTrigger className="w-full md:w-[150px]">
					<SelectValue placeholder="Severity" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Severities</SelectItem>
					<SelectItem value="low">Low</SelectItem>
					<SelectItem value="medium">Medium</SelectItem>
					<SelectItem value="high">High</SelectItem>
					<SelectItem value="critical">Critical</SelectItem>
				</SelectContent>
			</Select>
			<Button variant="outline" onClick={onExport}>
				<Download className="mr-2 h-4 w-4" />
				Export
			</Button>
		</div>
	)
}
