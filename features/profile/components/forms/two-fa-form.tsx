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
import { Switch } from "@/core/components/ui/switch"

import { trpc } from "@/services/trpc/client"

import {
	twoFASchema,
	type TwoFASchema
} from "@/features/profile/api/profile.schema"

export function TwoFAForm() {
	const { data } = trpc.profile.security.getTwoFactorStatus.useQuery()

	const form = useForm({
		resolver: zodResolver(twoFASchema),
		values: {
			twoFactorEnabled: data?.twoFactorEnabled ?? false
		}
	})

	const updateTwoFactorStatus =
		trpc.profile.security.updateTwoFactorStatus.useMutation({
			onSuccess: (data) => {
				toast.success(data.message)
				form.reset()
			},
			onError: (error) => toast.error(error.message)
		})

	const onSubmit = (values: TwoFASchema) => updateTwoFactorStatus.mutate(values)

	return (
		<Form {...form}>
			<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="twoFactorEnabled"
					render={({ field }) => (
						<FormItem className="flex items-center justify-between">
							<div>
								<FormLabel className="font-semibold">
									Two Factor Authentication
								</FormLabel>
								<FormDescription>
									Enable two factor authentication
								</FormDescription>
							</div>
							<FormControl>
								<Switch
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button variant="outline" type="submit">
					Update Two Factor Status
				</Button>
			</form>
		</Form>
	)
}
