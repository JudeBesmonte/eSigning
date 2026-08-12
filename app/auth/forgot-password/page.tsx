import type { Metadata } from "next"

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"

export const metadata: Metadata = {
	title: "Forgot Password - Quanby Sign",
	description: "Reset your password to access your Quanby Sign account"
}

export default function ForgotPasswordPage() {
	return (
		<div className="container mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
			<ForgotPasswordForm />
		</div>
	)
}
