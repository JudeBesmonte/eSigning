"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
// import type { Role } from "@prisma/client"
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
import { useSession } from "next-auth/react"
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

import { userInputSchema } from "../api/user.schema"

type UserFormData = z.infer<typeof userInputSchema>

interface UserModalProps {
	isOpen: boolean
	onClose: () => void
	onSuccess?: () => void
}

export function User2Modal({ isOpen, onClose, onSuccess }: UserModalProps) {
	const [isLoading, setIsLoading] = useState(false)
	const { data: session } = useSession()

	// Safely get the current user's role with a default fallback
	const currentUserRole = session?.user?.role ?? ("CLIENT" as const)

	// Define available roles based on current user's role
	const getAvailableRoles = () => {
		switch (currentUserRole) {
			case "SUPER_ADMIN":
				return [
					{ value: "ADMIN" as const, label: "Admin" },
					{ value: "CLIENT" as const, label: "Client" },
					{ value: "SUPER_ADMIN" as const, label: "Super Admin" }
				]
			case "ADMIN":
				return [{ value: "CLIENT" as const, label: "Client" }]
			default:
				return [{ value: "CLIENT" as const, label: "Client" }]
		}
	}

	const availableRoles = getAvailableRoles()

	const form = useForm<UserFormData>({
		resolver: zodResolver(userInputSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
			role: availableRoles[0]?.value ?? "CLIENT",
			organization: "",
			phone: "",
			image: ""
		},
		mode: "onChange"
	})

	const createUser = trpc.userManagement2.create.useMutation({
		onSuccess: () => {
			toast.success("User created successfully")
			form.reset()
			onClose()
			onSuccess?.()
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create user")
		},
		onSettled: () => {
			setIsLoading(false)
		}
	})

	const onSubmit = (data: UserFormData) => {
		setIsLoading(true)

		const selectedRole = availableRoles.some((r) => r.value === data.role)
			? data.role
			: (availableRoles[0]?.value ?? "CLIENT")

		// Create the user data object with all required fields for the API
		const userData = {
			name: data.name,
			email: data.email,
			password: data.password,
			confirmPassword: data.confirmPassword,
			role: selectedRole,
			organization: data.organization ?? undefined
		}

		createUser.mutate(userData, {
			onSuccess: () => {
				onClose()
				onSuccess?.()
				setIsLoading(false)
			},
			onError: () => {
				setIsLoading(false)
			}
		})
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Add New User</DialogTitle>
					<DialogDescription>
						Create a new user account. An invitation email will be sent to the
						provided email address.
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
											Full Name
										</FormLabel>
										<FormControl>
											<Input
												placeholder="John Doe"
												value={field.value ?? ""}
												onChange={field.onChange}
												onBlur={field.onBlur}
												name={field.name}
												ref={field.ref}
											/>
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
											Email Address
										</FormLabel>
										<FormControl>
											<Input
												placeholder="john@example.com"
												type="email"
												value={field.value ?? ""}
												onChange={field.onChange}
												onBlur={field.onBlur}
												name={field.name}
												ref={field.ref}
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
											defaultValue={availableRoles[0]?.value ?? ""}
											disabled={isLoading || availableRoles.length === 0}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={
															availableRoles.length === 0
																? "No available roles"
																: "Select a role"
														}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{availableRoles.map((role) => (
													<SelectItem key={role.value} value={role.value}>
														{role.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{availableRoles.length === 0 && (
											<FormDescription className="text-amber-600">
												You don&apos;t have permission to create users.
											</FormDescription>
										)}
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
											Organization (Optional)
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Acme Inc."
												value={field.value ?? ""}
												onChange={field.onChange}
												onBlur={field.onBlur}
												name={field.name}
												ref={field.ref}
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
											Phone Number (Optional)
										</FormLabel>
										<FormControl>
											<Input
												placeholder="+1 (555) 123-4567"
												value={field.value ?? ""}
												onChange={field.onChange}
												onBlur={field.onBlur}
												name={field.name}
												ref={field.ref}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center">
											<Lock className="mr-2 h-4 w-4 text-muted-foreground" />
											Password
										</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder="Enter password"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Must be at least 8 characters long
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="flex items-center">
											<CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
											Confirm Password
										</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder="Confirm your password"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={onClose}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Creating...
									</>
								) : (
									"Create User"
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
