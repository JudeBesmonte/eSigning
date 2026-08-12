import { Suspense } from "react"

import { MessagesClient } from "@/features/messages/components/messages-client"

interface MessagesPageProps {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function MessagesPage({
	searchParams
}: MessagesPageProps) {
	const resolvedSearchParams = await searchParams

	return (
		<Suspense fallback={<div>Loading messages...</div>}>
			<MessagesClient searchParams={resolvedSearchParams} />
		</Suspense>
	)
}
