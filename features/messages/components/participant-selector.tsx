"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { toast } from "sonner"

import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from "@/core/components/ui/avatar"
import { Badge } from "@/core/components/ui/badge"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList
} from "@/core/components/ui/command"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"

import { trpc } from "@/services/trpc/client"

interface UserProfile {
	id: string
	name: string | null
	email: string | null
	image: string | null
	role: string
	organization: string | null
}

interface ParticipantSelectorProps {
	selectedParticipants: UserProfile[]
	onParticipantsChange: (participants: UserProfile[]) => void
	label?: string
	placeholder?: string
}

export function ParticipantSelector({
	selectedParticipants,
	onParticipantsChange,
	label = "Participants",
	placeholder = "Search participants..."
}: ParticipantSelectorProps) {
	const [searchQuery, setSearchQuery] = useState("")
	const [showResults, setShowResults] = useState(false)

	const { data: searchResults = [], isLoading } =
		trpc.messages.searchUsers.useQuery(
			{ query: searchQuery, limit: 50 }, // Increased limit to show more users
			{
				enabled: searchQuery.length >= 0,
				staleTime: 30000
			}
		)

	const handleAddParticipant = (user: UserProfile) => {
		if (!selectedParticipants.find((p) => p.id === user.id)) {
			onParticipantsChange([...selectedParticipants, user])
			toast.success("Participant added", {
				description: `${user.name ?? user.email}`
			})
		}
		setSearchQuery("")
		setShowResults(false)
	}

	const handleRemoveParticipant = (userId: string) => {
		onParticipantsChange(selectedParticipants.filter((p) => p.id !== userId))
	}

	const handleSearchChange = (value: string) => {
		setSearchQuery(value)
		setShowResults(value.length >= 0)
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault()
			if (searchResults.length === 1 && searchResults[0]?.email) {
				const user: UserProfile = {
					id: searchResults[0].id,
					name: searchResults[0].name,
					email: searchResults[0].email,
					image: searchResults[0].image,
					role: searchResults[0].role,
					organization: searchResults[0].organization
				}
				handleAddParticipant(user)
			}
		}
		if (e.key === "Escape") {
			setShowResults(false)
		}
	}

	return (
		<div className="space-y-3">
			<Label>{label}</Label>

			{/* Selected Participants */}
			{selectedParticipants.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{selectedParticipants.map((participant) => (
						<Badge
							key={participant.id}
							variant="secondary"
							className="flex items-center gap-1"
						>
							<Avatar className="h-4 w-4">
								<AvatarImage src={participant.image ?? undefined} />
								<AvatarFallback className="text-xs">
									{participant.name?.charAt(0) ??
										participant.email?.charAt(0) ??
										"?"}
								</AvatarFallback>
							</Avatar>
							<span className="text-xs">
								{participant.name ?? participant.email}
							</span>
							<button
								type="button"
								onClick={() => handleRemoveParticipant(participant.id)}
								className="ml-1 rounded-full p-0.5 hover:bg-muted"
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
				</div>
			)}

			{/* Search Input */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder={placeholder}
					value={searchQuery}
					onChange={(e) => handleSearchChange(e.target.value)}
					onKeyDown={handleKeyDown}
					onFocus={() => setShowResults(true)}
					className="pl-10"
				/>
			</div>

			{/* Search Results */}
			{showResults && (
				<div className="absolute z-50 w-full rounded-md border bg-popover p-0 text-popover-foreground shadow-md">
					<Command>
						<CommandList>
							{isLoading && (
								<div className="p-4 text-center text-sm text-muted-foreground">
									Searching...
								</div>
							)}

							{!isLoading && searchResults.length === 0 && (
								<CommandEmpty>No users found.</CommandEmpty>
							)}

							{!isLoading && searchResults.length > 0 && (
								<CommandGroup>
									{searchResults
										.filter(
											(user) =>
												!selectedParticipants.find((p) => p.id === user.id)
										)
										.map((user) => {
											if (!user.email) return null
											const participant: UserProfile = {
												id: user.id,
												name: user.name,
												email: user.email,
												image: user.image,
												role: user.role,
												organization: user.organization
											}
											return (
												<CommandItem
													key={user.id}
													onSelect={() => handleAddParticipant(participant)}
													className="cursor-pointer"
												>
													<div className="flex w-full items-center justify-between">
														<div className="flex items-center gap-3">
															<Avatar className="h-6 w-6">
																<AvatarImage src={user.image ?? undefined} />
																<AvatarFallback className="text-xs">
																	{user.name?.charAt(0) ??
																		user.email?.charAt(0) ??
																		"?"}
																</AvatarFallback>
															</Avatar>
															<div className="flex flex-col">
																<span className="font-medium">
																	{user.name ?? "Unknown User"}
																</span>
																<span className="text-sm text-muted-foreground">
																	{user.email}
																</span>
															</div>
														</div>
														<Badge variant="outline" className="text-xs">
															{user.role}
														</Badge>
													</div>
												</CommandItem>
											)
										})}
								</CommandGroup>
							)}
						</CommandList>
					</Command>
				</div>
			)}

			{/* Click outside to close */}
			{showResults && (
				<div
					className="fixed inset-0 z-40"
					onClick={() => setShowResults(false)}
				/>
			)}
		</div>
	)
}
