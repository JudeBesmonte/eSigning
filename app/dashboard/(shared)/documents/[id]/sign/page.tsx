"use client"

import { useRouter } from "next/navigation"
import { use, useState } from "react"
import {
	AlertTriangle,
	ArrowLeft,
	Calendar,
	CheckCircle,
	Download,
	FileText,
	ImageIcon,
	Info,
	Lock,
	Pen,
	Shield,
	Type
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import { Checkbox } from "@/core/components/ui/checkbox"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { Separator } from "@/core/components/ui/separator"
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from "@/core/components/ui/tabs"

export default function DocumentSignPage({
	params
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = use(params)
	const [activeTab, setActiveTab] = useState("sign")
	const [signatureType, setSignatureType] = useState("draw")
	const [isAgreed, setIsAgreed] = useState(false)
	const router = useRouter()

	// Mock document data
	const document = {
		id: id,
		title: "Service Agreement - Acme Corporation",
		type: "Contract",
		pages: 12,
		fields: [
			{
				id: "1",
				type: "signature",
				page: 1,
				required: true,
				label: "Signature",
				completed: false
			},
			{
				id: "2",
				type: "date",
				page: 1,
				required: true,
				label: "Date",
				completed: false
			},
			{
				id: "3",
				type: "text",
				page: 2,
				required: true,
				label: "Full Name",
				completed: false
			},
			{
				id: "4",
				type: "text",
				page: 2,
				required: true,
				label: "Title",
				completed: false
			},
			{
				id: "5",
				type: "signature",
				page: 12,
				required: true,
				label: "Initials",
				completed: false
			}
		]
	}

	const handleSign = () => {
		if (!isAgreed) {
			toast.error("Agreement Required", {
				description: "Please agree to the terms and conditions before signing."
			})
			return
		}

		toast.success("Document Signed Successfully", {
			description: "Your signature has been applied to the document."
		})

		// Redirect back to document details after a short delay
		setTimeout(() => {
			router.push(`/dashboard/documents/${id}`)
		}, 1500)
	}

	const handleCancel = () => {
		router.push(`/dashboard/documents/${id}`)
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<Button variant="ghost" onClick={handleCancel} className="-ml-4 mb-2">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Document
					</Button>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
						{document.title}
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						{document.type} • {document.pages} pages • {document.fields.length}{" "}
						signature fields
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button variant="outline">
						<Download className="mr-2 h-4 w-4" />
						Download
					</Button>
					<Button variant="outline">
						<Info className="mr-2 h-4 w-4" />
						Help
					</Button>
				</div>
			</div>

			{/* Security Notice */}
			<Card className="border-blue-200 bg-blue-50">
				<CardContent className="pt-6">
					<div className="flex items-start space-x-4">
						<Shield className="mt-1 h-6 w-6 text-blue-600" />
						<div>
							<h3 className="font-medium text-blue-800">
								Secure Signing Session
							</h3>
							<p className="text-sm text-blue-700">
								This is a secure signing session. Your signature will be legally
								binding and recorded in the audit trail.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Document Signing Interface */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Document Preview */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<FileText className="h-5 w-5" />
							<span>Document Preview</span>
						</CardTitle>
						<CardDescription>
							Review the document before signing
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex h-[500px] items-center justify-center rounded-lg border bg-gray-50 p-4">
							<div className="text-center">
								<FileText className="mx-auto mb-4 h-16 w-16 text-gray-300" />
								<p className="text-gray-500">Document preview not available</p>
								<div className="mt-4 flex justify-center space-x-2">
									<Button variant="outline">
										<Download className="mr-2 h-4 w-4" />
										Download to Review
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Signature Panel */}
				<Card>
					<CardHeader>
						<CardTitle>Sign Document</CardTitle>
						<CardDescription>Complete all required fields</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<Tabs value={activeTab} onValueChange={setActiveTab}>
							<TabsList className="grid grid-cols-2">
								<TabsTrigger value="sign">Sign</TabsTrigger>
								<TabsTrigger value="fields">Fields</TabsTrigger>
							</TabsList>

							{/* Sign Tab */}
							<TabsContent value="sign" className="space-y-6">
								<div className="space-y-4">
									<div className="space-y-2">
										<Label>Choose Signature Type</Label>
										<div className="grid grid-cols-3 gap-2">
											<Button
												variant={
													signatureType === "draw" ? "default" : "outline"
												}
												className="flex h-auto flex-col py-3"
												onClick={() => setSignatureType("draw")}
											>
												<Pen className="mb-1 h-4 w-4" />
												<span className="text-xs">Draw</span>
											</Button>
											<Button
												variant={
													signatureType === "type" ? "default" : "outline"
												}
												className="flex h-auto flex-col py-3"
												onClick={() => setSignatureType("type")}
											>
												<Type className="mb-1 h-4 w-4" />
												<span className="text-xs">Type</span>
											</Button>
											<Button
												variant={
													signatureType === "upload" ? "default" : "outline"
												}
												className="flex h-auto flex-col py-3"
												onClick={() => setSignatureType("upload")}
											>
												<ImageIcon className="mb-1 h-4 w-4" />
												<span className="text-xs">Upload</span>
											</Button>
										</div>
									</div>

									{signatureType === "draw" && (
										<div className="space-y-2">
											<Label>Draw Your Signature</Label>
											<div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed bg-white p-4">
												<p className="text-center text-gray-500">
													Click and drag to draw your signature
												</p>
											</div>
											<Button variant="outline" size="sm" className="w-full">
												Clear
											</Button>
										</div>
									)}

									{signatureType === "type" && (
										<div className="space-y-2">
											<Label>Type Your Signature</Label>
											<Input placeholder="Type your full name" />
											<div className="rounded-lg border bg-white p-4">
												<p className="text-center italic text-gray-600">
													John Smith
												</p>
											</div>
										</div>
									)}

									{signatureType === "upload" && (
										<div className="space-y-2">
											<Label>Upload Your Signature</Label>
											<div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed bg-white p-4">
												<div className="text-center">
													<p className="mb-2 text-gray-500">
														Upload an image of your signature
													</p>
													<input
														type="file"
														className="hidden"
														id="signature-upload"
													/>
													<Button asChild variant="outline" size="sm">
														<label
															htmlFor="signature-upload"
															className="cursor-pointer"
														>
															Choose File
														</label>
													</Button>
												</div>
											</div>
										</div>
									)}

									<div className="space-y-2">
										<Label>Date</Label>
										<Input
											type="date"
											defaultValue={new Date().toISOString().split("T")[0]}
										/>
									</div>

									<Separator />

									<div className="flex items-start space-x-2">
										<Checkbox
											id="terms"
											checked={isAgreed}
											onCheckedChange={(checked) => setIsAgreed(!!checked)}
										/>
										<div className="grid gap-1.5 leading-none">
											<label
												htmlFor="terms"
												className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
											>
												I agree to the terms and conditions
											</label>
											<p className="text-xs text-gray-500">
												By checking this box, I acknowledge that I have read and
												agree to the terms and conditions of this document, and
												I consent to use electronic signatures for this
												transaction.
											</p>
										</div>
									</div>
								</div>
							</TabsContent>

							{/* Fields Tab */}
							<TabsContent value="fields" className="space-y-4">
								<div className="space-y-1">
									<p className="text-sm font-medium">Required Fields</p>
									<p className="text-xs text-gray-500">
										Complete all required fields to sign the document
									</p>
								</div>

								<div className="space-y-4">
									{document.fields.map((field) => (
										<div
											key={field.id}
											className="flex items-center justify-between rounded-lg border p-3"
										>
											<div className="flex items-center space-x-3">
												{field.type === "signature" && (
													<Pen className="h-4 w-4 text-blue-600" />
												)}
												{field.type === "date" && (
													<Calendar className="h-4 w-4 text-blue-600" />
												)}
												{field.type === "text" && (
													<Type className="h-4 w-4 text-blue-600" />
												)}
												<div>
													<p className="font-medium">{field.label}</p>
													<p className="text-xs text-gray-500">
														Page {field.page} •{" "}
														{field.required ? "Required" : "Optional"}
													</p>
												</div>
											</div>
											{field.completed ? (
												<CheckCircle className="h-5 w-5 text-green-600" />
											) : (
												<AlertTriangle className="h-5 w-5 text-orange-600" />
											)}
										</div>
									))}
								</div>
							</TabsContent>
						</Tabs>

						<div className="space-y-4 pt-4">
							<Button
								onClick={handleSign}
								className="w-full"
								disabled={!isAgreed}
							>
								<Lock className="mr-2 h-4 w-4" />
								Sign Document
							</Button>
							<Button
								variant="outline"
								className="w-full"
								onClick={handleCancel}
							>
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
