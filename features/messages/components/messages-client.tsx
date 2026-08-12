"use client"

// Messages client component for real-time messaging
import { useEffect, useState } from "react"
import {
	MoreVertical,
	Paperclip,
	Plus,
	Search,
	Send,
	Shield
} from "lucide-react"
import { useSession } from "next-auth/react"

import { ClientOnly } from "@/core/components/client-only"
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
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import { Textarea } from "@/core/components/ui/textarea"

import { trpc } from "@/services/trpc/client"

import { UserSearch } from "@/features/to-sign/components/user-search"

interface MessagesClientProps {
	searchParams: Record<string, string | string[] | undefined>
}

interface Conversation {
	id: string
	name: string
	lastMessage: string
	timestamp: string
	unread: number
	avatar: string
	online: boolean
	envelopeId: string
	participants: string[]
	lastSender: string | null
}

interface Message {
	id: string
	senderId: string
	senderName: string
	content: string
	timestamp: string
	encrypted: boolean
}

export function MessagesClient({ searchParams }: MessagesClientProps) {
	const { data: session } = useSession()
	const [selectedConversation, setSelectedConversation] = useState<
		string | null
	>(null)
	const [newMessage, setNewMessage] = useState("")

	const [conversations, setConversations] = useState<Conversation[]>([])
	const [messages, setMessages] = useState<Message[]>([])
	const [messagesEndRef, setMessagesEndRef] = useState<HTMLDivElement | null>(
		null
	)
	const [unreadConversations, setUnreadConversations] = useState<Set<string>>(
		new Set()
	)

	const utils = trpc.useUtils()

	// Load read conversations from localStorage
	useEffect(() => {
		const readConversations = localStorage.getItem("readConversations")
		if (readConversations) {
			try {
				const readSet = new Set(JSON.parse(readConversations) as string[])
				setUnreadConversations((prev) => {
					const newSet = new Set(prev)
					// Remove conversations that are marked as read in localStorage
					readSet.forEach((conversationId: string) =>
						newSet.delete(conversationId)
					)
					return newSet
				})
			} catch (error) {
				console.error(
					"Error parsing read conversations from localStorage:",
					error
				)
			}
		}
	}, [])

	// Save read conversations to localStorage
	const markConversationAsRead = (envelopeId: string) => {
		setUnreadConversations((prev) => {
			const newSet = new Set(prev)
			newSet.delete(envelopeId)
			return newSet
		})

		// Save to localStorage
		try {
			const readConversations = localStorage.getItem("readConversations")
			const readSet = new Set(
				readConversations ? (JSON.parse(readConversations) as string[]) : []
			)
			readSet.add(envelopeId)
			localStorage.setItem(
				"readConversations",
				JSON.stringify(Array.from(readSet))
			)
		} catch (error) {
			console.error("Error saving read conversations to localStorage:", error)
		}
	}

	// Auto-scroll to bottom when new messages arrive
	const scrollToBottom = () => {
		messagesEndRef?.scrollIntoView({ behavior: "smooth" })
	}

	useEffect(() => {
		scrollToBottom()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [messages])

	// Mark conversation as read when selected
	const handleConversationSelect = (envelopeId: string) => {
		setSelectedConversation(envelopeId)
		// Mark as read using the new function
		markConversationAsRead(envelopeId)
		// Call the markAsRead mutation
		markAsReadMutation.mutate({ envelopeId })
	}

	// Ensure selected conversation is marked as read
	useEffect(() => {
		if (selectedConversation) {
			markConversationAsRead(selectedConversation)
		}
	}, [selectedConversation])

	// Get user's conversations (envelopes they're part of)
	const { data: userEnvelopes, refetch: refetchConversations } =
		trpc.messages.getUserConversations.useQuery(undefined, {
			enabled: !!session?.user?.id
		})

	// Get messages for selected conversation
	const { data: conversationMessages, refetch: refetchMessages } =
		trpc.messages.getMessages.useQuery(
			{
				envelopeId: selectedConversation ?? "",
				limit: 50,
				offset: 0
			},
			{
				enabled: !!selectedConversation
			}
		)

	// Subscribe to real-time messages - only when conversation is selected
	trpc.messages.subscribe.useSubscription(
		{
			envelopeId: selectedConversation ?? ""
		},
		{
			enabled: !!selectedConversation && selectedConversation !== "", // Only subscribe when a conversation is selected and not empty
			onData: () => {
				// Refetch messages when new message arrives
				if (selectedConversation) {
					void utils.messages.getMessages.invalidate({
						envelopeId: selectedConversation,
						limit: 50,
						offset: 0
					})
					// Also refetch conversations to update last message
					void utils.messages.getUserConversations.invalidate()
				}
			},
			onError: (error) => {
				console.error("❌ Subscription error:", error)
				// Don't show error to user, just log it
			}
		}
	)

	// Update conversations when envelopes data changes
	useEffect(() => {
		if (userEnvelopes?.envelopes) {
			const newConversations: Conversation[] = userEnvelopes.envelopes.map(
				(envelope, index) => ({
					id: envelope.id,
					// Use server-provided viewer-specific title; fallback to generic
					name: envelope.title || `Conversation ${index + 1}`,
					lastMessage: envelope.lastMessage || "No messages yet",
					timestamp: envelope.lastMessageTime || "Just now",
					unread: envelope.unreadCount || 0,
					avatar: "/placeholder.svg?height=40&width=40",
					online: false,
					envelopeId: envelope.id,
					participants: envelope.participants || [],
					lastSender: envelope.lastSender || null
				})
			)
			setConversations(newConversations)

			// Check for new messages from other users and mark as unread
			newConversations.forEach((conversation) => {
				// Only mark as unread if:
				// 1. There are unread messages (from backend)
				// 2. The conversation is not currently selected
				// 3. The last message is from someone else
				if (
					conversation.unread > 0 &&
					conversation.envelopeId !== selectedConversation &&
					conversation.lastSender !== session?.user?.name
				) {
					setUnreadConversations((prev) => {
						const newSet = new Set(prev)
						newSet.add(conversation.envelopeId)
						return newSet
					})
				}
			})
		}
	}, [userEnvelopes, selectedConversation, session?.user?.name])

	// Send message mutation
	const sendMessageMutation = trpc.messages.sendMessage.useMutation({
		onSuccess: () => {
			setNewMessage("")
			// Refetch messages to ensure they appear immediately
			void refetchMessages()
			// Refetch conversations to update last message
			void refetchConversations()
		},
		onError: (error) => {
			console.error("Failed to send message:", error)
		}
	})

	// Create or get conversation mutation
	const createOrGetConversationMutation =
		trpc.messages.createOrGetConversation.useMutation({
			onSuccess: (envelope) => {
				// Refetch conversations to include the new one
				void refetchConversations()
				// Select the new conversation
				setSelectedConversation(envelope.id)
			},
			onError: (error) => {
				console.error("❌ Failed to create/get conversation:", error)
			}
		})

	// Cleanup duplicate conversations mutation
	const cleanupMutation =
		trpc.messages.cleanupDuplicateConversations.useMutation()

	// Mark conversation as read mutation
	const markAsReadMutation = trpc.messages.markAsRead.useMutation()

	// Update conversations when envelopes data changes
	useEffect(() => {
		if (userEnvelopes?.envelopes) {
			const newConversations: Conversation[] = userEnvelopes.envelopes.map(
				(envelope, index) => ({
					id: envelope.id,
					name: envelope.title || `Conversation ${index + 1}`,
					lastMessage: envelope.lastMessage || "No messages yet",
					timestamp: envelope.lastMessageTime || "Just now",
					unread: envelope.unreadCount || 0,
					avatar: "/placeholder.svg?height=40&width=40",
					online: false,
					envelopeId: envelope.id,
					participants: envelope.participants || [],
					lastSender: envelope.lastSender || null
				})
			)
			setConversations(newConversations)
		}
	}, [userEnvelopes])

	// Update messages when conversation messages data changes
	useEffect(() => {
		if (conversationMessages?.messages) {
			const newMessages: Message[] = conversationMessages.messages.map(
				(msg: {
					id: string
					senderId: string
					sender: { name: string | null } | null
					content: string
					createdAt: string
				}) => ({
					id: msg.id,
					senderId: msg.senderId === session?.user?.id ? "me" : "other",
					senderName: msg.sender?.name ?? "Unknown User",
					content: msg.content,
					timestamp: new Date(msg.createdAt).toLocaleTimeString(),
					encrypted: true
				})
			)
			setMessages(newMessages)
		}
	}, [conversationMessages, session?.user?.id])

	const handleSendMessage = () => {
		if (!newMessage.trim() || !selectedConversation) return

		// Mark conversation as read when user sends a message
		markConversationAsRead(selectedConversation)

		sendMessageMutation.mutate({
			envelopeId: selectedConversation,
			content: newMessage,
			messageType: "ENVELOPE"
		})
	}

	const handleUserSelect = (user: {
		id: string
		name: string | null
		email: string | null
		image: string | null
		organization: string | null
		role: string
	}) => {
		// starting conversation

		// Check if conversation already exists by looking for the user's ID in participants
		const existingConversation = conversations.find((conv) => {
			// Check if this conversation has exactly 2 participants and one of them is the selected user
			return (
				conv.participants.length === 2 &&
				conv.participants.some(
					(participant) => participant === (user.name ?? user.email ?? "")
				)
			)
		})

		if (existingConversation) {
			// found existing conversation
			setSelectedConversation(existingConversation.envelopeId)
			return
		}

		// Create or get conversation with the selected user
		createOrGetConversationMutation.mutate({
			participantId: user.id,
			title: `Chat with ${user.name ?? user.email}`
		})
	}

	const selectedConversationData = conversations.find(
		(c) => c.envelopeId === selectedConversation
	)

	return (
		<ClientOnly>
			<div className="space-y-6" suppressHydrationWarning>
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
							Secure Messages
						</h1>
						<p className="text-gray-600 dark:text-gray-400">
							Encrypted communication with clients and partners
						</p>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => cleanupMutation.mutate()}
							disabled={cleanupMutation.isPending}
						>
							{cleanupMutation.isPending ? "Cleaning..." : "Clean Duplicates"}
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								setUnreadConversations(new Set())
								// Save all current conversations as read
								const allConversationIds = conversations.map(
									(c) => c.envelopeId
								)
								localStorage.setItem(
									"readConversations",
									JSON.stringify(allConversationIds)
								)
							}}
						>
							Mark All as Read
						</Button>

						<UserSearch
							onUserSelect={handleUserSelect}
							placeholder="Start new conversation..."
							trigger={
								<Button>
									<Plus className="mr-2 h-4 w-4" />
									New Conversation
								</Button>
							}
						/>
					</div>
				</div>

				<div className="grid h-[calc(100vh-200px)] grid-cols-1 gap-6 lg:grid-cols-3">
					{/* Conversations List */}
					<Card className="lg:col-span-1">
						<CardHeader>
							<CardTitle className="text-lg">Conversations</CardTitle>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
								<Input
									placeholder="Search conversations..."
									className="pl-10"
								/>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<div className="space-y-1">
								{conversations.length === 0 ? (
									<div className="p-4 text-center text-sm text-muted-foreground">
										No conversations yet. Start a new conversation to begin
										messaging.
									</div>
								) : (
									conversations.map((conversation) => (
										<div
											key={conversation.id}
											className={`cursor-pointer border-b p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
												selectedConversation === conversation.envelopeId
													? "bg-blue-50 dark:bg-blue-900/20"
													: ""
											}`}
											onClick={() =>
												handleConversationSelect(conversation.envelopeId)
											}
										>
											<div className="flex items-center space-x-3">
												<div className="relative">
													<Avatar className="h-10 w-10">
														<AvatarImage
															src={conversation.avatar || "/placeholder.svg"}
														/>
														<AvatarFallback>
															{conversation.name
																.split(" ")
																.map((n) => n[0])
																.join("")}
														</AvatarFallback>
													</Avatar>
													{conversation.online && (
														<div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
													)}
												</div>
												<div className="min-w-0 flex-1">
													<div className="flex items-start justify-between gap-2">
														<div className="min-w-0 flex-1">
															<div className="flex items-center gap-2">
																<h3
																	className={`truncate text-sm ${unreadConversations.has(conversation.envelopeId) ? "font-bold" : "font-medium"}`}
																>
																	{conversation.name}
																</h3>
																{unreadConversations.has(
																	conversation.envelopeId
																) && (
																	<div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"></div>
																)}
															</div>
															<p
																className={`mt-1 truncate text-sm ${unreadConversations.has(conversation.envelopeId) ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"}`}
															>
																{conversation.lastMessage}
															</p>
														</div>
														<div className="flex flex-col items-end gap-1">
															<span className="whitespace-nowrap text-xs text-gray-500">
																{conversation.timestamp}
															</span>
															{conversation.unread > 0 && (
																<Badge className="h-5 min-w-[20px] bg-blue-600 px-1.5 text-xs text-white">
																	{conversation.unread}
																</Badge>
															)}
														</div>
													</div>
												</div>
											</div>
										</div>
									))
								)}
							</div>
						</CardContent>
					</Card>

					{/* Chat Area */}
					<Card className="flex h-[calc(100vh-200px)] flex-col lg:col-span-2">
						{selectedConversationData ? (
							<>
								{/* Chat Header */}
								<CardHeader className="flex-shrink-0 border-b">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-3">
											<Avatar className="h-10 w-10">
												<AvatarImage
													src={
														selectedConversationData.avatar ||
														"/placeholder.svg"
													}
												/>
												<AvatarFallback>
													{selectedConversationData.name
														.split(" ")
														.map((n) => n[0])
														.join("")}
												</AvatarFallback>
											</Avatar>
											<div>
												<h3 className="font-medium">
													{selectedConversationData.name}
												</h3>
												<div className="flex items-center space-x-2">
													<div
														className={`h-2 w-2 rounded-full ${selectedConversationData.online ? "bg-green-500" : "bg-gray-400"}`}
													></div>
													<span className="text-sm text-gray-600 dark:text-gray-400">
														{selectedConversationData.online
															? "Online"
															: "Offline"}
													</span>
												</div>
											</div>
										</div>
										<Button variant="ghost" size="icon">
											<MoreVertical className="h-4 w-4" />
										</Button>
									</div>
								</CardHeader>

								{/* Messages */}
								<CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
									{messages.length === 0 ? (
										<div className="py-8 text-center">
											<p className="text-gray-500">No messages yet</p>
											<p className="text-sm text-gray-400">
												Start the conversation!
											</p>
										</div>
									) : (
										messages.map((message) => (
											<div
												key={message.id}
												className={`flex ${message.senderId === "me" ? "justify-end" : "justify-start"}`}
											>
												<div
													className={`max-w-[70%] rounded-lg px-3 py-2 ${
														message.senderId === "me"
															? "bg-blue-600 text-white"
															: "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
													}`}
												>
													<p className="break-words text-sm">
														{message.content}
													</p>
													<div className="mt-1 flex items-center justify-between gap-2">
														<span
															className={`text-xs ${message.senderId === "me" ? "text-blue-100" : "text-gray-500"}`}
														>
															{message.timestamp}
														</span>
														{message.encrypted && (
															<Shield
																className={`h-3 w-3 flex-shrink-0 ${message.senderId === "me" ? "text-blue-100" : "text-green-600"}`}
															/>
														)}
													</div>
												</div>
											</div>
										))
									)}
									<div ref={setMessagesEndRef} />
								</CardContent>

								{/* Message Input */}
								<div className="flex-shrink-0 border-t p-4">
									<div className="flex items-center space-x-2">
										<Button variant="ghost" size="icon">
											<Paperclip className="h-4 w-4" />
										</Button>
										<div className="flex-1">
											<Textarea
												placeholder="Type your message..."
												value={newMessage}
												onChange={(e) => setNewMessage(e.target.value)}
												className="max-h-32 min-h-[40px] resize-none"
												onKeyPress={(e) => {
													if (e.key === "Enter" && !e.shiftKey) {
														e.preventDefault()
														handleSendMessage()
													}
												}}
											/>
										</div>
										<Button
											onClick={handleSendMessage}
											disabled={
												!newMessage.trim() || sendMessageMutation.isPending
											}
										>
											<Send className="h-4 w-4" />
										</Button>
									</div>
									<div className="mt-2 flex items-center justify-between text-xs text-gray-500">
										<div className="flex items-center space-x-1">
											<Shield className="h-3 w-3 text-green-600" />
											<span>End-to-end encrypted</span>
										</div>
										<span>Press Enter to send, Shift+Enter for new line</span>
									</div>
								</div>
							</>
						) : (
							<div className="flex h-full items-center justify-center">
								<div className="text-center">
									<p className="text-gray-500">
										Select a conversation to start messaging
									</p>
								</div>
							</div>
						)}
					</Card>
				</div>
			</div>
		</ClientOnly>
	)
}
