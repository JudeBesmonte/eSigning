"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { SaveIcon } from "lucide-react"
import { useSession } from "next-auth/react"
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
import { Input } from "@/core/components/ui/input"

// import {
// 	Select,
// 	SelectContent,
// 	SelectItem,
// 	SelectTrigger,
// 	SelectValue
// } from "@/core/components/ui/select"

// import { Textarea } from "@/core/components/ui/textarea"

import { trpc } from "@/services/trpc/client"

import {
	personalInformationSchema,
	type PersonalInformationSchema
} from "@/features/profile/api/profile.schema"

export const PersonalInformationForm = () => {
	const { data } = trpc.profile.getPersonalInformation.useQuery()

	const form = useForm({
		resolver: zodResolver(personalInformationSchema),
		values: {
			name: data?.name ?? "",
			email: data?.email ?? "",
			phone: data?.phone ?? "",
			organization: data?.organization ?? ""
		}
	})

	const { update: updateSession } = useSession()
	const router = useRouter()
	const utils = trpc.useUtils()

	const updatePersonalInformation =
		trpc.profile.updatePersonalInformation.useMutation({
			onSuccess: async (data) => {
				await Promise.all([
					router.refresh(),
					updateSession({ user: data.user }),
					utils.profile.getPersonalInformation.invalidate()
				])
				toast.success(data.message)
			},
			onError: (err) => toast.error(err.message)
		})

	const onSubmit = (values: PersonalInformationSchema) => {
		updatePersonalInformation.mutate(values)
	}

	return (
		<div className="space-y-8">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem className="space-y-3">
									<FormLabel className="text-sm font-medium text-foreground">
										Full Name
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter your full name"
											className="h-11 border-border/50 bg-background/50 transition-colors focus:bg-background"
											{...field}
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
								<FormItem className="space-y-3">
									<FormLabel className="text-sm font-medium text-foreground">
										Email Address
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter your email address"
											type="email"
											className="h-11 border-border/50 bg-background/50 transition-colors focus:bg-background"
											{...field}
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
								<FormItem className="space-y-3">
									<FormLabel className="text-sm font-medium text-foreground">
										Phone Number
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter your phone number"
											type="tel"
											className="h-11 border-border/50 bg-background/50 transition-colors focus:bg-background"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="organization"
							render={({ field }) => (
								<FormItem className="space-y-3">
									<FormLabel className="text-sm font-medium text-foreground">
										Organization
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter your organization"
											className="h-11 border-border/50 bg-background/50 transition-colors focus:bg-background"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="flex justify-center pt-6">
						<Button
							type="submit"
							className="h-11 px-8 font-medium shadow-sm transition-all duration-200 hover:shadow-md"
							disabled={updatePersonalInformation.isPending}
							size="lg"
						>
							{updatePersonalInformation.isPending ? (
								<>
									<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
									Saving Changes...
								</>
							) : (
								<>
									<SaveIcon className="mr-2 h-4 w-4" />
									Save Changes
								</>
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	)
}
