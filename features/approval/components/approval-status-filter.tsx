import { CheckCircle, Clock, Filter, XCircle } from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"

interface ApprovalStatusFilterProps {
	activeStatus: string | null
	onStatusChange: (status: string | null) => void
	counts: {
		all: number
		pending: number
		approved: number
		rejected: number
	}
}

export function ApprovalStatusFilter({
	activeStatus,
	onStatusChange,
	counts
}: ApprovalStatusFilterProps) {
	const filters = [
		{
			key: null,
			label: "All",
			count: counts.all,
			icon: Filter,
			variant: "outline" as const
		},
		{
			key: "COMPLETED",
			label: "Pending",
			count: counts.pending,
			icon: Clock,
			variant: "outline" as const,
			className: "text-yellow-700 border-yellow-200"
		},
		{
			key: "APPROVED",
			label: "Approved",
			count: counts.approved,
			icon: CheckCircle,
			variant: "outline" as const,
			className: "text-green-700 border-green-200"
		},
		{
			key: "REJECTED",
			label: "Rejected",
			count: counts.rejected,
			icon: XCircle,
			variant: "outline" as const,
			className: "text-red-700 border-red-200"
		}
	]

	return (
		<div className="flex flex-wrap gap-2">
			{filters.map((filter) => {
				const Icon = filter.icon
				const isActive = activeStatus === filter.key

				return (
					<Button
						key={filter.key ?? "all"}
						variant={isActive ? "default" : "outline"}
						size="sm"
						onClick={() => onStatusChange(filter.key)}
						className={!isActive && filter.className ? filter.className : ""}
					>
						<Icon className="mr-2 h-4 w-4" />
						{filter.label}
						<Badge variant="secondary" className="ml-2 text-xs">
							{filter.count}
						</Badge>
					</Button>
				)
			})}
		</div>
	)
}
