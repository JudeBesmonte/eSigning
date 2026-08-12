"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/core/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/core/components/ui/dialog"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from "@/core/components/ui/form"
import { Input } from "@/core/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"

import { userRoleSchema, type User } from "../api/user.schema"

const editUserSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	role: userRoleSchema,
	organization: z.string().optional()
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface EditUserDialogProps {
	user: User | null
	isOpen: boolean
	onClose: () => void
	onSave: (userId: string, data: EditUserFormData) => Promise<void>
}

export function EditUserDialog({
	user,
	isOpen,
	onClose,
	onSave
}: EditUserDialogProps) {
	const [isLoading, setIsLoading] = useState(false)

	const form = useForm<EditUserFormData>({
		resolver: zodResolver(editUserSchema),
		defaultValues: {
			name: "",
			email: "",
			role: "CLIENT",
			organization: ""
		}
	})

	// Update form values when user changes
	useEffect(() => {
		if (user) {
			form.reset({
				name: user.name ?? "",
				email: user.email ?? "",
				role: user.role,
				organization: user.organization ?? ""
			})
		}
	}, [user, form])

	const handleSubmit = async (data: EditUserFormData) => {
		if (!user) return

		setIsLoading(true)
		try {
			await onSave(user.id, data)
			onClose()
		} catch (error) {
			console.error("Failed to update user:", error)
			// You could add toast notification here
		} finally {
			setIsLoading(false)
		}
	}

	const handleClose = () => {
		form.reset()
		onClose()
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Edit User</DialogTitle>
					<DialogDescription>
						Make changes to the user information. Click save when you&apos;re
						done.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="Enter user name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter email address"
											type="email"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Role</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a role" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="CLIENT">Client</SelectItem>
											<SelectItem value="ADMIN">Administrator</SelectItem>
											<SelectItem value="SUPER_ADMIN">
												Super Administrator
											</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="organization"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Organization (Optional)</FormLabel>
									<FormControl>
										<Input placeholder="Enter organization name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={handleClose}>
								Cancel
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "Saving..." : "Save Changes"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
