import { useState } from "react"
import { AlertTriangle, CheckCircle, Eye, XCircle } from "lucide-react"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from "@/core/components/ui/alert-dialog"
import { Button } from "@/core/components/ui/button"

interface QuickActionsProps {
	envelopeId: string
	envelopeTitle: string
	onApprove: (envelopeId: string) => void
	onReject: (envelopeId: string) => void
	onViewDetails: () => void
}

export function QuickActions({
	envelopeId,
	envelopeTitle,
	onApprove,
	onReject,
	onViewDetails
}: QuickActionsProps) {
	const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
	const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)

	const handleApprove = () => {
		onApprove(envelopeId)
		setIsApproveDialogOpen(false)
	}

	const handleReject = () => {
		onReject(envelopeId)
		setIsRejectDialogOpen(false)
	}

	const handleAction = (
		action: "approve" | "reject" | "details",
		e: React.MouseEvent
	) => {
		e.stopPropagation()

		if (action === "approve") {
			setIsApproveDialogOpen(true)
		} else if (action === "reject") {
			setIsRejectDialogOpen(true)
		} else if (action === "details") {
			onViewDetails()
		}
	}

	return (
		<div className="quick-actions flex space-x-1">
			<AlertDialog
				open={isApproveDialogOpen}
				onOpenChange={setIsApproveDialogOpen}
			>
				<AlertDialogTrigger asChild>
					<Button
						size="sm"
						variant="outline"
						className="h-8 border-green-200 bg-green-50 px-2 text-xs text-green-700 hover:bg-green-100"
						onClick={(e) => handleAction("approve", e)}
					>
						<CheckCircle className="mr-1 h-3 w-3" />
						Approve
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center space-x-2">
							<CheckCircle className="h-5 w-5 text-green-600" />
							<span>Quick Approve Envelope</span>
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to approve {envelopeTitle}? This will
							approve the envelope without additional comments.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-green-600 hover:bg-green-700"
							onClick={handleApprove}
						>
							Quick Approve
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={isRejectDialogOpen}
				onOpenChange={setIsRejectDialogOpen}
			>
				<AlertDialogTrigger asChild>
					<Button
						size="sm"
						variant="outline"
						className="h-8 border-red-200 bg-red-50 px-2 text-xs text-red-700 hover:bg-red-100"
						onClick={(e) => handleAction("reject", e)}
					>
						<XCircle className="mr-1 h-3 w-3" />
						Reject
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center space-x-2">
							<AlertTriangle className="h-5 w-5 text-destructive" />
							<span>Quick Reject Envelope</span>
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to reject {envelopeTitle}? This will reject
							the envelope without additional comments. This action cannot be
							undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive hover:bg-destructive/90"
							onClick={handleReject}
						>
							Quick Reject
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Button
				size="sm"
				variant="outline"
				className="h-8 px-2 text-xs"
				onClick={(e) => handleAction("details", e)}
			>
				<Eye className="mr-1 h-3 w-3" />
				Details
			</Button>
		</div>
	)
}
