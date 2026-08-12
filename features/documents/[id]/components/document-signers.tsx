import React from "react"
import {
	AlertTriangle,
	CheckCircle,
	MoreHorizontal,
	Plus,
	Send
} from "lucide-react"

import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from "@/core/components/ui/avatar"
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"

import type { DocumentDetail } from "../api/use-document-detail"

interface DocumentSignersProps {
	document: DocumentDetail
	onSendReminders: () => void
	onAddSigner?: () => void
	isSendingReminders?: boolean
}

export const DocumentSigners: React.FC<DocumentSignersProps> = ({
	document,
	onSendReminders,
	onAddSigner,
	isSendingReminders
}) => {
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Document Signers</CardTitle>
					<CardDescription>
						People who need to sign this document
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						{document.signers.map((signer, index) => (
							<div
								key={index}
								className="flex flex-col justify-between rounded-lg border p-4 md:flex-row md:items-center"
							>
								<div className="flex items-center space-x-4">
									<Avatar className="h-10 w-10">
										<AvatarImage src={signer.avatar ?? "/placeholder.svg"} />
										<AvatarFallback>
											{signer.name
												.split(" ")
												.map((n) => n[0])
												.join("")}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="font-medium">{signer.name}</p>
										<p className="text-sm text-gray-500">{signer.email}</p>
									</div>
								</div>
								<div className="mt-4 flex items-center space-x-4 md:mt-0">
									{signer.status === "signed" ? (
										<div className="flex items-center space-x-2">
											<CheckCircle className="h-5 w-5 text-green-600" />
											<div>
												<Badge className="bg-green-100 text-green-800">
													Signed
												</Badge>
												<p className="mt-1 text-xs text-gray-500">
													on {signer.signedAt}
												</p>
											</div>
										</div>
									) : (
										<div className="flex items-center space-x-2">
											<AlertTriangle className="h-5 w-5 text-orange-600" />
											<div>
												<Badge className="bg-orange-100 text-orange-800">
													Pending
												</Badge>
												<p className="mt-1 text-xs text-gray-500">
													No activity yet
												</p>
											</div>
										</div>
									)}
									<Button variant="ghost" size="sm">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-between">
				<Button
					variant="outline"
					onClick={onSendReminders}
					disabled={isSendingReminders}
				>
					<Send className="mr-2 h-4 w-4" />
					{isSendingReminders ? "Sending..." : "Send Reminders"}
				</Button>
				<Button onClick={onAddSigner}>
					<Plus className="mr-2 h-4 w-4" />
					Add Signer
				</Button>
			</div>
		</div>
	)
}
