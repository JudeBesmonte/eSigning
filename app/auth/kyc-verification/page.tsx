"use client"

import { useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
	AlertCircle,
	Camera,
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	FileText,
	RefreshCw,
	Upload
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/core/components/ui/alert"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
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
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from "@/core/components/ui/tabs"

export default function KYCVerificationPage() {
	const router = useRouter()
	const [step, setStep] = useState(1)
	const [progress, setProgress] = useState(0)
	const [isProcessing, setIsProcessing] = useState(false)
	const [verificationStatus, setVerificationStatus] = useState<
		"idle" | "processing" | "success" | "failed"
	>("idle")
	const [errorMessage, setErrorMessage] = useState("")

	// Camera/photo states
	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [cameraActive, setCameraActive] = useState(false)
	const [selfieImage, setSelfieImage] = useState<string | null>(null)
	const [idFrontImage, setIdFrontImage] = useState<string | null>(null)
	const [idBackImage, setIdBackImage] = useState<string | null>(null)

	// Form data
	const [formData, setFormData] = useState({
		documentType: "",
		documentNumber: "",
		fullName: "",
		dateOfBirth: "",
		expiryDate: "",
		country: ""
	})

	// Update progress based on step
	useEffect(() => {
		const progressMap: Record<number, number> = {
			1: 0,
			2: 33,
			3: 66,
			4: 100
		}
		setProgress(progressMap[step] ?? 0)
	}, [step])

	// Camera initialization
	const initializeCamera = async () => {
		try {
			if (!videoRef.current) return

			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: "user",
					width: { ideal: 1280 },
					height: { ideal: 720 }
				}
			})

			videoRef.current.srcObject = stream
			setCameraActive(true)
		} catch (err) {
			console.error("Error accessing camera:", err)
			toast.error("Camera Error", {
				description: "Unable to access your camera. Please check permissions."
			})
		}
	}

	// Stop camera stream
	const stopCamera = () => {
		if (!videoRef.current?.srcObject) return

		const stream = videoRef.current.srcObject as MediaStream
		const tracks = stream.getTracks()

		tracks.forEach((track) => track.stop())
		setCameraActive(false)
	}

	// Capture photo from camera
	const capturePhoto = () => {
		if (!videoRef.current || !canvasRef.current) return

		const video = videoRef.current
		const canvas = canvasRef.current
		const context = canvas.getContext("2d")

		if (!context) return

		// Set canvas dimensions to match video
		canvas.width = video.videoWidth
		canvas.height = video.videoHeight

		// Draw video frame to canvas
		context.drawImage(video, 0, 0, canvas.width, canvas.height)

		// Convert to data URL
		const imageDataUrl = canvas.toDataURL("image/png")

		// Set the appropriate image based on current step
		if (step === 1) {
			setSelfieImage(imageDataUrl)
		} else if (step === 2) {
			setIdFrontImage(imageDataUrl)
		} else if (step === 3) {
			setIdBackImage(imageDataUrl)
		}

		// Stop camera after capture
		stopCamera()
	}

	// Handle file upload
	const handleFileUpload = (
		e: React.ChangeEvent<HTMLInputElement>,
		type: "selfie" | "idFront" | "idBack"
	) => {
		const file = e.target.files?.[0]
		if (!file) return

		const reader = new FileReader()
		reader.onload = (event) => {
			const imageDataUrl = event.target?.result as string

			switch (type) {
				case "selfie":
					setSelfieImage(imageDataUrl)
					break
				case "idFront":
					setIdFrontImage(imageDataUrl)
					break
				case "idBack":
					setIdBackImage(imageDataUrl)
					break
			}
		}

		reader.readAsDataURL(file)
	}

	// Reset captured image
	const resetImage = (type: "selfie" | "idFront" | "idBack") => {
		switch (type) {
			case "selfie":
				setSelfieImage(null)
				break
			case "idFront":
				setIdFrontImage(null)
				break
			case "idBack":
				setIdBackImage(null)
				break
		}
	}

	// Handle form field changes
	const handleFormChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value
		}))
	}

	// Navigate to next step
	const nextStep = () => {
		// Validate current step
		if (step === 1 && !selfieImage) {
			toast.error("Selfie Required", {
				description: "Please take or upload a selfie to continue."
			})
			return
		}

		if (step === 2 && !idFrontImage) {
			toast.error("ID Front Required", {
				description: "Please take or upload the front of your ID document."
			})
			return
		}

		if (step === 3) {
			// Some document types might not need back image
			if (formData.documentType === "passport" && !idBackImage) {
				// For passports, we can proceed without back image
			} else if (!idBackImage) {
				toast.error("ID Back Required", {
					description: "Please take or upload the back of your ID document."
				})
				return
			}

			// Validate document details
			if (
				!formData.documentType ||
				!formData.documentNumber ||
				!formData.fullName
			) {
				toast.error("Missing Information", {
					description: "Please fill in all required document details."
				})
				return
			}
		}

		// Stop camera if active when moving to next step
		if (cameraActive) {
			stopCamera()
		}

		// Move to next step
		if (step < 4) {
			setStep(step + 1)
		}

		// If moving to final step, start verification process
		if (step === 3) {
			verifyIdentity()
		}
	}

	// Go back to previous step
	const prevStep = () => {
		if (step > 1) {
			setStep(step - 1)
		}

		// Stop camera if active
		if (cameraActive) {
			stopCamera()
		}

		// Reset processing state if going back from final step
		if (step === 4) {
			setVerificationStatus("idle")
			setErrorMessage("")
		}
	}

	// Simulate identity verification process
	const verifyIdentity = () => {
		setVerificationStatus("processing")
		setIsProcessing(true)

		// Simulate API call for identity verification
		setTimeout(() => {
			setIsProcessing(false)

			// Simulate 90% success rate
			const isSuccess = Math.random() < 0.9

			if (isSuccess) {
				setVerificationStatus("success")
				toast.success("Verification Successful", {
					description: "Your identity has been verified successfully."
				})
			} else {
				setVerificationStatus("failed")
				setErrorMessage(
					"We couldn't verify your identity. Please ensure your selfie matches your ID document."
				)
				toast.error("Verification Failed", {
					description:
						"We couldn't verify your identity. Please ensure your selfie matches your ID document."
				})
			}
		}, 3000)
	}

	// Complete verification and redirect
	const completeVerification = () => {
		toast.success("Account Setup Complete", {
			description: "Your account has been verified and is ready to use."
		})
		router.push("/")
	}

	// Retry verification
	const retryVerification = () => {
		setStep(1)
		setVerificationStatus("idle")
		setErrorMessage("")
		setSelfieImage(null)
		setIdFrontImage(null)
		setIdBackImage(null)
		setFormData({
			documentType: "",
			documentNumber: "",
			fullName: "",
			dateOfBirth: "",
			expiryDate: "",
			country: ""
		})
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:to-gray-800">
			<Card className="w-full max-w-3xl">
				<CardHeader>
					<CardTitle className="text-2xl">Identity Verification</CardTitle>
					<CardDescription>
						Complete the verification process to activate your account
					</CardDescription>
					<Progress value={progress} className="mt-2 h-2" />
				</CardHeader>

				<CardContent>
					{/* Step 1: Selfie Capture */}
					{step === 1 && (
						<div className="space-y-6">
							<div className="text-center">
								<h2 className="mb-2 text-xl font-semibold">Take a Selfie</h2>
								<p className="text-gray-600 dark:text-gray-400">
									Please take a clear photo of your face. Ensure good lighting
									and remove glasses or face coverings.
								</p>
							</div>

							<Tabs defaultValue="camera" className="w-full">
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="camera">Use Camera</TabsTrigger>
									<TabsTrigger value="upload">Upload Photo</TabsTrigger>
								</TabsList>

								<TabsContent value="camera" className="space-y-4">
									<div className="relative aspect-video overflow-hidden rounded-lg bg-black">
										{!selfieImage ? (
											<>
												<video
													ref={videoRef}
													autoPlay
													playsInline
													className={`h-full w-full object-cover ${cameraActive ? "block" : "hidden"}`}
												/>

												{!cameraActive && (
													<div className="absolute inset-0 flex items-center justify-center">
														<Button onClick={initializeCamera}>
															<Camera className="mr-2 h-4 w-4" />
															Start Camera
														</Button>
													</div>
												)}
											</>
										) : (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={selfieImage || "/placeholder.svg"}
												alt="Your selfie"
												className="h-full w-full object-cover"
											/>
										)}
									</div>

									<canvas ref={canvasRef} className="hidden" />

									<div className="flex justify-center space-x-4">
										{cameraActive && !selfieImage && (
											<Button onClick={capturePhoto}>
												<Camera className="mr-2 h-4 w-4" />
												Take Photo
											</Button>
										)}

										{selfieImage && (
											<Button
												variant="outline"
												onClick={() => resetImage("selfie")}
											>
												<RefreshCw className="mr-2 h-4 w-4" />
												Retake
											</Button>
										)}
									</div>
								</TabsContent>

								<TabsContent value="upload" className="space-y-4">
									<div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
										{!selfieImage ? (
											<>
												<Upload className="mx-auto h-12 w-12 text-gray-400" />
												<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
													Click to upload or drag and drop
												</p>
												<p className="text-xs text-gray-500 dark:text-gray-500">
													PNG, JPG, JPEG up to 5MB
												</p>
												<Input
													type="file"
													accept="image/*"
													className="mx-auto mt-4 max-w-xs"
													onChange={(e) => handleFileUpload(e, "selfie")}
												/>
											</>
										) : (
											<div className="relative">
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img
													src={selfieImage || "/placeholder.svg"}
													alt="Your selfie"
													className="mx-auto max-h-64"
												/>
												<Button
													variant="outline"
													size="sm"
													className="mt-4"
													onClick={() => resetImage("selfie")}
												>
													<RefreshCw className="mr-2 h-4 w-4" />
													Choose Different Photo
												</Button>
											</div>
										)}
									</div>
								</TabsContent>
							</Tabs>

							<Alert>
								<AlertDescription className="flex items-center">
									<CheckCircle className="mr-2 h-4 w-4 text-green-500" />
									Your photo is only used for identity verification and will be
									handled securely.
								</AlertDescription>
							</Alert>
						</div>
					)}

					{/* Step 2: ID Front Capture */}
					{step === 2 && (
						<div className="space-y-6">
							<div className="text-center">
								<h2 className="mb-2 text-xl font-semibold">
									ID Document Front
								</h2>
								<p className="text-gray-600 dark:text-gray-400">
									Take a photo of the front side of your government-issued ID
									document.
								</p>
							</div>

							<Tabs defaultValue="camera" className="w-full">
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="camera">Use Camera</TabsTrigger>
									<TabsTrigger value="upload">Upload Photo</TabsTrigger>
								</TabsList>

								<TabsContent value="camera" className="space-y-4">
									<div className="relative aspect-video overflow-hidden rounded-lg bg-black">
										{!idFrontImage ? (
											<>
												<video
													ref={videoRef}
													autoPlay
													playsInline
													className={`h-full w-full object-cover ${cameraActive ? "block" : "hidden"}`}
												/>

												{!cameraActive && (
													<div className="absolute inset-0 flex items-center justify-center">
														<Button onClick={initializeCamera}>
															<Camera className="mr-2 h-4 w-4" />
															Start Camera
														</Button>
													</div>
												)}
											</>
										) : (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={idFrontImage || "/placeholder.svg"}
												alt="ID front"
												className="h-full w-full object-cover"
											/>
										)}
									</div>

									<div className="flex justify-center space-x-4">
										{cameraActive && !idFrontImage && (
											<Button onClick={capturePhoto}>
												<Camera className="mr-2 h-4 w-4" />
												Take Photo
											</Button>
										)}

										{idFrontImage && (
											<Button
												variant="outline"
												onClick={() => resetImage("idFront")}
											>
												<RefreshCw className="mr-2 h-4 w-4" />
												Retake
											</Button>
										)}
									</div>
								</TabsContent>

								<TabsContent value="upload" className="space-y-4">
									<div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
										{!idFrontImage ? (
											<>
												<FileText className="mx-auto h-12 w-12 text-gray-400" />
												<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
													Upload the front of your ID document
												</p>
												<p className="text-xs text-gray-500 dark:text-gray-500">
													Ensure all details are clearly visible
												</p>
												<Input
													type="file"
													accept="image/*"
													className="mx-auto mt-4 max-w-xs"
													onChange={(e) => handleFileUpload(e, "idFront")}
												/>
											</>
										) : (
											<div className="relative">
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img
													src={idFrontImage || "/placeholder.svg"}
													alt="ID front"
													className="mx-auto max-h-64"
												/>
												<Button
													variant="outline"
													size="sm"
													className="mt-4"
													onClick={() => resetImage("idFront")}
												>
													<RefreshCw className="mr-2 h-4 w-4" />
													Choose Different Photo
												</Button>
											</div>
										)}
									</div>
								</TabsContent>
							</Tabs>

							<Alert>
								<AlertDescription>
									<div className="flex items-start">
										<AlertCircle className="mr-2 mt-0.5 h-4 w-4 text-amber-500" />
										<div>
											<p>Make sure:</p>
											<ul className="mt-1 list-disc pl-5 text-sm">
												<li>All four corners are visible</li>
												<li>Text is clear and readable</li>
												<li>There&apos;s no glare or shadow</li>
											</ul>
										</div>
									</div>
								</AlertDescription>
							</Alert>
						</div>
					)}

					{/* Step 3: ID Back Capture & Document Details */}
					{step === 3 && (
						<div className="space-y-6">
							<div className="text-center">
								<h2 className="mb-2 text-xl font-semibold">
									ID Document Back & Details
								</h2>
								<p className="text-gray-600 dark:text-gray-400">
									Take a photo of the back side of your ID and provide document
									details.
								</p>
							</div>

							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div className="space-y-4">
									<h3 className="font-medium">Document Back</h3>

									<Tabs defaultValue="camera" className="w-full">
										<TabsList className="grid w-full grid-cols-2">
											<TabsTrigger value="camera">Camera</TabsTrigger>
											<TabsTrigger value="upload">Upload</TabsTrigger>
										</TabsList>

										<TabsContent value="camera" className="space-y-4">
											<div className="relative aspect-video overflow-hidden rounded-lg bg-black">
												{!idBackImage ? (
													<>
														<video
															ref={videoRef}
															autoPlay
															playsInline
															className={`h-full w-full object-cover ${cameraActive ? "block" : "hidden"}`}
														/>

														{!cameraActive && (
															<div className="absolute inset-0 flex items-center justify-center">
																<Button onClick={initializeCamera} size="sm">
																	<Camera className="mr-2 h-4 w-4" />
																	Camera
																</Button>
															</div>
														)}
													</>
												) : (
													// eslint-disable-next-line @next/next/no-img-element
													<img
														src={idBackImage || "/placeholder.svg"}
														alt="ID back"
														className="h-full w-full object-cover"
													/>
												)}
											</div>

											<div className="flex justify-center space-x-4">
												{cameraActive && !idBackImage && (
													<Button onClick={capturePhoto} size="sm">
														<Camera className="mr-2 h-4 w-4" />
														Capture
													</Button>
												)}

												{idBackImage && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => resetImage("idBack")}
													>
														<RefreshCw className="mr-2 h-4 w-4" />
														Retake
													</Button>
												)}
											</div>
										</TabsContent>

										<TabsContent value="upload" className="space-y-4">
											<div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center dark:border-gray-700">
												{!idBackImage ? (
													<>
														<FileText className="mx-auto h-8 w-8 text-gray-400" />
														<p className="mt-2 text-xs text-gray-500">
															Upload back of ID
														</p>
														<Input
															type="file"
															accept="image/*"
															className="mt-2"
															onChange={(e) => handleFileUpload(e, "idBack")}
														/>
													</>
												) : (
													<div className="relative">
														{/* eslint-disable-next-line @next/next/no-img-element */}
														<img
															src={idBackImage || "/placeholder.svg"}
															alt="ID back"
															className="mx-auto max-h-32"
														/>
														<Button
															variant="outline"
															size="sm"
															className="mt-2"
															onClick={() => resetImage("idBack")}
														>
															Change
														</Button>
													</div>
												)}
											</div>
										</TabsContent>
									</Tabs>
								</div>

								<div className="space-y-4">
									<h3 className="font-medium">Document Details</h3>

									<div className="space-y-3">
										<div className="space-y-1">
											<Label htmlFor="documentType">Document Type</Label>
											<Select
												value={formData.documentType}
												onValueChange={(value) =>
													handleFormChange("documentType", value)
												}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select document type" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="passport">Passport</SelectItem>
													<SelectItem value="national_id">
														National ID Card
													</SelectItem>
													<SelectItem value="drivers_license">
														Driver&apos;s License
													</SelectItem>
													<SelectItem value="residence_permit">
														Residence Permit
													</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-1">
											<Label htmlFor="documentNumber">Document Number</Label>
											<Input
												id="documentNumber"
												placeholder="Enter document number"
												value={formData.documentNumber}
												onChange={(e) =>
													handleFormChange("documentNumber", e.target.value)
												}
											/>
										</div>

										<div className="space-y-1">
											<Label htmlFor="fullName">
												Full Name (as on document)
											</Label>
											<Input
												id="fullName"
												placeholder="Enter full name"
												value={formData.fullName}
												onChange={(e) =>
													handleFormChange("fullName", e.target.value)
												}
											/>
										</div>

										<div className="grid grid-cols-2 gap-3">
											<div className="space-y-1">
												<Label htmlFor="dateOfBirth">Date of Birth</Label>
												<Input
													id="dateOfBirth"
													type="date"
													value={formData.dateOfBirth}
													onChange={(e) =>
														handleFormChange("dateOfBirth", e.target.value)
													}
												/>
											</div>

											<div className="space-y-1">
												<Label htmlFor="expiryDate">Expiry Date</Label>
												<Input
													id="expiryDate"
													type="date"
													value={formData.expiryDate}
													onChange={(e) =>
														handleFormChange("expiryDate", e.target.value)
													}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Step 4: Verification Results */}
					{step === 4 && (
						<div className="space-y-6">
							<div className="text-center">
								<h2 className="mb-2 text-xl font-semibold">
									Identity Verification
								</h2>
								<p className="text-gray-600 dark:text-gray-400">
									We&apos;re verifying your identity using the provided
									information.
								</p>
							</div>

							{verificationStatus === "processing" && (
								<div className="py-8 text-center">
									<div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-2 border-blue-600"></div>
									<p className="text-lg font-medium">
										Verifying your identity...
									</p>
									<p className="mt-2 text-gray-600 dark:text-gray-400">
										This may take a few moments. We&apos;re comparing your
										selfie with your ID document.
									</p>
									<Progress
										value={isProcessing ? 70 : 30}
										className="mx-auto mt-6 max-w-md"
									/>
								</div>
							)}

							{verificationStatus === "success" && (
								<div className="py-8 text-center">
									<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
										<CheckCircle className="h-8 w-8 text-green-600" />
									</div>
									<p className="text-lg font-medium text-green-600">
										Verification Successful!
									</p>
									<p className="mx-auto mt-2 max-w-md text-gray-600 dark:text-gray-400">
										Your identity has been verified successfully. Your account
										is now ready to use with full access to all features.
									</p>

									<div className="mx-auto mt-8 grid max-w-md grid-cols-1 gap-4 md:grid-cols-3">
										<div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
											<p className="text-xs text-gray-500">Document Type</p>
											<p className="font-medium">
												{formData.documentType
													.replace("_", " ")
													.replace(/\b\w/g, (l) => l.toUpperCase())}
											</p>
										</div>
										<div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
											<p className="text-xs text-gray-500">Name</p>
											<p className="font-medium">
												{formData.fullName || "John Doe"}
											</p>
										</div>
										<div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
											<p className="text-xs text-gray-500">
												Verification Level
											</p>
											<p className="font-medium">Level 2</p>
										</div>
									</div>
								</div>
							)}

							{verificationStatus === "failed" && (
								<div className="py-8 text-center">
									<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
										<AlertCircle className="h-8 w-8 text-red-600" />
									</div>
									<p className="text-lg font-medium text-red-600">
										Verification Failed
									</p>
									<p className="mx-auto mt-2 max-w-md text-gray-600 dark:text-gray-400">
										{errorMessage ||
											"We couldn&apos;t verify your identity. Please ensure your selfie matches your ID document and try again."}
									</p>

									<Alert className="mx-auto mt-6 max-w-md bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
										<AlertDescription className="text-left">
											<div className="space-y-2">
												<p className="font-medium">
													Common reasons for failure:
												</p>
												<ul className="list-disc pl-5 text-sm">
													<li>Poor lighting or image quality</li>
													<li>Glare or reflections on ID document</li>
													<li>Face not clearly visible in selfie</li>
													<li>Document details not legible</li>
												</ul>
											</div>
										</AlertDescription>
									</Alert>
								</div>
							)}
						</div>
					)}
				</CardContent>

				<CardFooter className="flex justify-between">
					{step > 1 && step !== 4 && (
						<Button variant="outline" onClick={prevStep}>
							<ChevronLeft className="mr-2 h-4 w-4" />
							Back
						</Button>
					)}

					{step === 1 && (
						<Button
							variant="outline"
							onClick={() => router.push("/auth/login")}
							className="mr-auto"
						>
							<ChevronLeft className="mr-2 h-4 w-4" />
							Back to Login
						</Button>
					)}

					{step < 4 && (
						<Button onClick={nextStep} disabled={isProcessing}>
							{step === 3 ? "Verify Identity" : "Continue"}
							<ChevronRight className="ml-2 h-4 w-4" />
						</Button>
					)}

					{step === 4 && verificationStatus === "success" && (
						<Button onClick={completeVerification}>
							Continue to Dashboard
							<ChevronRight className="ml-2 h-4 w-4" />
						</Button>
					)}

					{step === 4 && verificationStatus === "failed" && (
						<Button onClick={retryVerification} variant="outline">
							<RefreshCw className="mr-2 h-4 w-4" />
							Try Again
						</Button>
					)}
				</CardFooter>
			</Card>
		</div>
	)
}
