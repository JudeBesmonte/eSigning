"use client"

import { useCallback, useMemo, useState } from "react"
import { format } from "date-fns"
import { MessageCircle, Send } from "lucide-react"
import { toast } from "sonner"

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from "@/core/components/tooltip"
import { Button } from "@/core/components/ui/button"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from "@/core/components/ui/sheet"
import { Textarea } from "@/core/components/ui/textarea"

import { trpc } from "@/services/trpc/client"

interface Comment {
	id: string
	author: string
	authorEmail: string
	message: string
	timestamp: Date
}

interface Document {
	id: string
	name: string
}

interface DocumentCommentsSheetProps {
	document: Document
	envelopeId: string
	trigger?: React.ReactNode
}
export function DocumentCommentsSheet({
	document,
	envelopeId,
	trigger
}: DocumentCommentsSheetProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [newComment, setNewComment] = useState("")

	// Fetch messages for this document/envelope
	const { data, isLoading, error } = trpc.messages.getMessages.useQuery(
		{
			documentId: document.id,
			envelopeId
		},
		{ enabled: isOpen }
	)

	// Live updates
	trpc.messages.subscribe.useSubscription(
		{ envelopeId, documentId: document.id },
		{
			enabled: isOpen,
			onData: () => {
				// Let React Query refetch; avoids client-side duplication logic
				void utils.messages.getMessages.invalidate({
					documentId: document.id,
					envelopeId
				})
			}
		}
	)

	const utils = trpc.useUtils()
	const sendMessage = trpc.messages.sendMessage.useMutation({
		onSuccess: async () => {
			setNewComment("")
			await utils.messages.getMessages.invalidate({
				documentId: document.id,
				envelopeId
			})
			toast.success("Comment added successfully!")
		},
		onError: (err) => {
			console.error(err)
			toast.error("Failed to add comment")
		}
	})

	const handleAddComment = useCallback(() => {
		if (!newComment.trim() || sendMessage.isPending) return
		sendMessage.mutate({
			content: newComment.trim(),
			messageType: "DOCUMENT",
			envelopeId,
			documentId: document.id
		})
	}, [document.id, envelopeId, newComment, sendMessage])

	const documentComments: Comment[] = useMemo(() => {
		const msgs = data?.messages ?? []
		return msgs.map((m) => ({
			id: m.id,
			author: m.sender.name ?? m.sender.email ?? "Unknown",
			authorEmail: m.sender.email ?? "",
			message: m.content,
			timestamp: new Date(m.createdAt)
		}))
	}, [data?.messages])

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			{trigger ? (
				<SheetTrigger asChild>{trigger}</SheetTrigger>
			) : (
				<Tooltip>
					<TooltipTrigger>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 rounded-none border-r hover:bg-muted"
							>
								<MessageCircle className="size-4" />
							</Button>
						</SheetTrigger>
					</TooltipTrigger>
					<TooltipContent>Comments</TooltipContent>
				</Tooltip>
			)}
			<SheetContent className="flex w-full flex-col sm:max-w-md">
				<SheetHeader>
					<SheetTitle>Comments</SheetTitle>
					<SheetDescription>Document: {document.name}</SheetDescription>
				</SheetHeader>

				{/* Comments List - This will take up available space */}
				<div className="flex-1 space-y-4 overflow-y-auto py-6">
					{isLoading && (
						<div className="flex h-32 items-center justify-center text-muted-foreground">
							<p className="text-sm">Loading comments…</p>
						</div>
					)}
					{error && (
						<div className="flex h-32 items-center justify-center text-red-600">
							<p className="text-sm">Failed to load comments</p>
						</div>
					)}
					{documentComments.length > 0 ? (
						documentComments.map((comment) => (
							<div
								key={comment.id}
								className="rounded-lg border bg-muted/50 p-3"
							>
								<div className="mb-2 flex items-center justify-between">
									<span className="text-sm font-medium">{comment.author}</span>
									<span className="text-xs text-muted-foreground">
										{format(comment.timestamp, "MMM d, h:mm a")}
									</span>
								</div>
								<p className="text-sm">{comment.message}</p>
							</div>
						))
					) : (
						<div className="flex h-32 items-center justify-center text-muted-foreground">
							<div className="text-center">
								<MessageCircle className="mx-auto mb-2 size-8 opacity-50" />
								<p className="text-sm">No comments yet</p>
							</div>
						</div>
					)}
				</div>

				{/* Add Comment Form - This will stay at the bottom */}
				<div className="space-y-3 border-t pt-4">
					<Textarea
						placeholder="Add a comment..."
						value={newComment}
						onChange={(e) => setNewComment(e.target.value)}
						rows={3}
						className="min-h-[80px] resize-none"
					/>
					<Button
						onClick={handleAddComment}
						disabled={!newComment.trim() || sendMessage.isPending}
						className="w-full"
					>
						<Send className="mr-2 size-4" />
						Add Comment
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	)
}
