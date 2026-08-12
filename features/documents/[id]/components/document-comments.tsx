import React, { useState } from "react"
import { MessageSquare } from "lucide-react"

import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from "@/core/components/ui/avatar"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import { Separator } from "@/core/components/ui/separator"
import { Textarea } from "@/core/components/ui/textarea"

import type { DocumentDetail } from "../api/use-document-detail"

interface DocumentCommentsProps {
	document: DocumentDetail
	onAddComment: (comment: string) => void
	isAddingComment?: boolean
}

export const DocumentComments: React.FC<DocumentCommentsProps> = ({
	document,
	onAddComment,
	isAddingComment
}) => {
	const [comment, setComment] = useState("")

	const handleAddComment = () => {
		if (comment.trim()) {
			onAddComment(comment.trim())
			setComment("")
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center space-x-2">
					<MessageSquare className="h-5 w-5" />
					<span>Comments</span>
				</CardTitle>
				<CardDescription>
					Discussion and feedback about this document
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-6">
					{/* Filter history for comment events */}
					{document.history
						.filter((event) => event.action.startsWith("Comment:"))
						.map((comment, index) => (
							<div key={index} className="flex space-x-4">
								<Avatar className="h-10 w-10">
									<AvatarImage src="/placeholder.svg" />
									<AvatarFallback>
										{comment.user
											.split(" ")
											.map((n) => n[0])
											.join("")}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<h4 className="font-medium">{comment.user}</h4>
										<span className="text-xs text-gray-500">
											{comment.timestamp}
										</span>
									</div>
									<p className="mt-1">
										{comment.action.replace("Comment: ", "")}
									</p>
								</div>
							</div>
						))}

					{/* Show message if no comments */}
					{document.history.filter((event) =>
						event.action.startsWith("Comment:")
					).length === 0 && (
						<div className="py-8 text-center text-gray-500">
							No comments yet. Be the first to add a comment!
						</div>
					)}

					<Separator className="my-4" />

					<div className="flex space-x-4">
						<Avatar className="h-10 w-10">
							<AvatarImage src="/placeholder.svg" />
							<AvatarFallback>YO</AvatarFallback>
						</Avatar>
						<div className="flex-1 space-y-2">
							<Textarea
								placeholder="Add a comment..."
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								disabled={isAddingComment}
							/>
							<Button
								onClick={handleAddComment}
								disabled={!comment.trim() || isAddingComment}
							>
								{isAddingComment ? "Adding..." : "Add Comment"}
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
