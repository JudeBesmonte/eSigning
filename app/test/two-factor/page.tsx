import { TwoFactorSettings } from "@/features/two-factor-auth/components/two-factor-settings"

export default function TwoFactorTestPage() {
	return (
		<div className="container mx-auto max-w-2xl py-8">
			<h1 className="mb-6 text-2xl font-bold">Account Security</h1>
			<TwoFactorSettings />
		</div>
	)
}
