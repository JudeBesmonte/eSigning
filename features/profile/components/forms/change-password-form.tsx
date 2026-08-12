"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/core/components/ui/button"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from "@/core/components/ui/form"
import { InputPassword } from "@/core/components/ui/input-password"

import { trpc } from "@/services/trpc/client"

import {
	changePasswordSchema,
	type ChangePasswordSchema
} from "@/features/profile/api/profile.schema"

export function ChangePasswordForm() {
	const form = useForm({
		resolver: zodResolver(changePasswordSchema),
		values: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: ""
		}
	})

	const updatePassword = trpc.profile.security.updatePassword.useMutation({
		onSuccess: (data) => {
			toast.success(data.message)
			form.reset()
		},
		onError: (error) => toast.error(error.message)
	})

	const onSubmit = (values: ChangePasswordSchema) => {
		updatePassword.mutate(values)
	}

	return (
		<Form {...form}>
			<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
				<h3 className="font-medium">Password</h3>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="currentPassword"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-card-foreground">
									Current Password
								</FormLabel>
								<FormControl>
									<InputPassword {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="newPassword"
						render={({ field }) => (
							<FormItem className="md:row-start-2">
								<FormLabel className="text-card-foreground">
									New Password
								</FormLabel>
								<FormControl>
									<InputPassword {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="confirmPassword"
						render={({ field }) => (
							<FormItem className="md:row-start-2">
								<FormLabel className="text-card-foreground">
									Confirm Password
								</FormLabel>
								<FormControl>
									<InputPassword {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<Button variant="outline" type="submit">
					Change Password
				</Button>
			</form>
		</Form>
	)
}
