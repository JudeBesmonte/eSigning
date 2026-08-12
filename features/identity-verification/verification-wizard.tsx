"use client"

import { useState } from "react"
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	Camera,
	CheckCircle,
	Shield,
	Upload
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
import { Progress } from "@/core/components/ui/progress"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"

interface VerificationWizardProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onComplete: (verificationData: any) => void
	onCancel?: () => void
}

export function VerificationWizard({
	onComplete,
	onCancel
}: VerificationWizardProps) {
	const [currentStep, setCurrentStep] = useState(1)
	const [verificationData, setVerificationData] = useState({
		personalInfo: {
			firstName: "",
			lastName: "",
			dateOfBirth: "",
			ssn: "",
			address: "",
			city: "",
			state: "",
			zipCode: ""
		},
		idDocument: {
			type: "",
			number: "",
			expirationDate: "",
			frontImage: null as File | null,
			backImage: null as File | null
		},
		selfie: {
			image: null as File | null
		},
		consent: {
			termsAccepted: false,
			privacyAccepted: false,
			backgroundCheckConsent: false
		}
	})

	const steps = [
		{
			number: 1,
			title: "Personal Information",
			description: "Basic personal details"
		},
		{
			number: 2,
			title: "Identity Document",
			description: "Government-issued ID"
		},
		{
			number: 3,
			title: "Selfie Verification",
			description: "Photo verification"
		},
		{
			number: 4,
			title: "Consent & Review",
			description: "Final review and consent"
		}
	]

	const handleNext = () => {
		if (validateCurrentStep()) {
			setCurrentStep(currentStep + 1)
		}
	}

	const handlePrevious = () => {
		setCurrentStep(currentStep - 1)
	}

	const handleComplete = () => {
		if (validateCurrentStep()) {
			onComplete(verificationData)
			toast.success("Verification Submitted", {
				description: "Your identity verification has been submitted for review."
			})
		}
	}

	const validateCurrentStep = () => {
		switch (currentStep) {
			case 1:
				const { personalInfo } = verificationData
				if (
					!personalInfo.firstName ||
					!personalInfo.lastName ||
					!personalInfo.dateOfBirth ||
					!personalInfo.ssn
				) {
					toast.error("Missing Information", {
						description:
							"Please fill in all required personal information fields."
					})
					return false
				}
				return true
			case 2:
				const { idDocument } = verificationData
				if (!idDocument.type || !idDocument.number || !idDocument.frontImage) {
					toast.error("Missing Information", {
						description:
							"Please provide your ID document details and upload the front image."
					})
					return false
				}
				return true
			case 3:
				if (!verificationData.selfie.image) {
					toast.error("Missing Selfie", {
						description: "Please take or upload a selfie for verification."
					})
					return false
				}
				return true
			case 4:
				const { consent } = verificationData
				if (
					!consent.termsAccepted ||
					!consent.privacyAccepted ||
					!consent.backgroundCheckConsent
				) {
					toast.error("Consent Required", {
						description: "Please accept all required consents to proceed."
					})
					return false
				}
				return true
			default:
				return true
		}
	}

	const handleFileUpload = (field: string, file: File | null) => {
		if (field.includes("idDocument")) {
			const subField = field.split(".")[1]
			setVerificationData((prev) => ({
				...prev,
				idDocument: {
					...prev.idDocument,
					[subField as keyof typeof prev.idDocument]: file
				}
			}))
		} else if (field === "selfie") {
			setVerificationData((prev) => ({
				...prev,
				selfie: {
					...prev.selfie,
					image: file
				}
			}))
		}
	}

	const progress = (currentStep / steps.length) * 100

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			{/* Progress Header */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Shield className="h-5 w-5" />
						<span>Identity Verification</span>
					</CardTitle>
					<CardDescription>
						Step {currentStep} of {steps.length}:{" "}
						{steps?.[currentStep - 1]?.title}
					</CardDescription>
					<Progress value={progress} className="mt-4" />
				</CardHeader>
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
					{/* Step 1: Personal Information */}
					{currentStep === 1 && (
						<div className="space-y-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="firstName">First Name *</Label>
									<Input
										id="firstName"
										value={verificationData.personalInfo.firstName}
										onChange={(e) =>
											setVerificationData((prev) => ({
												...prev,
												personalInfo: {
													...prev.personalInfo,
													firstName: e.target.value
												}
											}))
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="lastName">Last Name *</Label>
									<Input
										id="lastName"
										value={verificationData.personalInfo.lastName}
										onChange={(e) =>
											setVerificationData((prev) => ({
												...prev,
												personalInfo: {
													...prev.personalInfo,
													lastName: e.target.value
												}
											}))
										}
										required
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="dateOfBirth">Date of Birth *</Label>
									<Input
										id="dateOfBirth"
										type="date"
										value={verificationData.personalInfo.dateOfBirth}
										onChange={(e) =>
											setVerificationData((prev) => ({
												...prev,
												personalInfo: {
													...prev.personalInfo,
													dateOfBirth: e.target.value
												}
											}))
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="ssn">Social Security Number *</Label>
									<Input
										id="ssn"
										value={verificationData.personalInfo.ssn}
										onChange={(e) =>
											setVerificationData((prev) => ({
												...prev,
												personalInfo: {
													...prev.personalInfo,
													ssn: e.target.value
												}
											}))
										}
										placeholder="XXX-XX-XXXX"
										required
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="address">Address</Label>
								<Input
									id="address"
									value={verificationData.personalInfo.address}
									onChange={(e) =>
										setVerificationData((prev) => ({
											...prev,
											personalInfo: {
												...prev.personalInfo,
												address: e.target.value
											}
										}))
									}
								/>
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<div className="space-y-2">
									<Label htmlFor="city">City</Label>
									<Input
										id="city"
										value={verificationData.personalInfo.city}
										onChange={(e) =>
											setVerificationData((prev) => ({
												...prev,
												personalInfo: {
													...prev.personalInfo,
													city: e.target.value
												}
											}))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="state">State</Label>
									<Select
										value={verificationData.personalInfo.state}
										onValueChange={(value) =>
											setVerificationData((prev) => ({
												...prev,
												personalInfo: { ...prev.personalInfo, state: value }
											}))
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select state" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="AL">Alabama</SelectItem>
											<SelectItem value="CA">California</SelectItem>
											<SelectItem value="FL">Florida</SelectItem>
											<SelectItem value="NY">New York</SelectItem>
											<SelectItem value="TX">Texas</SelectItem>
											{/* Add more states as needed */}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="zipCode">ZIP Code</Label>
									<Input
										id="zipCode"
										value={verificationData.personalInfo.zipCode}
										onChange={(e) =>
											setVerificationData((prev) => ({
												...prev,
												personalInfo: {
													...prev.personalInfo,
													zipCode: e.target.value
												}
											}))
										}
									/>
								</div>
							</div>
						</div>
					)}

					{/* Step 2: Identity Document */}
					{currentStep === 2 && (
						<div className="space-y-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="idType">Document Type *</Label>
									<Select
										value={verificationData.idDocument.type}
										onValueChange={(value) =>
											setVerificationData((prev) => ({
												...prev,
												idDocument: { ...prev.idDocument, type: value }
											}))
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select document type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="drivers-license">
												Driver&apos;s License
											</SelectItem>
											<SelectItem value="passport">Passport</SelectItem>
											<SelectItem value="state-id">State ID</SelectItem>
											<SelectItem value="military-id">Military ID</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="idNumber">Document Number *</Label>
									<Input
										id="idNumber"
										value={verificationData.idDocument.number}
										onChange={(e) =>
											setVerificationData((prev) => ({
												...prev,
												idDocument: {
													...prev.idDocument,
													number: e.target.value
												}
											}))
										}
										required
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="expirationDate">Expiration Date</Label>
								<Input
									id="expirationDate"
									type="date"
									value={verificationData.idDocument.expirationDate}
									onChange={(e) =>
										setVerificationData((prev) => ({
											...prev,
											idDocument: {
												...prev.idDocument,
												expirationDate: e.target.value
											}
										}))
									}
								/>
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label>Front of Document *</Label>
									<div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
										<Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
										<p className="mb-2 text-sm text-gray-600">
											Upload front of ID
										</p>
										<input
											type="file"
											accept="image/*"
											onChange={(e) =>
												handleFileUpload(
													"idDocument.frontImage",
													e.target.files?.[0] ?? null
												)
											}
											className="hidden"
											id="front-upload"
										/>
										<Button asChild variant="outline" size="sm">
											<label htmlFor="front-upload" className="cursor-pointer">
												Choose File
											</label>
										</Button>
										{verificationData.idDocument.frontImage && (
											<p className="mt-2 text-xs text-green-600">
												✓ {verificationData.idDocument.frontImage.name}
											</p>
										)}
									</div>
								</div>

								<div className="space-y-2">
									<Label>Back of Document</Label>
									<div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
										<Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
										<p className="mb-2 text-sm text-gray-600">
											Upload back of ID
										</p>
										<input
											type="file"
											accept="image/*"
											onChange={(e) =>
												handleFileUpload(
													"idDocument.backImage",
													e.target.files?.[0] ?? null
												)
											}
											className="hidden"
											id="back-upload"
										/>
										<Button asChild variant="outline" size="sm">
											<label htmlFor="back-upload" className="cursor-pointer">
												Choose File
											</label>
										</Button>
										{verificationData.idDocument.backImage && (
											<p className="mt-2 text-xs text-green-600">
												✓ {verificationData.idDocument.backImage.name}
											</p>
										)}
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Step 3: Selfie Verification */}
					{currentStep === 3 && (
						<div className="space-y-4">
							<div className="rounded-lg bg-blue-50 p-4">
								<div className="flex items-start space-x-3">
									<Camera className="mt-0.5 h-5 w-5 text-blue-600" />
									<div>
										<h3 className="font-medium text-blue-800">
											Selfie Instructions
										</h3>
										<ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-blue-700">
											<li>Look directly at the camera</li>
											<li>Ensure good lighting on your face</li>
											<li>Remove any hats, sunglasses, or face coverings</li>
											<li>Make sure your entire face is visible</li>
										</ul>
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Take or Upload Selfie *</Label>
								<div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
									<Camera className="mx-auto mb-4 h-12 w-12 text-gray-400" />
									<p className="mb-4 text-gray-600">
										Take a selfie or upload a photo
									</p>
									<div className="flex justify-center space-x-2">
										<input
											type="file"
											accept="image/*"
											capture="user"
											onChange={(e) =>
												handleFileUpload("selfie", e.target.files?.[0] ?? null)
											}
											className="hidden"
											id="selfie-upload"
										/>
										<Button asChild variant="outline">
											<label htmlFor="selfie-upload" className="cursor-pointer">
												<Camera className="mr-2 h-4 w-4" />
												Take Photo
											</label>
										</Button>
										<Button asChild variant="outline">
											<label htmlFor="selfie-upload" className="cursor-pointer">
												<Upload className="mr-2 h-4 w-4" />
												Upload Photo
											</label>
										</Button>
									</div>
									{verificationData.selfie.image && (
										<div className="mt-4">
											<p className="mb-2 text-sm text-green-600">
												✓ {verificationData.selfie.image.name}
											</p>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={
													URL.createObjectURL(verificationData.selfie.image) ||
													"/placeholder.svg"
												}
												alt="Selfie preview"
												className="mx-auto h-auto max-w-32 rounded-lg"
											/>
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Step 4: Consent & Review */}
					{currentStep === 4 && (
						<div className="space-y-6">
							<div className="rounded-lg bg-yellow-50 p-4">
								<div className="flex items-start space-x-3">
									<AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
									<div>
										<h3 className="font-medium text-yellow-800">
											Review Your Information
										</h3>
										<p className="mt-1 text-sm text-yellow-700">
											Please review all information carefully before submitting.
											Changes may require restarting the verification process.
										</p>
									</div>
								</div>
							</div>

							<div className="space-y-4">
								<div>
									<h3 className="mb-2 font-medium">Personal Information</h3>
									<div className="rounded-lg bg-gray-50 p-3 text-sm">
										<p>
											<strong>Name:</strong>{" "}
											{verificationData.personalInfo.firstName}{" "}
											{verificationData.personalInfo.lastName}
										</p>
										<p>
											<strong>Date of Birth:</strong>{" "}
											{verificationData.personalInfo.dateOfBirth}
										</p>
										<p>
											<strong>SSN:</strong> ***-**-
											{verificationData.personalInfo.ssn.slice(-4)}
										</p>
									</div>
								</div>

								<div>
									<h3 className="mb-2 font-medium">Identity Document</h3>
									<div className="rounded-lg bg-gray-50 p-3 text-sm">
										<p>
											<strong>Type:</strong> {verificationData.idDocument.type}
										</p>
										<p>
											<strong>Number:</strong> ***
											{verificationData.idDocument.number.slice(-4)}
										</p>
										<p>
											<strong>Documents:</strong>{" "}
											{verificationData.idDocument.frontImage
												? "Front uploaded"
												: "No front image"}
											,{" "}
											{verificationData.idDocument.backImage
												? "Back uploaded"
												: "No back image"}
										</p>
									</div>
								</div>

								<div>
									<h3 className="mb-2 font-medium">Selfie</h3>
									<div className="rounded-lg bg-gray-50 p-3 text-sm">
										<p>
											<strong>Status:</strong>{" "}
											{verificationData.selfie.image
												? "Photo uploaded"
												: "No photo"}
										</p>
									</div>
								</div>
							</div>

							<div className="space-y-4">
								<div className="flex items-start space-x-2">
									<Checkbox
										id="terms"
										checked={verificationData.consent.termsAccepted}
										onCheckedChange={(checked) =>
											setVerificationData((prev) => ({
												...prev,
												consent: { ...prev.consent, termsAccepted: !!checked }
											}))
										}
									/>
									<div className="grid gap-1.5 leading-none">
										<label
											htmlFor="terms"
											className="text-sm font-medium leading-none"
										>
											I agree to the Terms of Service *
										</label>
										<p className="text-xs text-gray-500">
											By checking this box, I acknowledge that I have read and
											agree to the Terms of Service.
										</p>
									</div>
								</div>

								<div className="flex items-start space-x-2">
									<Checkbox
										id="privacy"
										checked={verificationData.consent.privacyAccepted}
										onCheckedChange={(checked) =>
											setVerificationData((prev) => ({
												...prev,
												consent: { ...prev.consent, privacyAccepted: !!checked }
											}))
										}
									/>
									<div className="grid gap-1.5 leading-none">
										<label
											htmlFor="privacy"
											className="text-sm font-medium leading-none"
										>
											I agree to the Privacy Policy *
										</label>
										<p className="text-xs text-gray-500">
											I consent to the collection and processing of my personal
											data as described in the Privacy Policy.
										</p>
									</div>
								</div>

								<div className="flex items-start space-x-2">
									<Checkbox
										id="background"
										checked={verificationData.consent.backgroundCheckConsent}
										onCheckedChange={(checked) =>
											setVerificationData((prev) => ({
												...prev,
												consent: {
													...prev.consent,
													backgroundCheckConsent: !!checked
												}
											}))
										}
									/>
									<div className="grid gap-1.5 leading-none">
										<label
											htmlFor="background"
											className="text-sm font-medium leading-none"
										>
											I consent to background verification checks *
										</label>
										<p className="text-xs text-gray-500">
											I authorize the verification of my identity and background
											information for security purposes.
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
				<div>
					{currentStep > 1 && (
						<Button variant="outline" onClick={handlePrevious}>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Previous
						</Button>
					)}
					{onCancel && currentStep === 1 && (
						<Button variant="outline" onClick={onCancel}>
							Cancel
						</Button>
					)}
				</div>
				<div>
					{currentStep < steps.length ? (
						<Button onClick={handleNext}>
							Next
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					) : (
						<Button
							onClick={handleComplete}
							className="bg-green-600 hover:bg-green-700"
						>
							<CheckCircle className="mr-2 h-4 w-4" />
							Submit Verification
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}
