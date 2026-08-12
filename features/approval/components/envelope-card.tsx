import {
	Building2,
	Calendar,
	CheckCircle,
	Clock,
	Eye,
	FileText,
	User,
	XCircle
} from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"

interface EnvelopeCardProps {
	envelope: {
		id: string
		title: string
		description?: string
		status: string
		createdAt: string
		createdBy: {
			name: string
			email: string
			role: string
			organization?: string
		}
		documents: Array<{
			id: string
			name: string
			recipients: Array<{
				status: string
			}>
		}>
	}
	onClick: () => void
}

const getStatusBadge = (status: string) => {
	switch (status) {
		case "COMPLETED":
			return (
				<Badge
					variant="outline"
					className="border-blue-200 bg-blue-50 text-blue-700"
				>
					<Clock className="mr-1 h-3 w-3" />
					Ready for Review
				</Badge>
			)
		case "PENDING_ADMIN_APPROVAL":
			return (
				<Badge
					variant="outline"
					className="border-yellow-200 bg-yellow-50 text-yellow-700"
				>
					<Clock className="mr-1 h-3 w-3" />
					Pending Approval
				</Badge>
			)
		case "APPROVED":
			return (
				<Badge
					variant="outline"
					className="border-green-200 bg-green-50 text-green-700"
				>
					<CheckCircle className="mr-1 h-3 w-3" />
					Approved
				</Badge>
			)
		case "REJECTED":
			return (
				<Badge
					variant="outline"
					className="border-red-200 bg-red-50 text-red-700"
				>
					<XCircle className="mr-1 h-3 w-3" />
					Rejected
				</Badge>
			)
		default:
			return <Badge variant="outline">{status}</Badge>
	}
}

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	})
}

export function EnvelopeCard({ envelope, onClick }: EnvelopeCardProps) {
	// Filter out signed documents to avoid duplication
	const originalDocuments = envelope.documents.filter(
		(doc) => !doc.name.includes("_signed.pdf")
	)

	const totalSignatures = originalDocuments.reduce(
		(acc, doc) =>
			acc + doc.recipients.filter((r) => r.status === "SIGNED").length,
		0
	)

	const handleCardClick = (e: React.MouseEvent) => {
		// Prevent card click when clicking action buttons
		if ((e.target as HTMLElement).closest(".action-button")) {
			return
		}
		onClick()
	}

	return (
		<Card
			className="cursor-pointer transition-shadow hover:shadow-md"
			onClick={handleCardClick}
		>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<CardTitle className="text-lg">{envelope.title}</CardTitle>
						{envelope.description && (
							<CardDescription>{envelope.description}</CardDescription>
						)}
					</div>
					<div className="flex items-center space-x-2">
						{getStatusBadge(envelope.status)}
						{envelope.status === "PENDING_APPROVAL" && (
							<Button
								size="sm"
								variant="default"
								className="action-button h-8 bg-blue-600 px-3 text-xs hover:bg-blue-700"
								onClick={(e) => {
									e.stopPropagation()
									onClick()
								}}
							>
								<Eye className="mr-1 h-3 w-3" />
								Review
							</Button>
						)}
						{(envelope.status === "APPROVED" ||
							envelope.status === "REJECTED") && (
							<Button
								size="sm"
								variant="outline"
								className="action-button h-8 px-3 text-xs"
								onClick={(e) => {
									e.stopPropagation()
									onClick()
								}}
							>
								<Eye className="mr-1 h-3 w-3" />
								Details
							</Button>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<div className="flex items-center space-x-2 text-sm text-muted-foreground">
							<User className="h-4 w-4" />
							<span>Created by: {envelope.createdBy.name}</span>
						</div>
						{envelope.createdBy.organization && (
							<div className="flex items-center space-x-2 text-sm text-muted-foreground">
								<Building2 className="h-4 w-4" />
								<span>{envelope.createdBy.organization}</span>
							</div>
						)}
						<div className="flex items-center space-x-2 text-sm text-muted-foreground">
							<Calendar className="h-4 w-4" />
							<span>Created: {formatDate(envelope.createdAt)}</span>
						</div>
					</div>
					<div className="space-y-2">
						<div className="flex items-center space-x-2 text-sm text-muted-foreground">
							<FileText className="h-4 w-4" />
							<span>{originalDocuments.length} document(s)</span>
						</div>
						<div className="flex items-center space-x-2 text-sm text-muted-foreground">
							<CheckCircle className="h-4 w-4" />
							<span>{totalSignatures} signatures</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
