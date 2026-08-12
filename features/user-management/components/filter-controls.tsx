"use client"

import { useEffect, useState } from "react"
import { Filter, Search } from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"

export const FilterControls = () => {
	// URL state management
	const [search, setSearch] = useQueryState(
		"search",
		parseAsString.withDefault("").withOptions({
			clearOnDefault: true
		})
	)
	const [role, setRole] = useQueryState(
		"role",
		parseAsString.withDefault("all").withOptions({
			clearOnDefault: true
		})
	)
	const [status, setStatus] = useQueryState(
		"status",
		parseAsString.withDefault("all").withOptions({
			clearOnDefault: true
		})
	)

	// Local state for immediate UI feedback
	const [localSearch, setLocalSearch] = useState(search)

	// Simple debounced search
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (localSearch !== search) {
				void setSearch(localSearch || null)
			}
		}, 500)

		return () => clearTimeout(timeoutId)
	}, [localSearch, search, setSearch])

	// Sync local state when URL changes
	useEffect(() => {
		setLocalSearch(search)
	}, [search])

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Filter Users</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-4 md:flex-row">
					<div className="flex-1">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
							<Input
								placeholder="Search by name, email, or organization..."
								value={localSearch}
								onChange={(e) => setLocalSearch(e.target.value)}
								className="pl-10"
							/>
						</div>
					</div>
					<Select
						value={role}
						onValueChange={(value) => setRole(value === "all" ? null : value)}
					>
						<SelectTrigger className="w-full md:w-48">
							<Filter className="mr-2 h-4 w-4" />
							<SelectValue placeholder="Filter by role" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Roles</SelectItem>
							<SelectItem value="CLIENT">Client</SelectItem>
							<SelectItem value="ADMIN">Administrator</SelectItem>
							<SelectItem value="SUPER_ADMIN">Super Administrator</SelectItem>
						</SelectContent>
					</Select>
					<Select
						value={status}
						onValueChange={(value) => setStatus(value === "all" ? null : value)}
					>
						<SelectTrigger className="w-full md:w-48">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="pending">Pending</SelectItem>
							<SelectItem value="suspended">Suspended</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardContent>
		</Card>
	)
}
