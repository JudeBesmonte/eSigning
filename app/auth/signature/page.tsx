import { redirect } from "next/navigation"

import { auth } from "@/services/next-auth"
import { db } from "@/services/prisma/db"

import { DefaultSignatureRegistration } from "@/features/default-signature-registration/default-signature-registration"

export default async function SignatureRegistrationPage({
	searchParams
}: {
	searchParams: Promise<{ callbackUrl?: string }>
}) {
	const session = await auth()
	if (!session?.user) redirect("/auth/login")

	const user = await db.user.findUnique({
		where: { id: session.user.id },
		select: { defaultSignature: true }
	})

	if (user?.defaultSignature) {
		const redirectUrl = (await searchParams).callbackUrl ?? "/"
		// Optionally log for debugging in dev only
		if (process.env.NODE_ENV === "development") {
			console.log(
				"🔍 Signature page - User has signature, redirecting to:",
				redirectUrl
			)
		}
		redirect(redirectUrl)
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-2xl">
				<DefaultSignatureRegistration
					callbackUrl={(await searchParams).callbackUrl}
				/>
			</div>
		</div>
	)
}
