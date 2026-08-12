"use client"

import {
	CloudUploadIcon,
	FileTextIcon,
	Trash2Icon,
	UserIcon,
	UsersIcon,
	XIcon
} from "lucide-react"
import { useFormContext } from "react-hook-form"

import {
	Alert,
	AlertActions,
	AlertContent,
	AlertDescription,
	AlertTitle
} from "@/core/components/ui/alert"
import { Button } from "@/core/components/ui/button"
import {
	FileUpload,
	FileUploadDropzone,
	FileUploadItem,
	FileUploadItemDelete,
	FileUploadItemMetadata,
	FileUploadItemPreview,
	FileUploadList
} from "@/core/components/ui/file-upload"
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from "@/core/components/ui/form"
import { normalCase } from "@/core/lib/utils"

import {
	type DocumentsSchema,
	type RecipientSchema
} from "@/features/envelopes/api/envelope.schema"

import { InviteRecipientsDialog } from "./invite-recipients-dialog"

export function DocumentUploadSection() {
	const { control, setValue, getValues } = useFormContext<DocumentsSchema>()

	const handleUpdateFileRecipients = (
		fileIndex: number,
		updatedRecipients: RecipientSchema[]
	) => {
		const currentFiles = getValues("documents")
		const updatedFiles = currentFiles.map((fileItem, index) =>
			index === fileIndex
				? { ...fileItem, recipients: updatedRecipients }
				: fileItem
		)
		setValue("documents", updatedFiles)
	}

	const handleRemoveRecipient = (fileIndex: number, recipientIndex: number) => {
		const currentFiles = getValues("documents")
		const targetFile = currentFiles[fileIndex]
		if (targetFile) {
			const updatedRecipients = targetFile.recipients.filter(
				(_, i) => i !== recipientIndex
			)
			handleUpdateFileRecipients(fileIndex, updatedRecipients)
		}
	}

	const handleRemoveFile = (fileIndex: number) => {
		const currentFiles = getValues("documents")
		const updatedFiles = currentFiles.filter((_, i) => i !== fileIndex)
		setValue("documents", updatedFiles)
	}

	return (
		<FormField
			control={control}
			name="documents"
			render={({ field }) => (
				<FormItem>
					<FormLabel className="flex items-center gap-2">
						<FileTextIcon className="size-4" />
						Documents
					</FormLabel>
					<FormControl>
						<FileUpload
							accept="application/pdf"
							multiple
							value={field.value.map((item) => item.file)}
							onChange={(files) =>
								field.onChange(files.map((file) => ({ file, recipients: [] })))
							}
						>
							<FileUploadDropzone className="flex flex-col items-center gap-4 bg-background text-sm">
								<div className="flex flex-col items-center gap-1 text-center">
									<div className="flex items-center justify-center rounded-md border p-2.5">
										<CloudUploadIcon className="size-6" />
									</div>
									<p className="text-sm font-medium">Drag & drop PDFs here</p>
									<p className="text-xs text-muted-foreground">
										Or click to browse (max 2 files, up to 4MB each)
									</p>
								</div>
								<Button
									type="button"
									size={"sm"}
									variant={"outline"}
									className="h-8 bg-transparent"
								>
									Browse Files
								</Button>
							</FileUploadDropzone>

							<FileUploadList>
								{field.value.map((fileItem, index) => (
									<FileUploadItem
										key={index}
										value={fileItem.file}
										className="flex flex-col gap-4 bg-background"
									>
										<div className="relative flex w-full items-center gap-2.5">
											<FileUploadItemPreview />
											<FileUploadItemMetadata />
											<FileUploadItemDelete asChild>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="size-7"
													onClick={() => handleRemoveFile(index)}
												>
													<Trash2Icon />
													<span className="sr-only">Delete</span>
												</Button>
											</FileUploadItemDelete>
										</div>

										<div className="flex w-full flex-col gap-2">
											<div className="flex w-full items-center justify-between pl-3.5 text-sm">
												<div className="flex items-center gap-2">
													<UsersIcon className="size-4" />
													<h3>Recipients ({fileItem.recipients.length})</h3>
												</div>

												<InviteRecipientsDialog documentIndex={index} />
											</div>

											{fileItem.recipients.length > 0 && (
												<div className="flex w-full flex-col space-y-2 pl-3.5">
													{fileItem.recipients.map(
														(recipient, recipientIndex) => (
															<Alert
																key={`${recipient.id}-${recipient.email}-${recipientIndex}`}
															>
																<UserIcon />
																<AlertContent>
																	<AlertTitle>{recipient.name}</AlertTitle>
																	<AlertDescription>
																		{recipient.email} •{" "}
																		{normalCase(recipient.role)}
																	</AlertDescription>
																</AlertContent>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="size-6 hover:bg-destructive/20"
																	onClick={() =>
																		handleRemoveRecipient(index, recipientIndex)
																	}
																	asChild
																>
																	<AlertActions>
																		<XIcon className="size-3" />
																	</AlertActions>
																</Button>
															</Alert>
														)
													)}
												</div>
											)}
										</div>
									</FileUploadItem>
								))}
							</FileUploadList>
						</FileUpload>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	)
}
