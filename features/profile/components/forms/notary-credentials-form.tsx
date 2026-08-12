"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, FileTextIcon, SaveIcon, ShieldIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/core/components/ui/button"
import { Calendar } from "@/core/components/ui/calendar"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from "@/core/components/ui/form"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from "@/core/components/ui/popover"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"
import { cn } from "@/core/lib/utils"

import { trpc } from "@/services/trpc/client"

import {
	notaryInformationSchema,
	type NotaryInformationSchema
} from "@/features/profile/api/profile.schema"

export function NotaryCredentialsForm() {
	const { data } = trpc.profile.getNotaryInformation.useQuery()

	const form = useForm({
		resolver: zodResolver(notaryInformationSchema),
		values: {
			notaryId: data?.notaryId ?? "",
			state: data?.state ?? "",
			expiration: data?.expiration
		}
	})

	const updateNotaryInformation =
		trpc.profile.updateNotaryInformation.useMutation({
			onSuccess: (data) => toast.success(data.message)
		})

	const onSubmit = (values: NotaryInformationSchema) => {
		updateNotaryInformation.mutate(values)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="notaryId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Notary ID</FormLabel>
								<FormControl>
									<Input placeholder="Enter your notary ID" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="state"
						render={({ field }) => (
							<FormItem>
								<FormLabel>State</FormLabel>
								<FormControl>
									<Select {...field}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="New York">New York</SelectItem>
											<SelectItem value="California">California</SelectItem>
											<SelectItem value="Texas">Texas</SelectItem>
											<SelectItem value="Florida">Florida</SelectItem>
											<SelectItem value="Illinois">Illinois</SelectItem>
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="expiration"
					render={({ field }) => (
						<FormItem className="flex flex-col">
							<FormLabel>Commision Expiration Date</FormLabel>
							<Popover>
								<PopoverTrigger asChild>
									<FormControl>
										<Button
											variant={"outline"}
											className={cn(
												"pl-3 text-left font-normal",
												!field.value && "text-muted-foreground"
											)}
										>
											{field.value ? (
												format(field.value, "PPP")
											) : (
												<span>Pick a date</span>
											)}
											<CalendarIcon className="ml-auto size-4 opacity-50" />
										</Button>
									</FormControl>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={field.value}
										onSelect={field.onChange}
										disabled={(date) =>
											date > new Date() || date < new Date("1900-01-01")
										}
										captionLayout="dropdown"
									/>
								</PopoverContent>
							</Popover>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="space-y-2">
					<Label>Upload Notary Certificate</Label>
					<div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
						<div className="flex flex-col items-center">
							<FileTextIcon className="mb-2 size-8 text-gray-400" />
							<p className="mb-2 text-sm text-gray-600">
								Drag and drop your certificate here, or click to browse
							</p>
							<p className="mb-4 text-xs text-gray-500">
								Supports PDF, JPG, PNG files up to 5MB
							</p>
							<input type="file" className="hidden" id="certificate-upload" />
							<Button asChild variant="outline" size="sm">
								<label htmlFor="certificate-upload" className="cursor-pointer">
									Upload Certificate
								</label>
							</Button>
						</div>
					</div>
				</div>

				<div className="space-y-2">
					<Label>Upload Digital Seal</Label>
					<div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
						<div className="flex flex-col items-center">
							<ShieldIcon className="mb-2 size-8 text-gray-400" />
							<p className="mb-2 text-sm text-gray-600">
								Drag and drop your digital seal here, or click to browse
							</p>
							<p className="mb-4 text-xs text-gray-500">
								Supports PNG, JPG files up to 2MB
							</p>
							<input type="file" className="hidden" id="seal-upload" />
							<Button asChild variant="outline" size="sm">
								<label htmlFor="seal-upload" className="cursor-pointer">
									Upload Seal
								</label>
							</Button>
						</div>
					</div>
				</div>

				<Button
					type="submit"
					className="!mt-6"
					disabled={updateNotaryInformation.isPending}
				>
					<SaveIcon className="size-4" />
					Save Credentials
				</Button>
			</form>
		</Form>
	)
}
