import React from "react"
import { History } from "lucide-react"

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"

import type { DocumentDetail } from "../api/use-document-detail"

interface DocumentHistoryProps {
	document: DocumentDetail
}

export const DocumentHistory: React.FC<DocumentHistoryProps> = ({
	document
}) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center space-x-2">
					<History className="h-5 w-5" />
					<span>Document History</span>
				</CardTitle>
				<CardDescription>
					Complete audit trail of document activities
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-8">
					{document.history.map((event, index) => (
						<div
							key={index}
							className="relative border-l border-gray-200 pb-8 pl-6 last:pb-0"
						>
							<div className="absolute left-0 top-0 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-blue-600 bg-blue-100"></div>
							<div>
								<p className="font-medium">{event.action}</p>
								<p className="text-sm text-gray-600">by {event.user}</p>
								<p className="mt-1 text-xs text-gray-500">{event.timestamp}</p>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
