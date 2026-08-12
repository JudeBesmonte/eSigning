"use client"

import { Button } from "@/core/components/ui/button"

import { trpc } from "@/services/trpc/client"

export function SessionManagementForm() {
	const { data } = trpc.profile.security.getUserSessions.useQuery()

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium">Session Management</h3>
					<p className="text-sm text-muted-foreground">
						You are currently logged in from {data?.activeSessions} devices
					</p>
				</div>
			</div>

			<Button variant="outline">Manage Sessions</Button>
		</div>
	)
}
