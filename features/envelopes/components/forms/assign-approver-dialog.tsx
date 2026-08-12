"use client"

import { useState, useTransition } from "react"
import { ShieldCheckIcon, UserCheckIcon } from "lucide-react"
import { useFormContext } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/core/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/core/components/ui/dialog"

import { type CreateEnvelopeSchema } from "@/features/envelopes/api/envelope.schema"

import { UserSearch } from "./user-search"

interface User {
	id: string
	name: string | null
	email: string
	role: string
}

interface AssignApproverDialogProps {
	currentApproverId?: string
}

export function AssignApproverDialog({
	currentApproverId
}: AssignApproverDialogProps) {
	const [open, setOpen] = useState(false)
	const [isPending, startTransition] = useTransition()
	const { setValue, trigger } = useFormContext<CreateEnvelopeSchema>()

	const [selectedUser, setSelectedUser] = useState<User | null>(null)
	const [errors, setErrors] = useState<Record<string, string>>({})

	const handleUserSelect = (user: User) => {
		setSelectedUser(user)
		// Clear any previous errors
		setErrors({})
	}

	const handleAssignApprover = () => {
		if (!selectedUser) {
			setErrors({ user: "Please select an approver" })
			return
		}

		startTransition(async () => {
			setErrors({})

			try {
				// Verify the user is eligible to be an approver
				const eligibleRoles = ["ADMIN", "SUPER_ADMIN"]
				if (!eligibleRoles.includes(selectedUser.role)) {
					toast.error("User cannot be an approver", {
						description: "Only Admin or Super Admin users can be approvers."
					})
					return
				}

				// Set the approver in the form
				setValue("approverId", selectedUser.id)
				await trigger("approverId")

				setOpen(false)
				toast.success("Approver assigned successfully", {
					description: `${selectedUser.name ?? selectedUser.email} will approve this envelope.`
				})
			} catch {
				toast.error("Failed to assign approver", {
					description: "Please try again."
				})
			}
		})
	}

	const handleOpenChange = (isOpen: boolean) => {
		setOpen(isOpen)

		// Reset form when dialog closes
		if (!isOpen) {
			setSelectedUser(null)
			setErrors({})
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button
					type="button"
					variant={currentApproverId ? "secondary" : "outline"}
					className="h-8 items-center justify-center"
				>
					<ShieldCheckIcon className="mt-0.5 !size-3.5" />
					{currentApproverId ? "Change Approver" : "Assign Approver"}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<UserCheckIcon className="size-4" />
						Assign Envelope Approver
					</DialogTitle>
					<DialogDescription>
						Search and select someone to approve or reject this envelope. Only
						users with Business, Legal Professional, Regulatory Body, or Admin
						roles can be approvers.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<UserSearch
						onUserSelect={handleUserSelect}
						placeholder="Search approver by name or email..."
						label="Select Approver"
						disabled={isPending}
					/>
					{errors.user && (
						<p className="text-sm text-destructive">{errors.user}</p>
					)}

					{selectedUser && (
						<div className="rounded-md border p-3">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium">
										{selectedUser.name ?? "Unknown User"}
									</p>
									<p className="text-sm text-muted-foreground">
										{selectedUser.email}
									</p>
									<p className="text-xs text-muted-foreground">
										Role: {selectedUser.role}
									</p>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setSelectedUser(null)}
								>
									Remove
								</Button>
							</div>
						</div>
					)}
				</div>

				<DialogFooter className="flex gap-2">
					<Button
						type="button"
						className="h-8 items-center justify-center"
						onClick={handleAssignApprover}
						disabled={isPending || !selectedUser}
					>
						<UserCheckIcon className="mt-0.5 !size-3.5" />
						<span>{isPending ? "Assigning..." : "Assign Approver"}</span>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
