import React from "react"
import { Copy, Edit, Lock, Printer } from "lucide-react"

import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from "@/core/components/ui/avatar"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import { Separator } from "@/core/components/ui/separator"

import type { DocumentDetail } from "../api/use-document-detail"

interface DocumentDetailsSidebarProps {
	document: DocumentDetail
	onEdit?: () => void
	onDuplicate?: () => void
	onSecure?: () => void
	onPrint?: () => void
}

export const DocumentDetailsSidebar: React.FC<DocumentDetailsSidebarProps> = ({
	document,
	onEdit,
	onDuplicate,
	onSecure,
	onPrint
}) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Document Details</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<h4 className="text-sm font-medium text-gray-500">Description</h4>
					<p className="mt-1">{document.description}</p>
				</div>

				<Separator />

				<div>
					<h4 className="text-sm font-medium text-gray-500">Created By</h4>
					<div className="mt-1 flex items-center space-x-2">
						<Avatar className="h-6 w-6">
							<AvatarImage
								src={document.creator.avatar ?? "/placeholder.svg"}
							/>
							<AvatarFallback>
								{document.creator.name
									.split(" ")
									.map((n) => n[0])
									.join("")}
							</AvatarFallback>
						</Avatar>
						<span>{document.creator.name}</span>
					</div>
				</div>

				<Separator />

				<div className="space-y-2">
					<div className="flex justify-between">
						<span className="text-sm text-gray-500">Document Type</span>
						<span>{document.type}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-sm text-gray-500">Created Date</span>
						<span>{document.created}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-sm text-gray-500">Last Updated</span>
						<span>{document.updated}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-sm text-gray-500">Due Date</span>
						<span className="font-medium text-orange-600">
							{document.dueDate}
						</span>
					</div>
				</div>

				<Separator />

				<div className="space-y-2">
					<h4 className="text-sm font-medium text-gray-500">Actions</h4>
					<div className="grid grid-cols-2 gap-2">
						<Button
							variant="outline"
							size="sm"
							className="justify-start"
							onClick={onEdit}
						>
							<Edit className="mr-2 h-4 w-4" />
							Edit
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="justify-start"
							onClick={onDuplicate}
						>
							<Copy className="mr-2 h-4 w-4" />
							Duplicate
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="justify-start"
							onClick={onSecure}
						>
							<Lock className="mr-2 h-4 w-4" />
							Secure
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="justify-start"
							onClick={onPrint}
						>
							<Printer className="mr-2 h-4 w-4" />
							Print
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
