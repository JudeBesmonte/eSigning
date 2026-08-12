import type { Metadata } from "next"

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form"

export const metadata: Metadata = {
	title: "Reset Password - Quanby Sign",
	description: "Create a new password for your Quanby Sign account"
}

export default function ResetPasswordPage() {
	return (
		<div className="container mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
			<ResetPasswordForm />
		</div>
	)
}
