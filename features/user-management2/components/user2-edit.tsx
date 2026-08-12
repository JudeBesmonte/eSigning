"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Role } from "@prisma/client"
import {
	Building,
	CheckCircle,
	Loader2,
	Lock,
	Mail,
	Phone,
	Shield,
	User
} from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"

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
	FormDescription,
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

import { trpc } from "@/services/trpc/client"

import { userUpdateSchema } from "../api/user.schema"
import type { UserWithRelations } from "../api/usermanagement2.router"

type UserFormData = z.infer<typeof userUpdateSchema>

interface UserEditProps {
	user: UserWithRelations | null
	isOpen: boolean
	onClose: () => void
	onSuccess?: () => void
}

export function UserEdit({ user, isOpen, onClose, onSuccess }: UserEditProps) {
	const [isLoading, setIsLoading] = useState(false)

	const form = useForm<UserFormData>({
		resolver: zodResolver(userUpdateSchema),
		defaultValues: {
			id: user?.id ?? "",
			name: user?.name ?? "",
			email: user?.email ?? "",
			role: user?.role ?? "CLIENT",
			organization: user?.organization ?? undefined,
			phone: user?.phone ?? undefined,
			image: user?.image ?? undefined,
			password: undefined // Optional field for password updates
		},
		mode: "onChange"
	})

	// Update form values when user changes
	if (user && form.getValues("id") !== user.id) {
		form.reset({
			id: user.id,
			name: user.name ?? "",
			email: user.email ?? "",
			role: user.role,
			organization: user.organization ?? undefined,
			phone: user.phone ?? undefined,
			image: user.image ?? undefined,
			password: undefined // Don't pre-fill password
		})
	}

	const updateUser = trpc.userManagement2.update.useMutation({
		onSuccess: () => {
			toast.success("User updated successfully")
			onClose()
			onSuccess?.()
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update user")
		},
		onSettled: () => {
			setIsLoading(false)
		}
	})

	const onSubmit = (data: UserFormData) => {
		setIsLoading(true)
		// Convert null values to undefined to match the expected type
		const userData = {
			...data,
			organization: data.organization ?? undefined
		}
		updateUser.mutate(userData)
	}

	if (!user) return null

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Edit User</DialogTitle>
					<DialogDescription>
						Update the user&apos;s information below. Click save when
						you&apos;re done.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid gap-4 py-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center">
											<User className="mr-2 h-4 w-4 text-muted-foreground" />
											Name
										</FormLabel>
										<FormControl>
											<Input placeholder="John Doe" {...field} />
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
										<FormLabel className="flex items-center">
											<Mail className="mr-2 h-4 w-4 text-muted-foreground" />
											Email
										</FormLabel>
										<FormControl>
											<Input
												placeholder="john@example.com"
												{...field}
												disabled={true}
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
										<FormLabel className="flex items-center">
											<Shield className="mr-2 h-4 w-4 text-muted-foreground" />
											Role
										</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
											disabled={isLoading}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a role" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{Object.values(Role).map((role) => (
													<SelectItem key={role} value={role}>
														{role
															.split("_")
															.map(
																(word) =>
																	word.charAt(0) + word.slice(1).toLowerCase()
															)
															.join(" ")}
													</SelectItem>
												))}
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
										<FormLabel className="flex items-center">
											<Building className="mr-2 h-4 w-4 text-muted-foreground" />
											Organization
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Acme Inc."
												{...field}
												value={field.value ?? ""}
												onChange={field.onChange}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center">
											<Phone className="mr-2 h-4 w-4 text-muted-foreground" />
											Phone Number
										</FormLabel>
										<FormControl>
											<Input
												placeholder="+1 (555) 000-0000"
												{...field}
												value={field.value ?? ""}
												onChange={field.onChange}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Password Update Section */}
						<div className="space-y-4 border-t border-border pt-4">
							<h4 className="text-sm font-medium">Change Password</h4>
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center">
												<Lock className="mr-2 h-4 w-4 text-muted-foreground" />
												New Password
											</FormLabel>
											<FormControl>
												<Input
													type="password"
													placeholder="••••••••"
													{...field}
													value={field.value ?? ""}
													onChange={field.onChange}
												/>
											</FormControl>
											<FormDescription className="text-xs">
												Leave blank to keep current password
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						<DialogFooter className="mt-6">
							<Button
								type="button"
								variant="outline"
								onClick={onClose}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isLoading || !form.formState.isDirty}
								className="gap-2"
							>
								{isLoading ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									<>
										<CheckCircle className="h-4 w-4" />
										Save Changes
									</>
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
