"use client"

import { useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileTextIcon, PlusIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import { Form } from "@/core/components/ui/form"
import { Separator } from "@/core/components/ui/separator"

import { usePresignedUrl } from "@/services/supabase/presigned-url"
import { useUploadFile } from "@/services/supabase/upload"
import { trpc } from "@/services/trpc/client"

import {
	createEnvelopeSchema,
	type CreateEnvelopeSchema
} from "@/features/envelopes/api/envelope.schema"

import { DocumentUploadSection } from "./document-upload-section"
import { EnvelopeFormFields } from "./envelope-form-fields"

export function CreateEnvelopeForm() {
	const [isPending, startTransition] = useTransition()

	const form = useForm<CreateEnvelopeSchema>({
		resolver: zodResolver(createEnvelopeSchema),
		defaultValues: {
			title: "",
			description: "",
			documents: []
		}
	})

	const createEnvelope = trpc.envelope.createEnvelope.useMutation()
	const createDocuments = trpc.envelope.createManyDocuments.useMutation()

	const presignedUrl = usePresignedUrl()
	const uploadFile = useUploadFile()

	const onSubmit = async (data: CreateEnvelopeSchema) => {
		startTransition(async () => {
			try {
				const { id: envelopeId } = await createEnvelope.mutateAsync(data)

				for (const [, doc] of data.documents.entries()) {
					if (!doc) continue

					const folderPath = `${envelopeId}/unsigned`
					const presign = await presignedUrl.mutateAsync({
						file: doc.file,
						bucket: "envelopes",
						folderPath,
						upsert: false
					})

					await uploadFile.mutateAsync({
						signedUrl: presign.signedUrl,
						file: doc.file
					})

					await createDocuments.mutateAsync({
						envelopeId,
						name: doc.file.name,
						type: doc.file.type,
						size: doc.file.size,
						path: presign.path,
						recipients: doc.recipients
					})
				}

				toast.success("Envelope and documents created!")
				form.reset()
			} catch (err) {
				console.error(err)
				toast.error("Failed to create envelope")
			}
		})
	}

	return (
		<Card>
			<CardHeader className="flex-row items-center space-x-2 space-y-0">
				<FileTextIcon className="size-5" />
				<CardTitle>Create New Envelope</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
						<EnvelopeFormFields />

						<Separator />

						<DocumentUploadSection />

						<Separator />

						<div className="flex w-full justify-end">
							<Button type="submit" disabled={isPending}>
								{isPending ? (
									"Creating..."
								) : (
									<>
										<PlusIcon />
										Create Envelope
									</>
								)}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	)
}
