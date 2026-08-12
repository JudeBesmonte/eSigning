// import Link from "next/link"
import React from "react"

// import { Plus } from "lucide-react"

// import { Button } from "@/core/components/ui/button"

interface DocumentsHeaderProps {
	title?: string
	description?: string
	newDocumentUrl?: string
}

export const DocumentsHeader: React.FC<DocumentsHeaderProps> = ({
	title = "Documents",
	description = "Manage and track all your documents"
	// newDocumentUrl = "/dashboard/documents/new"
}) => {
	return (
		<div className="flex items-center justify-between">
			<div>
				<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
					{title}
				</h1>
				<p className="text-gray-600 dark:text-gray-400">{description}</p>
			</div>
			{/* <Button asChild>
				<Link href={newDocumentUrl}>
					<Plus className="mr-2 h-4 w-4" />
					New Document
				</Link>
			</Button> */}
		</div>
	)
}
