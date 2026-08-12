"use client"

import { format } from "date-fns"
import { ArrowLeft, FileText } from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"

import { type DocumentWithRelations } from "../api/document2.schema"

// import { useRouter } from "next/navigation"

interface DocumentDetailProps {
	document: DocumentWithRelations
	onBack: () => void
}

export function Document2Detail({ document, onBack }: DocumentDetailProps) {
	// const router = useRouter()

	const getStatusVariant = (status?: string) => {
		switch (status) {
			case "COMPLETED":
				return "default"
			case "IN_PROGRESS":
				return "default"
			case "DRAFT":
				return "secondary"
			case "PENDING":
				return "outline"
			case "REJECTED":
				return "destructive"
			case "ARCHIVED":
				return "outline"
			default:
				return "secondary"
		}
	}

	return (
		<div className="space-y-6 px-4 pb-8">
			<div className="flex items-center space-x-4">
				<Button variant="ghost" size="icon" onClick={onBack}>
					<ArrowLeft className="h-5 w-5" />
					<span className="sr-only">Back to documents</span>
				</Button>
				<h1 className="text-2xl font-bold tracking-tight">Document Details</h1>
			</div>

			<Card>
				<CardHeader className="border-b">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
								<FileText className="h-6 w-6 text-primary" />
							</div>
							<div>
								<CardTitle className="text-xl">
									{document.name ?? "Untitled Document"}
								</CardTitle>
								<div className="mt-1 flex items-center space-x-2">
									<Badge variant={getStatusVariant(document.envelope?.status)}>
										{document.envelope?.status?.replace(/_/g, " ") ??
											"NO STATUS"}
									</Badge>
									<span className="text-sm text-muted-foreground">
										{document.type || "N/A"}
									</span>
								</div>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-6">
					<div className="grid gap-6 md:grid-cols-2">
						<div className="space-y-4">
							<div>
								<h3 className="text-sm font-medium text-muted-foreground">
									File Name
								</h3>
								<p>{document.name || "N/A"}</p>
							</div>
							<div>
								<h3 className="text-sm font-medium text-muted-foreground">
									File Type
								</h3>
								<p>{document.type || "N/A"}</p>
							</div>
							<div>
								<h3 className="text-sm font-medium text-muted-foreground">
									File Size
								</h3>
								<p>
									{document.size
										? `${(document.size / 1024).toFixed(2)} KB`
										: "N/A"}
								</p>
							</div>
						</div>
						<div className="space-y-4">
							<div>
								<h3 className="text-sm font-medium text-muted-foreground">
									Created
								</h3>
								<p>
									{document.createdAt
										? format(new Date(document.createdAt), "PPpp")
										: "N/A"}
								</p>
							</div>
							<div>
								<h3 className="text-sm font-medium text-muted-foreground">
									Last Updated
								</h3>
								<p>
									{document.updatedAt
										? format(new Date(document.updatedAt), "PPpp")
										: "N/A"}
								</p>
							</div>
							{document.envelope?.title && (
								<div>
									<h3 className="text-sm font-medium text-muted-foreground">
										Envelope
									</h3>
									<p className="whitespace-pre-wrap">
										{document.envelope.title}
									</p>
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
