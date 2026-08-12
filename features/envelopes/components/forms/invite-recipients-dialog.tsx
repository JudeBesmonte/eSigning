"use client"

import { useState, useTransition } from "react"
import { RecipientRole } from "@prisma/client"
import { PlusIcon, UserPlusIcon } from "lucide-react"
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
import { Label } from "@/core/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"
import { normalCase } from "@/core/lib/utils"

import {
	recipientSchema,
	type CreateEnvelopeSchema,
	type RecipientSchema
} from "@/features/envelopes/api/envelope.schema"

import { UserSearch } from "./user-search"

interface User {
	id: string
	name: string | null
	email: string
	role: string
}

interface InviteRecipientsDialogProps {
	documentIndex: number
}

export function InviteRecipientsDialog({
	documentIndex
}: InviteRecipientsDialogProps) {
	const [open, setOpen] = useState(false)
	const [isPending, startTransition] = useTransition()
	const { getValues, setValue, trigger } =
		useFormContext<CreateEnvelopeSchema>()

	const [selectedUser, setSelectedUser] = useState<User | null>(null)
	const [recipientRole, setRecipientRole] = useState<RecipientRole>("SIGNER")
	const [errors, setErrors] = useState<Record<string, string>>({})

	const handleUserSelect = (user: User) => {
		setSelectedUser(user)
		// Clear any previous errors
		setErrors({})
	}

	const handleAddRecipient = () => {
		if (!selectedUser || !recipientRole) {
			setErrors({
				user: !selectedUser ? "Please select a user" : "",
				role: !recipientRole ? "Role is required" : ""
			})
			return
		}

		startTransition(async () => {
			setErrors({})

			try {
				// Create recipient with selected user data
				const userName = selectedUser.name?.trim() ?? ""

				const newRecipient: RecipientSchema = {
					id: selectedUser.id,
					name: userName || "Unknown User",
					email: selectedUser.email,
					role: recipientRole
				}

				// Validate using the existing schema
				const validationResult = recipientSchema.safeParse(newRecipient)

				if (!validationResult.success) {
					const newErrors: Record<string, string> = {}
					validationResult.error.issues.forEach((issue) => {
						if (issue.path[0]) {
							newErrors[issue.path[0].toString()] = issue.message
						}
					})
					setErrors(newErrors)
					return
				}

				// Use useFormContext to update the main form
				const currentDocuments = getValues("documents")
				const targetDocument = currentDocuments[documentIndex]

				if (targetDocument) {
					// Check if user is already a recipient for this document
					const existingRecipient = targetDocument.recipients.find(
						(recipient) => recipient.id === selectedUser.id
					)

					if (existingRecipient) {
						toast.error("User already added", {
							description: "This user is already a recipient for this document."
						})
						return
					}

					const updatedRecipients = [
						...targetDocument.recipients,
						validationResult.data
					]
					const updatedDocuments = currentDocuments.map((doc, index) =>
						index === documentIndex
							? { ...doc, recipients: updatedRecipients }
							: doc
					)

					setValue("documents", updatedDocuments)
					await trigger(`documents.${documentIndex}.recipients`)

					// Reset local state
					setSelectedUser(null)
					setRecipientRole("SIGNER")

					setOpen(false)
					toast.success("Recipient added successfully")
				}
			} catch {
				toast.error("Failed to add recipient", {
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
			setRecipientRole("SIGNER")
			setErrors({})
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button
					type="button"
					variant="outline"
					className="h-8 items-center justify-center"
				>
					<PlusIcon className="mt-0.5 !size-3.5" />
					Invite
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<UserPlusIcon className="size-4" />
						Add Recipient
					</DialogTitle>
					<DialogDescription>
						Search and select someone to sign or view this document. For
						envelope approval, use the &quot;Assign Approver&quot; option above.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<UserSearch
						onUserSelect={handleUserSelect}
						placeholder="Search by name or email..."
						label="Select User"
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

					<div className="space-y-2">
						<Label htmlFor="role">Role</Label>
						<Select
							value={recipientRole}
							onValueChange={(value) =>
								setRecipientRole(value as RecipientRole)
							}
						>
							<SelectTrigger className="h-8">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Object.values(RecipientRole)
									.filter((role) => role !== "APPROVER" && role !== "CC")
									.map((role) => (
										<SelectItem key={role} value={role}>
											{normalCase(role)}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
						{errors.role && (
							<p className="text-sm text-destructive">{errors.role}</p>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button
						type="button"
						className="h-8 items-center justify-center"
						onClick={handleAddRecipient}
						disabled={isPending || !selectedUser}
					>
						<PlusIcon className="mt-0.5 !size-3.5" />
						<span>{isPending ? "Adding..." : "Add Recipient"}</span>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
