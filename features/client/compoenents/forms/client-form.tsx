"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, Loader2, User } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
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

import {
	createUserSchema,
	type CreateUserInput,
	type UserRole
} from "../../api/user.schema"

interface ClientFormProps {
	onSuccess?: () => void
	onCancel?: () => void
}

const roleOptions: {
	value: UserRole
	label: string
	description: string
	icon: typeof User
}[] = [
	{
		value: "CLIENT",
		label: "Client",
		description: "Standard client account",
		icon: User
	},
	{
		value: "ADMIN",
		label: "Administrator",
		description: "Administrative user with elevated privileges",
		icon: Building2
	},
	{
		value: "SUPER_ADMIN",
		label: "Super Administrator",
		description: "Super admin with full system access",
		icon: User
	}
]

export function ClientForm({ onSuccess, onCancel }: ClientFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false)

	const form = useForm<CreateUserInput>({
		resolver: zodResolver(createUserSchema),
		defaultValues: {
			name: "",
			email: "",
			role: "CLIENT",
			organization: null
		}
	})

	const createUserMutation = trpc.user.create.useMutation({
		onSuccess: (data) => {
			toast.success("Client Added Successfully", {
				description: `${data.name} has been added to your client list.`
			})
			form.reset()
			onSuccess?.()
		},
		onError: (error) => {
			toast.error("Failed to Add Client", {
				description:
					error.message || "An error occurred while adding the client."
			})
		},
		onSettled: () => {
			setIsSubmitting(false)
		}
	})

	const watchedRole = form.watch("role")
	const showOrganization =
		watchedRole === "ADMIN" || watchedRole === "SUPER_ADMIN"

	const onSubmit = async (data: CreateUserInput) => {
		setIsSubmitting(true)
		createUserMutation.mutate(data)
	}

	return (
		<Card className="mx-auto w-full max-w-2xl">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<User className="h-5 w-5" />
					Add New Client
				</CardTitle>
				<CardDescription>
					Enter the details of your new client to add them to your client list.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* Name Field */}
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Client Name *</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter client name"
											{...field}
											disabled={isSubmitting}
										/>
									</FormControl>
									<FormDescription>
										Full name of the client or business
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Email Field */}
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email Address *</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="client@example.com"
											{...field}
											disabled={isSubmitting}
										/>
									</FormControl>
									<FormDescription>
										Primary email address for communication
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Password Field */}
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password *</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="Enter a secure password"
											{...field}
											disabled={isSubmitting}
										/>
									</FormControl>
									<FormDescription>
										Password for the client account (minimum 8 characters)
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Role Field */}
						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Client Type *</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										disabled={isSubmitting}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select client type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{roleOptions.map((option) => {
												const Icon = option.icon
												return (
													<SelectItem key={option.value} value={option.value}>
														<div className="flex items-center gap-2">
															<Icon className="h-4 w-4" />
															<div>
																<div className="font-medium">
																	{option.label}
																</div>
																<div className="text-xs text-gray-500">
																	{option.description}
																</div>
															</div>
														</div>
													</SelectItem>
												)
											})}
										</SelectContent>
									</Select>
									<FormDescription>
										Select the type of client account
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Organization Field - Conditional */}
						{showOrganization && (
							<FormField
								control={form.control}
								name="organization"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Organization {watchedRole === "ADMIN" ? "*" : ""}
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter organization name"
												{...field}
												value={field.value ?? ""}
												disabled={isSubmitting}
											/>
										</FormControl>
										<FormDescription>
											{watchedRole === "ADMIN"
												? "Organization or company name"
												: "Organization or firm name (optional)"}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{/* Form Actions */}
						<div className="flex flex-col-reverse space-y-2 space-y-reverse sm:flex-row sm:justify-end sm:space-x-2 sm:space-y-0">
							{onCancel && (
								<Button
									type="button"
									variant="outline"
									onClick={onCancel}
									disabled={isSubmitting}
								>
									Cancel
								</Button>
							)}
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{isSubmitting ? "Adding Client..." : "Add Client"}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	)
}
