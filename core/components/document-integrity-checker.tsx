import { useEffect, useState } from "react"
import { AlertTriangle, Check, RefreshCw } from "lucide-react"

import { Alert, AlertDescription } from "@/core/components/ui/alert"
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"

import { trpc } from "@/services/trpc/client"

interface DocumentIntegrityCheckerProps {
	documentId: string
	documentName: string
	initialIntegrityStatus?: {
		isValid: boolean
		error?: string
		lastChecked?: string
	} | null
}

export function DocumentIntegrityChecker({
	documentId,
	documentName,
	initialIntegrityStatus
}: DocumentIntegrityCheckerProps) {
	const [integrityStatus, setIntegrityStatus] = useState(initialIntegrityStatus)
	const [shouldVerify, setShouldVerify] = useState(false)

	const verifyIntegrityQuery =
		trpc.envelopeLite.verifyDocumentIntegrity.useQuery(
			{ documentId },
			{
				enabled: shouldVerify
			}
		)

	useEffect(() => {
		if (verifyIntegrityQuery.data && shouldVerify) {
			setIntegrityStatus({
				isValid: verifyIntegrityQuery.data.isValid,
				error: verifyIntegrityQuery.data.error,
				lastChecked: new Date().toISOString()
			})
			setShouldVerify(false)
		}
	}, [verifyIntegrityQuery.data, shouldVerify])

	useEffect(() => {
		if (verifyIntegrityQuery.error && shouldVerify) {
			console.error(
				"Failed to verify document integrity:",
				verifyIntegrityQuery.error
			)
			setShouldVerify(false)
		}
	}, [verifyIntegrityQuery.error, shouldVerify])

	const handleVerifyIntegrity = () => {
		setShouldVerify(true)
	}

	const getStatusBadge = () => {
		if (!integrityStatus) {
			return <Badge variant="outline">No hash available</Badge>
		}

		if (integrityStatus.isValid) {
			return (
				<Badge variant="default" className="bg-green-500">
					<Check className="mr-1 h-3 w-3" />
					Verified
				</Badge>
			)
		}

		return (
			<Badge variant="destructive">
				<AlertTriangle className="mr-1 h-3 w-3" />
				Invalid
			</Badge>
		)
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<span className="text-sm font-medium">Integrity Status:</span>
					{getStatusBadge()}
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={handleVerifyIntegrity}
					disabled={verifyIntegrityQuery.isFetching}
				>
					{verifyIntegrityQuery.isFetching ? (
						<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<RefreshCw className="mr-2 h-4 w-4" />
					)}
					Verify Now
				</Button>
			</div>

			{integrityStatus && !integrityStatus.isValid && integrityStatus.error && (
				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>
						<strong>Integrity Check Failed:</strong> {integrityStatus.error}
						<br />
						<span className="text-xs text-muted-foreground">
							This may indicate the document has been tampered with or
							corrupted.
						</span>
					</AlertDescription>
				</Alert>
			)}

			{integrityStatus?.lastChecked && (
				<p className="text-xs text-muted-foreground">
					Last checked: {new Date(integrityStatus.lastChecked).toLocaleString()}
				</p>
			)}
		</div>
	)
}
