"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { UserPlusIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/core/components/ui/button"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
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
import { InputPassword } from "@/core/components/ui/input-password"
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
	type CreateUserInput
} from "@/features/user-management/api/user-management.schema"

export function AddUserDialog() {
	const utils = trpc.useUtils()

	const form = useForm<CreateUserInput>({
		resolver: zodResolver(createUserSchema),
		defaultValues: {
			name: "",
			email: "",
			role: "CLIENT",
			password: ""
		}
	})

	const createUserMutation = trpc.userManagement.create.useMutation({
		onSuccess: () => {
			toast.success("User created successfully")
			form.reset()
			// Invalidate and refetch user list and stats
			void utils.userManagement.list.invalidate()
			void utils.userManagement.stats.invalidate()
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create user")
		}
	})

	const onSubmit = (data: CreateUserInput) => createUserMutation.mutate(data)

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button>
					<UserPlusIcon />
					Add User
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add New User</DialogTitle>
					<DialogDescription>
						Create a new user account. Fill in the required information below.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-foreground">Name</FormLabel>
									<FormControl>
										<Input placeholder="Enter your full name" {...field} />
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
									<FormLabel className="text-foreground">Email</FormLabel>
									<FormControl>
										<Input placeholder="Enter your email" {...field} />
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
									<FormLabel className="text-foreground">Password</FormLabel>
									<FormControl>
										<InputPassword placeholder="Enter password" {...field} />
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
									<FormLabel className="text-foreground">Role</FormLabel>
									<FormControl>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger>
												<SelectValue placeholder="Select role" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="CLIENT">Client</SelectItem>
												<SelectItem value="ADMIN">Administrator</SelectItem>
												<SelectItem value="SUPER_ADMIN">
													Super Administrator
												</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<DialogClose asChild>
								<Button variant="outline">Cancel</Button>
							</DialogClose>

							<Button type="submit" disabled={createUserMutation.isPending}>
								{createUserMutation.isPending ? "Creating..." : "Create User"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
