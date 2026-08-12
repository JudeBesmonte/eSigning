"use client"

import { useState } from "react"
import {
	AlertCircle,
	Camera,
	CheckCircle,
	CreditCard,
	FileText,
	Shield,
	Smartphone,
	Upload,
	User
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
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { Progress } from "@/core/components/ui/progress"

export default function VerificationPage() {
	// const [verificationStep, setVerificationStep] = useState(1)
	const [verificationData, setVerificationData] = useState({
		documentType: "",
		documentNumber: "",
		phoneNumber: "",
		email: ""
	})

	const verificationMethods = [
		{
			id: "document",
			title: "Government ID Verification",
			description: "Upload a government-issued photo ID",
			icon: FileText,
			status: "pending",
			required: true
		},
		{
			id: "biometric",
			title: "Biometric Verification",
			description: "Take a selfie for facial recognition",
			icon: Camera,
			status: "pending",
			required: true
		},
		{
			id: "phone",
			title: "Phone Verification",
			description: "Verify your phone number via SMS",
			icon: Smartphone,
			status: "completed",
			required: true
		},
		{
			id: "address",
			title: "Address Verification",
			description: "Upload proof of address document",
			icon: CreditCard,
			status: "pending",
			required: false
		}
	]

	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "bg-green-100 text-green-800"
			case "pending":
				return "bg-orange-100 text-orange-800"
			case "failed":
				return "bg-red-100 text-red-800"
			default:
				return "bg-gray-100 text-gray-800"
		}
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return <CheckCircle className="h-4 w-4 text-green-600" />
			case "pending":
				return <AlertCircle className="h-4 w-4 text-orange-600" />
			case "failed":
				return <AlertCircle className="h-4 w-4 text-red-600" />
			default:
				return <Shield className="h-4 w-4 text-gray-600" />
		}
	}

	const handleDocumentUpload = () => {
		toast.success("Document uploaded successfully", {
			description: "Your ID document is being processed for verification."
		})
	}

	const handleBiometricCapture = () => {
		toast.success("Biometric data captured", {
			description: "Your facial recognition data has been processed."
		})
	}

	const completedMethods = verificationMethods.filter(
		(method) => method.status === "completed"
	).length
	const totalMethods = verificationMethods.filter(
		(method) => method.required
	).length
	const verificationProgress = (completedMethods / totalMethods) * 100

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
						Identity Verification
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Secure your account with multi-factor identity verification
					</p>
				</div>
				<Badge className="bg-blue-100 px-4 py-2 text-lg text-blue-800">
					Level 2 Verified
				</Badge>
			</div>

			{/* Verification Progress */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Shield className="h-5 w-5 text-blue-600" />
						<span>Verification Progress</span>
					</CardTitle>
					<CardDescription>
						Complete all required verification steps to unlock full platform
						features
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex justify-between text-sm">
							<span>Overall Progress</span>
							<span>{Math.round(verificationProgress)}% Complete</span>
						</div>
						<Progress value={verificationProgress} className="h-3" />
						<div className="flex justify-between text-sm text-gray-600">
							<span>
								{completedMethods} of {totalMethods} required steps completed
							</span>
							<span>{totalMethods - completedMethods} remaining</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Verification Methods */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{verificationMethods.map((method) => (
					<Card key={method.id} className="relative">
						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div className="rounded-lg bg-blue-100 p-2">
										<method.icon className="h-6 w-6 text-blue-600" />
									</div>
									<div>
										<CardTitle className="text-lg">{method.title}</CardTitle>
										<CardDescription>{method.description}</CardDescription>
									</div>
								</div>
								<Badge className={getStatusColor(method.status)}>
									<div className="flex items-center space-x-1">
										{getStatusIcon(method.status)}
										<span>{method.status}</span>
									</div>
								</Badge>
							</div>
						</CardHeader>
						<CardContent>
							{method.id === "document" && method.status === "pending" && (
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="documentType">Document Type</Label>
										<select
											className="w-full rounded-md border p-2"
											value={verificationData.documentType}
											onChange={(e) =>
												setVerificationData({
													...verificationData,
													documentType: e.target.value
												})
											}
										>
											<option value="">Select document type</option>
											<option value="passport">Passport</option>
											<option value="drivers_license">
												Driver&apos;s License
											</option>
											<option value="national_id">National ID Card</option>
										</select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="documentNumber">Document Number</Label>
										<Input
											id="documentNumber"
											placeholder="Enter document number"
											value={verificationData.documentNumber}
											onChange={(e) =>
												setVerificationData({
													...verificationData,
													documentNumber: e.target.value
												})
											}
										/>
									</div>
									<Button onClick={handleDocumentUpload} className="w-full">
										<Upload className="mr-2 h-4 w-4" />
										Upload Document
									</Button>
								</div>
							)}

							{method.id === "biometric" && method.status === "pending" && (
								<div className="space-y-4">
									<div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
										<Camera className="mx-auto mb-4 h-12 w-12 text-gray-400" />
										<p className="text-gray-600">
											Position your face in the camera frame
										</p>
										<p className="mt-2 text-sm text-gray-500">
											Ensure good lighting and remove any face coverings
										</p>
									</div>
									<Button onClick={handleBiometricCapture} className="w-full">
										<Camera className="mr-2 h-4 w-4" />
										Start Facial Recognition
									</Button>
								</div>
							)}

							{method.id === "phone" && method.status === "completed" && (
								<div className="space-y-4">
									<div className="flex items-center space-x-2 text-green-600">
										<CheckCircle className="h-5 w-5" />
										<span>Phone number verified successfully</span>
									</div>
									<p className="text-sm text-gray-600">
										Verified: +1 (555) 123-4567
									</p>
								</div>
							)}

							{method.id === "address" && method.status === "pending" && (
								<div className="space-y-4">
									<p className="text-sm text-gray-600">
										Upload a recent utility bill, bank statement, or government
										document showing your address
									</p>
									<Button variant="outline" className="w-full">
										<Upload className="mr-2 h-4 w-4" />
										Upload Address Proof
									</Button>
								</div>
							)}

							{method.required && (
								<div className="mt-4 rounded-lg bg-blue-50 p-3">
									<p className="text-sm text-blue-800">
										<strong>Required:</strong> This verification is mandatory
										for full account access
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{/* Verification Benefits */}
			<Card>
				<CardHeader>
					<CardTitle>Verification Benefits</CardTitle>
					<CardDescription>
						Enhanced security and access to premium features
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						<div className="text-center">
							<div className="mx-auto mb-3 w-fit rounded-full bg-green-100 p-3">
								<Shield className="h-6 w-6 text-green-600" />
							</div>
							<h3 className="mb-2 font-medium">Enhanced Security</h3>
							<p className="text-sm text-gray-600">
								Multi-layer protection against fraud and unauthorized access
							</p>
						</div>
						<div className="text-center">
							<div className="mx-auto mb-3 w-fit rounded-full bg-blue-100 p-3">
								<FileText className="h-6 w-6 text-blue-600" />
							</div>
							<h3 className="mb-2 font-medium">Higher Limits</h3>
							<p className="text-sm text-gray-600">
								Access to premium features and higher transaction limits
							</p>
						</div>
						<div className="text-center">
							<div className="mx-auto mb-3 w-fit rounded-full bg-purple-100 p-3">
								<User className="h-6 w-6 text-purple-600" />
							</div>
							<h3 className="mb-2 font-medium">Trust Badge</h3>
							<p className="text-sm text-gray-600">
								Display verified status to increase trust with partners
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
