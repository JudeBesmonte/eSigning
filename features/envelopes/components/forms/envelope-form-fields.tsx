"use client"

import { useFormContext } from "react-hook-form"

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from "@/core/components/ui/form"
import { Input } from "@/core/components/ui/input"
import { Textarea } from "@/core/components/ui/textarea"

import { type EnvelopeSchema } from "@/features/envelopes/api/envelope.schema"

export function EnvelopeFormFields() {
	const { control } = useFormContext<EnvelopeSchema>()

	return (
		<>
			<FormField
				control={control}
				name="title"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Title</FormLabel>
						<FormControl>
							<Input placeholder="Enter envelope title" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={control}
				name="description"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Description (optional)</FormLabel>
						<FormControl>
							<Textarea placeholder="Add a message for recipients" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	)
}
