"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import Barcode from "react-barcode"

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "@/core/components/ui/dialog"
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from "@/core/components/ui/tabs"

interface QRBarcodeModalProps {
	envelopeId: string
	envelopeTitle: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function QRBarcodeModal({
	envelopeId,
	envelopeTitle,
	open,
	onOpenChange
}: QRBarcodeModalProps) {
	const [activeTab, setActiveTab] = useState("qr")

	// Generate a user-friendly reference number from the envelope ID
	// This creates a shorter, more readable identifier without exposing the full database ID
	const generatePublicReference = (id: string, title: string) => {
		// Take first 8 characters of the ID and combine with a hash of the title
		const idPrefix = id.substring(0, 8).toUpperCase()
		const titleHash = title.split("").reduce((a, b) => {
			a = (a << 5) - a + b.charCodeAt(0)
			return a & a
		}, 0)
		const titleSuffix = Math.abs(titleHash)
			.toString(36)
			.substring(0, 4)
			.toUpperCase()
		return `ENV-${idPrefix}-${titleSuffix}`
	}

	const publicReference = generatePublicReference(envelopeId, envelopeTitle)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Envelope Identifier</DialogTitle>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="qr">QR Code</TabsTrigger>
						<TabsTrigger value="barcode">Barcode</TabsTrigger>
					</TabsList>

					<TabsContent
						value="qr"
						className="flex flex-col items-center gap-4 pt-4"
					>
						<div className="rounded-md border p-4">
							<QRCodeSVG
								value={publicReference}
								size={256}
								level="H"
								includeMargin={true}
							/>
						</div>
					</TabsContent>

					<TabsContent
						value="barcode"
						className="flex flex-col items-center gap-4 pt-4"
					>
						<div className="max-w-full overflow-hidden rounded-md border p-4">
							<Barcode
								value={publicReference}
								width={1}
								height={80}
								format="CODE128"
								displayValue={false}
							/>
						</div>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	)
}
