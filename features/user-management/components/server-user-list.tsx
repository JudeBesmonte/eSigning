"use client"

import { parseAsInteger, parseAsString, useQueryState } from "nuqs"

import { trpc, type RouterOutputs } from "@/services/trpc/client"

import { ClientUserList } from "./client-user-list"

type User = RouterOutputs["userManagement"]["list"]["users"][number]

export function ServerUserList() {
	// Get filters from URL using nuqs
	const [search] = useQueryState(
		"search",
		parseAsString.withDefault("").withOptions({ clearOnDefault: true })
	)
	const [role] = useQueryState(
		"role",
		parseAsString.withDefault("all").withOptions({ clearOnDefault: true })
	)
	const [status] = useQueryState(
		"status",
		parseAsString.withDefault("all").withOptions({ clearOnDefault: true })
	)
	const [page] = useQueryState(
		"page",
		parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true })
	)
	const [limit] = useQueryState(
		"limit",
		parseAsInteger.withDefault(10).withOptions({ clearOnDefault: true })
	)

	// Use tRPC query to fetch users with filters
	const {
		data: usersData,
		isLoading,
		error
	} = trpc.userManagement.list.useQuery({
		search: search || undefined,
		role: role as "all" | "CLIENT" | "ADMIN" | "SUPER_ADMIN",
		status: status as "all" | "active" | "pending" | "suspended",
		page,
		limit
	})

	if (error) {
		return (
			<div className="py-8 text-center">
				<p className="text-red-600">Error loading users: {error.message}</p>
			</div>
		)
	}

	if (isLoading) {
		return (
			<div className="py-8 text-center">
				<div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
				<p className="mt-2 text-gray-600">Loading users...</p>
			</div>
		)
	}

	if (!usersData) {
		return (
			<div className="py-8 text-center">
				<p className="text-gray-600">No users found.</p>
			</div>
		)
	}

	// Ensure joinDate is defined for all users
	const transformedUsers = usersData.users.map((user) => {
		const joinDate = user.joinDate ?? new Date().toISOString().split("T")[0]
		return {
			...user,
			joinDate
		}
	}) as User[]

	return (
		<ClientUserList
			users={transformedUsers}
			pagination={usersData.pagination}
		/>
	)
}
