"use client"

import { ApprovalsList } from "./approvals-list"

export function ApprovalsPage() {
	return (
		<div className="container mx-auto py-6">
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Document Approvals
					</h1>
					<p className="text-muted-foreground">
						Review and approve envelopes assigned to you for approval.
					</p>
				</div>
				<ApprovalsList />
			</div>
		</div>
	)
}
