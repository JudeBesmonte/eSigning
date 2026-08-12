"use client"

import { useState } from "react"
import { Loader2, Mail, Shield } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/core/components/ui/alert"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { Switch } from "@/core/components/ui/switch"

import { trpc } from "@/services/trpc/client"

export const TwoFactorForm = () => {
	const [password, setPassword] = useState("")
	const [verificationCode, setVerificationCode] = useState("")
	const [showVerification, setShowVerification] = useState(false)

	const utils = trpc.useUtils()
	const { data: status, isLoading: statusLoading } =
		trpc.twoFactor.status.useQuery()

	const enableMutation = trpc.twoFactor.enable.useMutation({
		onSuccess: () => {
			setShowVerification(true)
			setPassword("")
			toast.success("Verification code sent - Check your email")
		},
		onError: (error) => {
			toast.error(error.message || "Failed to enable 2FA")
		}
	})

	const verifyMutation = trpc.twoFactor.verify.useMutation({
		onSuccess: () => {
			setShowVerification(false)
			setVerificationCode("")
			void utils.twoFactor.status.invalidate()
			toast.success("Two-factor authentication enabled successfully")
		},
		onError: (error) => {
			toast.error(error.message || "Invalid verification code")
		}
	})

	const disableMutation = trpc.twoFactor.disable.useMutation({
		onSuccess: () => {
			setPassword("")
			void utils.twoFactor.status.invalidate()
			toast.success("Two-factor authentication disabled successfully")
		},
		onError: (error) => {
			toast.error(error.message || "Failed to disable 2FA")
		}
	})

	const isEnabled = Boolean(status?.twoFactorEnabled ?? false)

	const handleToggle = async () => {
		if (isEnabled) {
			// Disable 2FA
			if (!password) {
				toast.error("Please enter your password to disable 2FA")
				return
			}

			disableMutation.mutate({ password })
		} else {
			// Enable 2FA
			if (!password) {
				toast.error("Please enter your password to enable 2FA")
				return
			}

			enableMutation.mutate({ password })
		}
	}

	const handleVerification = async () => {
		if (!verificationCode || verificationCode.length !== 6) {
			toast.error("Please enter a valid 6-digit verification code")
			return
		}

		verifyMutation.mutate({ code: verificationCode })
	}

	if (statusLoading) {
		return (
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Shield className="h-5 w-5" />
					<Label className="text-base font-semibold">
						Two Factor Authentication
					</Label>
				</div>
				<div className="flex items-center justify-center p-4">
					<Loader2 className="h-6 w-6 animate-spin" />
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Shield className="h-5 w-5" />
				<Label className="text-base font-semibold">
					Two Factor Authentication
				</Label>
			</div>

			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label className="text-base">Enable two factor authentication</Label>
					<p className="text-sm text-muted-foreground">
						Receive verification codes via email when signing in
					</p>
				</div>
				<Switch checked={Boolean(isEnabled)} disabled />
			</div>

			{showVerification && (
				<Alert>
					<Mail className="h-4 w-4" />
					<AlertDescription>
						A verification code has been sent to your email address. Enter it
						below to complete the setup.
					</AlertDescription>
				</Alert>
			)}

			<div className="space-y-4">
				{showVerification ? (
					<>
						<div className="space-y-2">
							<Label htmlFor="verification-code">Verification Code</Label>
							<Input
								id="verification-code"
								type="text"
								placeholder="Enter 6-digit code"
								value={verificationCode}
								onChange={(e) =>
									setVerificationCode(
										e.target.value.replace(/\D/g, "").slice(0, 6)
									)
								}
								maxLength={6}
							/>
						</div>
						<div className="flex gap-2">
							<Button
								onClick={handleVerification}
								disabled={verifyMutation.isPending}
								className="flex-1"
							>
								{verifyMutation.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Verify & Enable
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									setShowVerification(false)
									setVerificationCode("")
								}}
								disabled={verifyMutation.isPending}
							>
								Cancel
							</Button>
						</div>
					</>
				) : (
					<>
						<div className="space-y-2">
							<Label htmlFor="password">Current Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="Enter your current password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
						<Button
							onClick={handleToggle}
							disabled={enableMutation.isPending || disableMutation.isPending}
							className="w-full"
							variant={isEnabled ? "destructive" : "default"}
						>
							{(enableMutation.isPending || disableMutation.isPending) && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{isEnabled ? "Disable" : "Enable"} Two Factor Authentication
						</Button>
					</>
				)}
			</div>
		</div>
	)
}
