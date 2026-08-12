"use client"

import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"
import {
	AlertCircle,
	ArrowRight,
	CheckCircle,
	Plus,
	Upload,
	Users,
	X
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/core/components/ui/badge"
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"
import { Textarea } from "@/core/components/ui/textarea"

export default function NewDocumentPage() {
	const [currentStep, setCurrentStep] = useState(1)
	const [documentData, setDocumentData] = useState({
		title: "",
		description: "",
		type: "",
		template: "",
		file: null as File | null,
		signers: [] as Array<{ email: string; name: string; role: string }>,
		dueDate: "",
		priority: "medium",
		requiresNotarization: false,
		allowComments: true,
		sendReminders: true
	})

	const router = useRouter()

	const documentTypes = [
		{ value: "contract", label: "Contract" },
		{ value: "agreement", label: "Agreement" },
		{ value: "nda", label: "Non-Disclosure Agreement" },
		{ value: "employment", label: "Employment Document" },
		{ value: "lease", label: "Lease Agreement" },
		{ value: "invoice", label: "Invoice" },
		{ value: "other", label: "Other" }
	]

	const templates = [
		{ value: "employment-contract", label: "Employment Contract Template" },
		{ value: "nda-standard", label: "Standard NDA Template" },
		{ value: "service-agreement", label: "Service Agreement Template" },
		{ value: "partnership", label: "Partnership Agreement Template" }
	]

	const steps = [
		{
			number: 1,
			title: "Document Details",
			description: "Basic information about your document"
		},
		{
			number: 2,
			title: "Upload or Create",
			description: "Upload file or use template"
		},
		{
			number: 3,
			title: "Add Signers",
			description: "Specify who needs to sign"
		},
		{
			number: 4,
			title: "Configure Settings",
			description: "Set signing preferences"
		},
		{
			number: 5,
			title: "Review & Send",
			description: "Final review before sending"
		}
	]

	const addSigner = () => {
		setDocumentData({
			...documentData,
			signers: [
				...documentData.signers,
				{ email: "", name: "", role: "signer" }
			]
		})
	}

	const removeSigner = (index: number) => {
		const newSigners = documentData.signers.filter((_, i) => i !== index)
		setDocumentData({ ...documentData, signers: newSigners })
	}

	const updateSigner = (index: number, field: string, value: string) => {
		const newSigners = [...documentData.signers]
		newSigners[index] = { ...newSigners[index], [field]: value } as {
			email: string
			name: string
			role: string
		}
		setDocumentData({ ...documentData, signers: newSigners })
	}

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file) {
			setDocumentData({ ...documentData, file })
		}
	}

	const handleNext = () => {
		if (currentStep < 5) {
			setCurrentStep(currentStep + 1)
		}
	}

	const handlePrevious = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1)
		}
	}

	const handleSubmit = () => {
		toast.success("Document Created Successfully", {
			description: "Your document has been created and sent to signers."
		})
		router.push("/dashboard/documents")
	}

	const canProceed = () => {
		switch (currentStep) {
			case 1:
				return documentData.title && documentData.type
			case 2:
				return documentData.file ?? documentData.template
			case 3:
				return (
					documentData.signers.length > 0 &&
					documentData.signers.every((s) => s.email && s.name)
				)
			case 4:
				return documentData.dueDate
			default:
				return true
		}
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
					Create New Document
				</h1>
				<p className="text-gray-600 dark:text-gray-400">
					Set up a new document for signing and collaboration
				</p>
			</div>

			{/* Progress Steps */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-between">
						{steps.map((step, index) => (
							<div key={step.number} className="flex items-center">
								<div className="flex flex-col items-center">
									<div
										className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
											currentStep >= step.number
												? "bg-blue-600 text-white"
												: "bg-gray-200 text-gray-600"
										}`}
									>
										{currentStep > step.number ? (
											<CheckCircle className="h-5 w-5" />
										) : (
											step.number
										)}
									</div>
									<div className="mt-2 text-center">
										<p className="text-sm font-medium">{step.title}</p>
										<p className="text-xs text-gray-500">{step.description}</p>
									</div>
								</div>
								{index < steps.length - 1 && (
									<div
										className={`mx-4 h-0.5 flex-1 ${currentStep > step.number ? "bg-blue-600" : "bg-gray-200"}`}
									/>
								)}
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Step Content */}
			<Card>
				<CardHeader>
					<CardTitle>{steps?.[currentStep - 1]?.title}</CardTitle>
					<CardDescription>
						{steps?.[currentStep - 1]?.description}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Step 1: Document Details */}
					{currentStep === 1 && (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="title">Document Title *</Label>
								<Input
									id="title"
									placeholder="Enter document title"
									value={documentData.title}
									onChange={(e) =>
										setDocumentData({ ...documentData, title: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Textarea
									id="description"
									placeholder="Brief description of the document"
									value={documentData.description}
									onChange={(e) =>
										setDocumentData({
											...documentData,
											description: e.target.value
										})
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="type">Document Type *</Label>
								<Select
									value={documentData.type}
									onValueChange={(value) =>
										setDocumentData({ ...documentData, type: value })
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select document type" />
									</SelectTrigger>
									<SelectContent>
										{documentTypes.map((type) => (
											<SelectItem key={type.value} value={type.value}>
												{type.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					)}

					{/* Step 2: Upload or Create */}
					{currentStep === 2 && (
						<div className="space-y-6">
							<div className="space-y-2">
								<Label>Choose Template (Optional)</Label>
								<Select
									value={documentData.template}
									onValueChange={(value) =>
										setDocumentData({ ...documentData, template: value })
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Start from scratch" />
									</SelectTrigger>
									<SelectContent>
										{templates.map((template) => (
											<SelectItem key={template.value} value={template.value}>
												{template.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="text-center">
								<p className="mb-4 text-gray-500">OR</p>
							</div>

							<div className="space-y-2">
								<Label>Upload Document</Label>
								<div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
									<Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
									<p className="mb-2 text-gray-600">
										Drag and drop your file here, or click to browse
									</p>
									<p className="mb-4 text-sm text-gray-500">
										Supports PDF, DOC, DOCX files up to 10MB
									</p>
									<input
										type="file"
										accept=".pdf,.doc,.docx"
										onChange={handleFileUpload}
										className="hidden"
										id="file-upload"
									/>
									<Button asChild variant="outline">
										<label htmlFor="file-upload" className="cursor-pointer">
											Choose File
										</label>
									</Button>
									{documentData.file && (
										<div className="mt-4 rounded-lg bg-green-50 p-3">
											<p className="text-sm text-green-800">
												<CheckCircle className="mr-2 inline h-4 w-4" />
												{documentData.file.name} uploaded successfully
											</p>
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Step 3: Add Signers */}
					{currentStep === 3 && (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label>Document Signers</Label>
								<Button onClick={addSigner} size="sm">
									<Plus className="mr-2 h-4 w-4" />
									Add Signer
								</Button>
							</div>

							{documentData.signers.length === 0 ? (
								<div className="py-8 text-center text-gray-500">
									<Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
									<p>
										No signers added yet. Click &quot;Add Signer&quot; to get
										started.
									</p>
								</div>
							) : (
								<div className="space-y-4">
									{documentData.signers.map((signer, index) => (
										<div key={index} className="rounded-lg border p-4">
											<div className="mb-3 flex items-start justify-between">
												<h4 className="font-medium">Signer {index + 1}</h4>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => removeSigner(index)}
												>
													<X className="h-4 w-4" />
												</Button>
											</div>
											<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
												<div className="space-y-2">
													<Label>Name</Label>
													<Input
														placeholder="Full name"
														value={signer.name}
														onChange={(e) =>
															updateSigner(index, "name", e.target.value)
														}
													/>
												</div>
												<div className="space-y-2">
													<Label>Email</Label>
													<Input
														type="email"
														placeholder="email@example.com"
														value={signer.email}
														onChange={(e) =>
															updateSigner(index, "email", e.target.value)
														}
													/>
												</div>
												<div className="space-y-2">
													<Label>Role</Label>
													<Select
														value={signer.role}
														onValueChange={(value) =>
															updateSigner(index, "role", value)
														}
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="signer">Signer</SelectItem>
															<SelectItem value="approver">Approver</SelectItem>
															<SelectItem value="reviewer">Reviewer</SelectItem>
															<SelectItem value="witness">Witness</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Step 4: Configure Settings */}
					{currentStep === 4 && (
						<div className="space-y-6">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="dueDate">Due Date *</Label>
									<Input
										id="dueDate"
										type="date"
										value={documentData.dueDate}
										onChange={(e) =>
											setDocumentData({
												...documentData,
												dueDate: e.target.value
											})
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="priority">Priority</Label>
									<Select
										value={documentData.priority}
										onValueChange={(value) =>
											setDocumentData({ ...documentData, priority: value })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="low">Low</SelectItem>
											<SelectItem value="medium">Medium</SelectItem>
											<SelectItem value="high">High</SelectItem>
											<SelectItem value="urgent">Urgent</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex items-center space-x-2">
									<Checkbox
										id="notarization"
										checked={documentData.requiresNotarization}
										onCheckedChange={(checked) =>
											setDocumentData({
												...documentData,
												requiresNotarization: !!checked
											})
										}
									/>
									<Label htmlFor="notarization">Requires Notarization</Label>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="comments"
										checked={documentData.allowComments}
										onCheckedChange={(checked) =>
											setDocumentData({
												...documentData,
												allowComments: !!checked
											})
										}
									/>
									<Label htmlFor="comments">Allow Comments</Label>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="reminders"
										checked={documentData.sendReminders}
										onCheckedChange={(checked) =>
											setDocumentData({
												...documentData,
												sendReminders: !!checked
											})
										}
									/>
									<Label htmlFor="reminders">Send Automatic Reminders</Label>
								</div>
							</div>
						</div>
					)}

					{/* Step 5: Review & Send */}
					{currentStep === 5 && (
						<div className="space-y-6">
							<div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
								<h3 className="mb-2 font-medium">Document Summary</h3>
								<div className="space-y-2 text-sm">
									<p>
										<strong>Title:</strong> {documentData.title}
									</p>
									<p>
										<strong>Type:</strong>{" "}
										{
											documentTypes.find((t) => t.value === documentData.type)
												?.label
										}
									</p>
									<p>
										<strong>Signers:</strong> {documentData.signers.length}{" "}
										people
									</p>
									<p>
										<strong>Due Date:</strong> {documentData.dueDate}
									</p>
									<div className="flex items-center">
										<strong>Priority:</strong>
										<Badge className="ml-1">{documentData.priority}</Badge>
									</div>
								</div>
							</div>

							<div>
								<h4 className="mb-3 font-medium">Signers</h4>
								<div className="space-y-2">
									{documentData.signers.map((signer, index) => (
										<div
											key={index}
											className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
										>
											<div>
												<p className="font-medium">{signer.name}</p>
												<p className="text-sm text-gray-600">{signer.email}</p>
											</div>
											<Badge variant="outline">{signer.role}</Badge>
										</div>
									))}
								</div>
							</div>

							<div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
								<div className="flex items-start space-x-2">
									<AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
									<div>
										<p className="font-medium text-yellow-800 dark:text-yellow-200">
											Ready to Send
										</p>
										<p className="text-sm text-yellow-700 dark:text-yellow-300">
											Once you click &quot;Send Document&quot;, all signers will
											receive an email invitation to sign.
										</p>
									</div>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Navigation */}
			<div className="flex justify-between">
				<Button
					variant="outline"
					onClick={handlePrevious}
					disabled={currentStep === 1}
				>
					Previous
				</Button>
				<div className="flex space-x-2">
					{currentStep < 5 ? (
						<Button onClick={handleNext} disabled={!canProceed()}>
							Next
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					) : (
						<Button
							onClick={handleSubmit}
							className="bg-green-600 hover:bg-green-700"
						>
							<CheckCircle className="mr-2 h-4 w-4" />
							Send Document
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}
