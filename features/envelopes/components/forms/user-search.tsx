"use client"

import { useEffect, useState } from "react"
import { SearchIcon, UserIcon } from "lucide-react"
import { toast } from "sonner"

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
import { normalCase } from "@/core/lib/utils"

import { trpc } from "@/services/trpc/client"

interface User {
	id: string
	name: string | null
	email: string
	role: string
}

interface UserSearchProps {
	onUserSelect: (user: User) => void
	placeholder?: string
	label?: string
	disabled?: boolean
}

export function UserSearch({
	onUserSelect,
	placeholder = "Search by name or email...",
	label = "Search Users",
	disabled = false
}: UserSearchProps) {
	const [searchQuery, setSearchQuery] = useState("")
	const [showResults, setShowResults] = useState(false)

	const {
		data: searchResults = [],
		isLoading,
		error
	} = trpc.envelope.searchUsers.useQuery(
		{ query: searchQuery, limit: 10 },
		{
			enabled: searchQuery.length >= 2,
			staleTime: 30000 // Cache results for 30 seconds
		}
	)

	// Handle search input changes
	const handleSearchChange = (value: string) => {
		setSearchQuery(value)
		setShowResults(value.length >= 2)
	}

	// Handle user selection
	const handleUserSelect = (user: User) => {
		onUserSelect(user)
		setSearchQuery("")
		setShowResults(false)
		toast.success("User selected", {
			description: `${user.name ?? "Unknown"} (${user.email})`
		})
	}

	// Handle Enter key press
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault()
			if (searchResults.length === 1 && searchResults[0]?.email) {
				const validUser: User = {
					id: searchResults[0].id,
					name: searchResults[0].name,
					email: searchResults[0].email,
					role: searchResults[0].role
				}
				handleUserSelect(validUser)
			}
		}
		if (e.key === "Escape") {
			setShowResults(false)
		}
	}

	// Show error if search fails
	useEffect(() => {
		if (error) {
			toast.error("Search failed", {
				description: "Please try again."
			})
		}
	}, [error])

	return (
		<div className="relative space-y-2">
			<Label htmlFor="user-search">{label}</Label>
			<div className="relative">
				<SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					id="user-search"
					type="text"
					placeholder={placeholder}
					value={searchQuery}
					onChange={(e) => handleSearchChange(e.target.value)}
					onKeyDown={handleKeyDown}
					onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
					className="h-10 pl-10"
					disabled={disabled}
				/>
			</div>

			{showResults && (
				<div className="absolute top-full z-50 w-full rounded-md border bg-popover p-0 text-popover-foreground shadow-md">
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
									{searchResults.map((user) => {
										if (!user.email) return null
										const validUser: User = {
											id: user.id,
											name: user.name,
											email: user.email,
											role: user.role
										}
										return (
											<CommandItem
												key={user.id}
												onSelect={() => handleUserSelect(validUser)}
												className="cursor-pointer"
											>
												<div className="flex w-full items-center justify-between">
													<div className="flex items-center gap-3">
														<UserIcon className="size-4 text-muted-foreground" />
														<div className="flex flex-col">
															<span className="font-medium">
																{user.name ?? "Unknown User"}
															</span>
															<span className="text-sm text-muted-foreground">
																{user.email}
															</span>
														</div>
													</div>
													<Badge variant="secondary" className="text-xs">
														{normalCase(user.role)}
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
