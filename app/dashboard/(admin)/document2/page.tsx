"use client"

import Document2View from "@/features/document2/components/document2-view"

export default function AdminDocument2Page() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Document Management</h1>
					<p className="text-muted-foreground">
						Manage your documents and track their status.
					</p>
				</div>
			</div>

			<div className="rounded-lg border bg-card text-card-foreground shadow-sm">
				<Document2View />
			</div>
		</div>
	)
}
