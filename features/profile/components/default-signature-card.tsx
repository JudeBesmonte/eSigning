"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
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
import { Separator } from "@/core/components/ui/separator"

import { trpc } from "@/services/trpc/client"

import { SignaturePad } from "@/features/default-signature-registration/registration-signature-pad"
import type { SignaturePadRef } from "@/features/default-signature-registration/registration-signature-pad"

export function DefaultSignatureCard() {
	const signaturePadRef = useRef<SignaturePadRef>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [open, setOpen] = useState(false)
	const [hasSignature, setHasSignature] = useState(false)

	// Fetch current default signature
	const { data, refetch, isLoading } =
		trpc.profile.security.getDefaultSignature.useQuery()
	const updateSignature =
		trpc.profile.security.updateDefaultSignature.useMutation()
	const removeSignature =
		trpc.profile.security.removeDefaultSignature.useMutation()

	const handleSave = async () => {
		if (!signaturePadRef.current || !hasSignature) {
			toast.error("Please provide a signature before saving.")
			return
		}

		const signatureData = signaturePadRef.current.getSignatureData()
		const signatureType = signaturePadRef.current.getSignatureType()

		if (!signatureData || !signatureType) {
			toast.error("Please provide a signature before saving.")
			return
		}

		setIsSaving(true)
		try {
			await updateSignature.mutateAsync({
				signatureData,
				signatureType
			})
			toast.success("Default signature saved.")
			await refetch()
			setOpen(false)
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to save signature."
			toast.error(errorMessage)
		} finally {
			setIsSaving(false)
		}
	}

	const handleRemove = async () => {
		setIsSaving(true)
		try {
			await removeSignature.mutateAsync()
			toast.success("Default signature removed.")
			await refetch()
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to remove signature."
			toast.error(errorMessage)
		} finally {
			setIsSaving(false)
		}
	}

	const hasCurrentSignature = Boolean(data?.signature)

	return (
		<Card className="border border-border/60 bg-background/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
			<CardContent className="p-8">
				<div className="space-y-8">
					{/* Section Header */}
					<div>
						<h2 className="text-lg font-medium text-foreground">
							Default Signature
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Save your default signature for quick signing.
						</p>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3">
						<Dialog open={open} onOpenChange={setOpen}>
							<DialogTrigger asChild>
								<Button
									variant={hasCurrentSignature ? "outline" : "default"}
									disabled={isLoading}
									className="transition-all duration-300"
								>
									{hasCurrentSignature ? "Update Signature" : "Add Signature"}
								</Button>
							</DialogTrigger>
							<DialogContent className="max-h-[85vh] w-[90vw] max-w-4xl overflow-y-auto">
								<DialogHeader className="space-y-3">
									<DialogTitle className="text-xl font-medium">
										{hasCurrentSignature
											? "Update Default Signature"
											: "Add Default Signature"}
									</DialogTitle>
									<DialogDescription className="text-sm text-muted-foreground">
										Draw, type, or upload your signature below. This will be
										used as your default signature.
									</DialogDescription>
								</DialogHeader>
								<div className="py-6">
									<SignaturePad
										ref={signaturePadRef}
										onSignatureChange={setHasSignature}
										className="min-h-[250px] w-full"
									/>
								</div>
								<DialogFooter className="gap-3 sm:gap-3">
									<DialogClose asChild>
										<Button variant="outline" type="button">
											Cancel
										</Button>
									</DialogClose>
									<Button
										onClick={handleSave}
										disabled={isSaving || !hasSignature}
										className="transition-all duration-300"
									>
										{isSaving ? "Saving..." : "Save Signature"}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
						{hasCurrentSignature && (
							<Button
								onClick={handleRemove}
								variant="outline"
								disabled={isSaving || isLoading}
								className="transition-all duration-300"
							>
								{isSaving ? "Removing..." : "Remove"}
							</Button>
						)}
					</div>

					{/* Current Signature Display */}
					{hasCurrentSignature && data?.signature && (
						<div className="space-y-4">
							<Separator className="bg-border/60" />
							<div className="space-y-3">
								<h3 className="text-sm font-medium text-foreground">
									Current Default Signature
								</h3>
								<div className="rounded-lg border border-border/60 bg-gradient-to-br from-slate-50 to-slate-100 p-6 shadow-inner dark:from-slate-800 dark:to-slate-900">
									<div className="flex justify-center">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={data.signature}
											alt="Default signature preview"
											className="max-h-24 max-w-full rounded-md border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-300 dark:bg-slate-100"
											style={{ maxWidth: "400px" }}
										/>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
