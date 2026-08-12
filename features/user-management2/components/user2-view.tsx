"use client"

import { useEffect, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronRight, FileText, X } from "lucide-react"

import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from "@/core/components/ui/avatar"
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"

import { trpc } from "@/services/trpc/client"

import { type UserWithRelations } from "@/features/user-management2/api/usermanagement2.router"

// Base envelope type from Prisma
interface BaseEnvelope {
	id: string
	title: string | null
	status: string
	createdAt: Date
	updatedAt: Date
	userId: string
}

// Envelope type with count
interface EnvelopeWithCount extends BaseEnvelope {
	_count: {
		documents: number
	}
}

// Regular envelope type for the component
interface Envelope extends BaseEnvelope {
	documents?: Document[]
	_count?: {
		documents: number
	}
}

type Document = {
	id: string
	name: string | null
	type: string | null
	status: string
	createdAt: Date
	updatedAt: Date
	envelopeId: string | null
	envelope?: {
		id: string
		title: string | null
		status: string
		createdAt: Date
		updatedAt: Date
	}
	recipientRole?: string
	recipientStatus?: string
	url?: string | null
	mimeType?: string | null
	size?: number | null
}

interface UserViewProps {
	isOpen: boolean
	onClose: () => void
	user:
		| (UserWithRelations & {
				envelopes?: Envelope[]
				documents?: Document[]
				recipientDocuments?: Document[]
		  })
		| null
	onEditClick: (user: UserWithRelations, e: React.MouseEvent) => void
}

type UserWithEnvelopesAndDocuments = UserWithRelations & {
	envelopes?: Array<Envelope | EnvelopeWithCount>
	documents?: Document[]
	recipientDocuments?: Document[]
}

