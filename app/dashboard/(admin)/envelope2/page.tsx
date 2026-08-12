"use client"

import { EnvelopeTable } from "@/features/envelope2/components/envelope2-table"

export default function EnvelopesPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Envelopes</h1>
					<p className="text-muted-foreground">
						Manage your document envelopes and track their status.
					</p>
				</div>
			</div>

			<EnvelopeTable isAdmin={true} />
		</div>
	)
}
