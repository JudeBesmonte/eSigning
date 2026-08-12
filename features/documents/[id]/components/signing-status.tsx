import React from "react"
import { Clock, Send } from "lucide-react"

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

interface SigningStatusProps {
	document: DocumentDetail
	onSendReminders: () => void
	isSendingReminders?: boolean
}

export const SigningStatus: React.FC<SigningStatusProps> = ({
	document,
	onSendReminders,
	isSendingReminders
}) => {
	const signedCount = document.signers.filter(
		(s) => s.status === "signed"
	).length
	const totalSigners = document.signers.length
	const progressPercentage =
		totalSigners > 0 ? (signedCount / totalSigners) * 100 : 0

	return (
		<Card>
			<CardHeader>
				<CardTitle>Signing Status</CardTitle>
				<CardDescription>
					Track the progress of document signatures
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<Clock className="h-4 w-4 text-blue-600" />
							<span>Overall Progress</span>
						</div>
						<span>
							{signedCount} of {totalSigners} signatures (
							{Math.round(progressPercentage)}%)
						</span>
					</div>
					<div className="h-2.5 w-full rounded-full bg-gray-200">
						<div
							className="h-2.5 rounded-full bg-blue-600"
							style={{ width: `${progressPercentage}%` }}
						></div>
					</div>

					<div className="mt-6 space-y-4">
						{document.signers.map((signer, index) => (
							<div key={index} className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<Avatar className="h-8 w-8">
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
								<div className="flex items-center space-x-3">
									{signer.status === "signed" ? (
										<div className="flex items-center space-x-2">
											<Badge className="bg-green-100 text-green-800">
												Signed
											</Badge>
											<span className="text-sm text-gray-500">
												{signer.signedAt}
											</span>
										</div>
									) : (
										<Badge className="bg-orange-100 text-orange-800">
											Pending
										</Badge>
									)}
								</div>
							</div>
						))}
					</div>

					<Button
						variant="outline"
						className="mt-4"
						onClick={onSendReminders}
						disabled={isSendingReminders}
					>
						<Send className="mr-2 h-4 w-4" />
						{isSendingReminders ? "Sending..." : "Send Reminders"}
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
