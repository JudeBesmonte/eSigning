"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { SaveIcon } from "lucide-react"
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
import { Separator } from "@/core/components/ui/separator"
import { Switch } from "@/core/components/ui/switch"

import { trpc } from "@/services/trpc/client"

import {
	notificationSettingsSchema,
	type NotificationSettingsSchema
} from "@/features/profile/api/profile.schema"

export function NotificationSettingsForm() {
	const { data } = trpc.profile.getNotificationSettings.useQuery()

	const form = useForm({
		resolver: zodResolver(notificationSettingsSchema),
		values: {
			emailNotifications: data?.emailNotifications ?? false,
			documentUpdates: data?.documentUpdates ?? false,
			signingReminders: data?.signingReminders ?? false,
			systemAlerts: data?.systemAlerts ?? false,
			marketingEmails: data?.marketingEmails ?? false
		}
	})

	const updateNotificationSettings =
		trpc.profile.updateNotificationSettings.useMutation({
			onSuccess: (data) => toast.success(data.message)
		})

	const onSubmit = (values: NotificationSettingsSchema) => {
		updateNotificationSettings.mutate(values)
	}
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="emailNotifications"
					render={({ field }) => (
						<FormItem className="flex items-center justify-between">
							<div>
								<FormLabel>Email Notifications</FormLabel>
								<FormDescription>
									Receive notifications via email
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

				<Separator />

				<FormField
					control={form.control}
					name="documentUpdates"
					render={({ field }) => (
						<FormItem className="flex items-center justify-between">
							<div>
								<FormLabel>Document Updates</FormLabel>
								<FormDescription>
									Notifications about document status changes
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

				<FormField
					control={form.control}
					name="signingReminders"
					render={({ field }) => (
						<FormItem className="flex items-center justify-between">
							<div>
								<FormLabel>Signing Reminders</FormLabel>
								<FormDescription>
									Receive reminders for upcoming signing events
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

				<FormField
					control={form.control}
					name="systemAlerts"
					render={({ field }) => (
						<FormItem className="flex items-center justify-between">
							<div>
								<FormLabel>System Alerts</FormLabel>
								<FormDescription>
									Receive alerts about system issues and maintenance
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

				<FormField
					control={form.control}
					name="marketingEmails"
					render={({ field }) => (
						<FormItem className="flex items-center justify-between">
							<div>
								<FormLabel>Marketing Emails</FormLabel>
								<FormDescription>
									Receive marketing emails from our partners
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

				<Button
					type="submit"
					className="!mt-6"
					disabled={updateNotificationSettings.isPending}
				>
					<SaveIcon className="h-4 w-4" />
					Save Notification Settings
				</Button>
			</form>
		</Form>
	)
}
