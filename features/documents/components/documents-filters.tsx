import React from "react"
import { Filter, Search } from "lucide-react"

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"

interface DocumentsFiltersProps {
	searchTerm: string
	statusFilter: string
	onSearchChange: (value: string) => void
	onStatusChange: (value: string) => void
}

export const DocumentsFilters: React.FC<DocumentsFiltersProps> = ({
	searchTerm,
	statusFilter,
	onSearchChange,
	onStatusChange
}) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Filter Documents</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-4 md:flex-row">
					<div className="flex-1">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
							<Input
								placeholder="Search documents..."
								value={searchTerm}
								onChange={(e) => onSearchChange(e.target.value)}
								className="pl-10"
							/>
						</div>
					</div>
					<Select value={statusFilter} onValueChange={onStatusChange}>
						<SelectTrigger className="w-full md:w-48">
							<Filter className="mr-2 h-4 w-4" />
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="draft">Draft</SelectItem>
							<SelectItem value="pending">Pending</SelectItem>
							<SelectItem value="review">Under Review</SelectItem>
							<SelectItem value="completed">Completed</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardContent>
		</Card>
	)
}
