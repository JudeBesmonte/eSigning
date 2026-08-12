"use client"

import { FileTextIcon } from "lucide-react"

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"

import { trpc } from "@/services/trpc/client"

import { EnvelopeDisclosure } from "@/features/envelopes/components/envelope-disclosure"

export function MyEnvelopes() {
	const { data: envelopes } = trpc.envelope.getMyEnvelopes.useQuery()

	return (
		<Card suppressHydrationWarning>
			<CardHeader className="flex-row items-center space-x-2 space-y-0">
				<FileTextIcon className="size-5" />
				<CardTitle>My Envelopes</CardTitle>
			</CardHeader>

			<CardContent className="space-y-2.5">
				{envelopes?.map((envelope) => (
					<EnvelopeDisclosure key={envelope.id} envelope={envelope} />
				))}
			</CardContent>
		</Card>
	)
}
