"use client"

// File: /app/dashboard/(legal)/clients/page.tsx
import { Suspense } from "react"

import { trpc } from "@/services/trpc/client"

import ClientsPage from "@/features/client/compoenents/clientpage"

import Loading from "./loading"

export default function Page() {
	return (
		<Suspense fallback={<Loading />}>
			<ClientsPageWrapper />
		</Suspense>
	)
}

function ClientsPageWrapper() {
	const { data: users, isLoading, error } = trpc.user.getAll.useQuery()

	if (isLoading) return <Loading />
	if (error) {
		console.error("Error fetching users:", error)
		return <div>Error loading users. Please try again later.</div>
	}

	return <ClientsPage initialUsers={users ?? []} />
}
