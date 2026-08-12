"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { QuanbyLogo } from "@/core/components/quanby-logo"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"

import { trpc } from "@/services/trpc/client"

import {
	SignaturePad,
	type SignaturePadRef
} from "@/features/default-signature-registration/registration-signature-pad"

interface DefaultSignatureRegistrationProps {
	callbackUrl?: string
}

export function DefaultSignatureRegistration({
	callbackUrl
}: DefaultSignatureRegistrationProps) {
	const router = useRouter()
	const signaturePadRef = useRef<SignaturePadRef>(null)
	const [hasSignature, setHasSignature] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const saveDefaultSignature =
		trpc.signatureRegistration.saveDefaultSignature.useMutation({
			onSuccess: () => {
				toast.success("Default signature saved successfully!")
				// Redirect to callback URL if provided, otherwise to dashboard
				// Make sure to preserve the full URL with all parameters
				const redirectUrl = callbackUrl ?? "/dashboard"
				console.log("🔍 Redirecting to:", redirectUrl)
				router.push(redirectUrl)
			},
			onError: (error) => {
				toast.error(error.message || "Failed to save signature")
			}
		})

	const handleSignatureChange = (hasSignature: boolean) => {
		setHasSignature(hasSignature)
	}

	const handleSubmit = async () => {
		if (!hasSignature || !signaturePadRef.current) {
			toast.error("Please create a signature first")
			return
		}

		const signatureData = signaturePadRef.current.getSignatureData()
		const signatureType = signaturePadRef.current.getSignatureType()

		if (!signatureData || !signatureType) {
			toast.error("Failed to get signature data")
			return
		}

		setIsSubmitting(true)
		try {
			await saveDefaultSignature.mutateAsync({
				signatureData,
				signatureType
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleSkip = () => {
		// Redirect to callback URL if provided, otherwise to dashboard
		const redirectUrl = callbackUrl ?? "/dashboard"
		console.log("🔍 Skipping - redirecting to:", redirectUrl)
		router.push(redirectUrl)
	}

	return (
		<Card className="w-full">
			<CardHeader className="text-center">
				<div className="mb-4 flex justify-center">
					<QuanbyLogo className="h-16 w-16" />
				</div>
				<CardTitle className="text-2xl">
					Set Up Your Default Signature
				</CardTitle>
				<CardDescription>
					Create a signature that will be used as your default for all
					documents. You can change this later in your profile settings.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="rounded-lg border bg-muted/30 p-4">
					<h3 className="mb-4 text-lg font-semibold">Create Your Signature</h3>
					<SignaturePad
						ref={signaturePadRef}
						onSignatureChange={handleSignatureChange}
						className="min-h-[300px]"
					/>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row">
					<Button
						onClick={handleSubmit}
						disabled={!hasSignature || isSubmitting}
						className="flex-1"
					>
						{isSubmitting ? "Saving..." : "Save Default Signature"}
					</Button>
					<Button
						variant="outline"
						onClick={handleSkip}
						disabled={isSubmitting}
						className="flex-1 sm:flex-initial"
					>
						Skip for Now
					</Button>
				</div>

				<p className="text-center text-sm text-muted-foreground">
					Having a default signature will speed up the document signing process.
				</p>
			</CardContent>
		</Card>
	)
}
