"use client"

import { useParams } from "next/navigation"

import EnvelopeView from "@/features/envelope2/components/envelope2-view"

export default function EnvelopePage() {
	const params = useParams()
	const id = params.id as string

	console.log("EnvelopePage received params:", params)
	console.log("EnvelopePage resolved id:", id)
	console.log("EnvelopePage id type:", typeof id)

	// Don't render until we have a valid ID
	if (!id || typeof id !== "string") {
		console.error("Invalid or missing envelope ID:", id)
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<h3 className="text-lg font-medium text-destructive">
						Invalid Envelope ID
					</h3>
					<p className="text-muted-foreground">
						No envelope ID provided. Please check the URL and try again.
					</p>
				</div>
			</div>
		)
	}

	return <EnvelopeView envelopeId={id} />
}