export function UserView({
	isOpen,
	onClose,
	user: initialUser,
	onEditClick
}: UserViewProps) {
	const [user, setUser] = useState<UserWithEnvelopesAndDocuments | null>(
		initialUser
	)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Initialize TRPC query
	const {
		data: userData,
		isLoading: isUserLoading,
		error: userError
	} = trpc.userManagement2.getById.useQuery(initialUser?.id ?? "", {
		enabled: isOpen && !!initialUser?.id,
		refetchOnWindowFocus: false
	})

	// Update local state when TRPC data changes
	useEffect(() => {
		if (userData) {
			// Ensure we have the correct type before setting
			const typedUserData = userData as unknown as UserWithEnvelopesAndDocuments
			setUser(typedUserData)
		}
	}, [userData])

	// Handle loading and error states
	useEffect(() => {
		setIsLoading(isUserLoading)
		if (userError) {
			console.error("Error fetching user data:", userError)
			setError(userError.message || "Failed to load user data")
		}
	}, [isUserLoading, userError])

	if (!user) return null

	if (isLoading) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
				<div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
				<div className="mx-4 w-full max-w-md rounded-lg bg-background p-6">
					<div className="text-center">
						<h3 className="mb-2 text-lg font-medium">Error Loading User</h3>
						<p className="mb-4 text-muted-foreground">{error}</p>
						<Button onClick={onClose} variant="outline">
							Close
						</Button>
					</div>
				</div>
			</div>
		)
	}

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Overlay */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 z-40 bg-black/50"
					/>

					{/* Slide-in panel */}
					<motion.div
						initial={{ x: "100%" }}
						animate={{ x: 0 }}
						exit={{ x: "100%" }}
						transition={{ type: "tween", ease: "easeInOut" }}
						className="fixed inset-0 left-auto z-50 flex w-full max-w-md flex-col bg-background shadow-lg"
						style={{ height: "100dvh" }}
					>
						<div
							className="no-scrollbar flex-1 overflow-y-auto p-6"
							style={{ maxHeight: "100%" }}
						>
							{/* Header */}
							<div className="mb-6 flex items-center justify-between">
								<h2 className="text-2xl font-semibold">User Details</h2>
								<Button
									variant="ghost"
									size="icon"
									onClick={onClose}
									className="rounded-full"
								>
									<X className="h-5 w-5" />
									<span className="sr-only">Close</span>
								</Button>
							</div>

							{/* User Profile */}
							<div className="flex flex-col items-center space-y-4 text-center">
								<Avatar className="h-20 w-20">
									<AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
									<AvatarFallback className="text-2xl">
										{user.name ? getInitials(user.name) : "U"}
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-col items-center space-y-2">
									<h2 className="text-2xl font-bold">{user.name}</h2>
									<p className="text-muted-foreground">{user.email}</p>
									<Badge variant="outline" className="text-sm">
										{user.role}
									</Badge>
								</div>
								<div className="flex space-x-2">
									<Button
										variant="outline"
										size="sm"
										onClick={(e) => onEditClick(user, e)}
									>
										Edit Profile
									</Button>
								</div>
							</div>

							{/* User Details */}
							<div className="space-y-6">
								<div className="space-y-4">
									<h3 className="text-lg font-semibold">User Information</h3>

									{user.phone && (
										<div className="space-y-1">
											<h4 className="text-sm font-medium text-muted-foreground">
												Phone
											</h4>
											<p>{user.phone}</p>
										</div>
									)}

									<div className="space-y-1">
										<h4 className="text-sm font-medium text-muted-foreground">
											Status
										</h4>
										<div className="flex items-center">
											<div
												className={`mr-2 h-2 w-2 rounded-full ${
													user.suspendedAt ? "bg-destructive" : "bg-success"
												}`}
											/>
											<span>{user.suspendedAt ? "Suspended" : "Active"}</span>
										</div>
									</div>

									{user.emailVerified && (
										<div className="space-y-1">
											<h4 className="text-sm font-medium text-muted-foreground">
												Email Verified
											</h4>
											<p>{format(new Date(user.emailVerified), "PPpp")}</p>
										</div>
									)}
								</div>

								{/* Envelopes Section */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<h3 className="text-lg font-semibold">Recent Envelopes</h3>
									</div>
									{user.envelopes && user.envelopes.length > 0 ? (
										<div className="space-y-2">
											{user.envelopes?.map((envelope: Envelope) => (
												<div
													key={envelope.id}
													onClick={() =>
														(window.location.href = `/dashboard/envelopes/${envelope.id}`)
													}
													className="block cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
												>
													<div className="flex items-center justify-between">
														<div className="min-w-0 flex-1">
															<p className="truncate font-medium">
																{envelope.title}
															</p>
															<div className="mt-1 flex items-center text-sm text-muted-foreground">
																<span>
																	{envelope._count?.documents ?? 0} documents
																</span>
																<span className="mx-2">•</span>
																<span>
																	{formatDistanceToNow(
																		new Date(envelope.createdAt),
																		{ addSuffix: true }
																	)}
																</span>
															</div>
														</div>
														<Badge
															variant={
																envelope.status === "COMPLETED"
																	? "default"
																	: envelope.status === "PENDING_APPROVAL"
																		? "secondary"
																		: ("outline" as const)
															}
														>
															{envelope.status}
														</Badge>
													</div>
												</div>
											))}
										</div>
									) : (
										<div className="rounded-lg border py-4 text-center">
											<p className="text-muted-foreground">
												No envelopes found
											</p>
										</div>
									)}
								</div>

								{/* Documents Section */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<h3 className="text-lg font-semibold">Recent Documents</h3>
									</div>
									{user.documents && user.documents.length > 0 ? (
										<div className="space-y-2">
											{user.documents?.map((doc: Document) => (
												<div
													key={doc.id}
													onClick={() =>
														(window.location.href = `/dashboard/documents/${doc.id}`)
													}
													className="block cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
												>
													<div className="flex items-start">
														<div className="mt-0.5 flex-shrink-0">
															<FileText className="h-5 w-5 text-muted-foreground" />
														</div>
														<div className="ml-3 min-w-0 flex-1">
															<p className="truncate font-medium">{doc.name}</p>
															<div className="mt-1 flex items-center text-sm text-muted-foreground">
																<span className="capitalize">
																	{doc.type?.toLowerCase()}
																</span>
																<span className="mx-2">•</span>
																<span>
																	{formatDistanceToNow(
																		new Date(doc.createdAt),
																		{ addSuffix: true }
																	)}
																</span>
															</div>
															{doc.envelope && (
																<div className="mt-1 flex items-center text-sm text-muted-foreground">
																	<span>In envelope: </span>
																	<div
																		className="ml-1 cursor-pointer text-primary hover:underline"
																		onClick={(e) => {
																			e.stopPropagation()
																			window.location.href = `/dashboard/envelopes/${doc.envelope?.id}`
																		}}
																	>
																		{doc.envelope.title}
																	</div>
																</div>
															)}
														</div>
														<Badge
															variant={
																doc.status === "COMPLETED"
																	? "default"
																	: doc.status === "PENDING"
																		? "secondary"
																		: ("outline" as const)
															}
															className="ml-2"
														>
															{doc.status}
														</Badge>
													</div>
												</div>
											))}
										</div>
									) : (
										<div className="rounded-lg border py-4 text-center">
											<p className="text-muted-foreground">
												No documents found
											</p>
										</div>
									)}
								</div>

								{/* Recipient Documents Section */}
								{user.recipientDocuments &&
								user.recipientDocuments.length > 0 ? (
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<h3 className="text-lg font-semibold">
												Documents for Review
											</h3>
										</div>
										<div className="space-y-2">
											{user.recipientDocuments?.map((doc: Document) => (
												<div
													key={doc.id}
													onClick={() =>
														(window.location.href = `/dashboard/documents/${doc.id}`)
													}
													className="block cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
												>
													<div className="flex items-start">
														<div className="mt-0.5 flex-shrink-0">
															<FileText className="h-5 w-5 text-muted-foreground" />
														</div>
														<div className="ml-3 min-w-0 flex-1">
															<div className="flex items-center">
																<p className="truncate font-medium">
																	{doc.name}
																</p>
																<Badge
																	variant="outline"
																	className="ml-2 text-xs"
																>
																	{doc.recipientRole}
																</Badge>
															</div>
															<div className="mt-1 flex items-center text-sm text-muted-foreground">
																<span>Status: {doc.recipientStatus}</span>
																<span className="mx-2">•</span>
																<span>
																	{formatDistanceToNow(
																		new Date(doc.createdAt),
																		{ addSuffix: true }
																	)}
																</span>
															</div>
															{doc.envelope && (
																<div className="mt-1 flex items-center text-sm text-muted-foreground">
																	<span>In envelope: </span>
																	<span
																		className="ml-1 cursor-pointer text-primary hover:underline"
																		onClick={(e) => {
																			e.stopPropagation()
																			window.location.href = `/dashboard/envelopes/${doc.envelope?.id}`
																		}}
																	>
																		{doc.envelope.title}
																	</span>
																</div>
															)}
														</div>
														<ChevronRight className="h-5 w-5 text-muted-foreground" />
													</div>
												</div>
											))}
										</div>
									</div>
								) : null}
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}
