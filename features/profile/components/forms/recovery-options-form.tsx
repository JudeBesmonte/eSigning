"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/core/components/ui/button"
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

import { trpc } from "@/services/trpc/client"

import {
	recoveryOptionsSchema,
	type RecoveryOptionsSchema
} from "@/features/profile/api/profile.schema"

export function RecoveryOptionsForm() {
	const { data } = trpc.profile.security.getRecoveryOptions.useQuery()

	const form = useForm({
		resolver: zodResolver(recoveryOptionsSchema),
		values: {
			recoveryEmail: data?.recoveryEmail ?? "",
			phone: data?.phone ?? ""
		}
	})

	const updateRecoveryOptions =
		trpc.profile.security.updateRecoveryOptions.useMutation({
			onSuccess: (data) => {
				toast.success(data.message)
				// Reset with the current values to avoid clearing the form
				form.reset({
					recoveryEmail: form.getValues("recoveryEmail"),
					phone: form.getValues("phone")
				})
			},
			onError: (error) => toast.error(error.message)
		})

	const onSubmit = (values: RecoveryOptionsSchema) => {
		updateRecoveryOptions.mutate(values)
	}

	return (
		<Form {...form}>
			<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
				<h3 className="font-medium">Recovery Options</h3>
				<p className="text-sm text-muted-foreground">
					Set up alternative ways to regain access to your account if you forget
					your password.
				</p>

				<FormField
					control={form.control}
					name="recoveryEmail"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Recovery Email (Optional)</FormLabel>
							<FormControl>
								<Input
									type="email"
									placeholder="alternate-email@example.com"
									{...field}
								/>
							</FormControl>
							<FormDescription>
								An alternative email address used to recover your account. This
								should be different from your primary email.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="phone"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Recovery Phone (Optional)</FormLabel>
							<FormControl>
								<Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
							</FormControl>
							<FormDescription>
								A phone number for account recovery and security notifications.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button
					type="submit"
					disabled={updateRecoveryOptions.isPending}
					className="w-full"
				>
					{updateRecoveryOptions.isPending
						? "Updating..."
						: "Update Recovery Options"}
				</Button>
			</form>
		</Form>
	)
}
