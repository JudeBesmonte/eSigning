"use client"

import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState
} from "react"
import { PenTool, RotateCcw, Upload } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from "@/core/components/ui/tabs"

export interface SignaturePadRef {
	clear: () => void
	isEmpty: () => boolean
	getSignatureData: () => string | null
	getSignatureType: () => "drawn" | "uploaded" | null
}

interface SignaturePadProps {
	onSignatureChange?: (hasSignature: boolean) => void
	className?: string
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
	({ onSignatureChange, className }, ref) => {
		const canvasRef = useRef<HTMLCanvasElement>(null)
		const fileInputRef = useRef<HTMLInputElement>(null)
		const [isDrawing, setIsDrawing] = useState(false)
		const [uploadedImage, setUploadedImage] = useState<string | null>(null)
		const [activeTab, setActiveTab] = useState<"draw" | "upload">("draw")
		const [hasSignature, setHasSignature] = useState(false)

		useImperativeHandle(ref, () => ({
			clear: () => {
				clearCanvas()
				setUploadedImage(null)
				setHasSignature(false)
				onSignatureChange?.(false)
			},
			isEmpty: () => !hasSignature,
			getSignatureData: () => {
				if (activeTab === "draw") {
					return canvasRef.current?.toDataURL() ?? null
				} else if (activeTab === "upload") {
					return uploadedImage
				}
				return null
			},
			getSignatureType: () => {
				if (!hasSignature) return null
				if (activeTab === "draw") return "drawn"
				if (activeTab === "upload") return "uploaded"
				return null
			}
		}))

		const clearCanvas = () => {
			const canvas = canvasRef.current
			if (!canvas) return

			const ctx = canvas.getContext("2d")
			if (!ctx) return

			ctx.clearRect(0, 0, canvas.width, canvas.height)
			// Set transparent background instead of white
			ctx.globalCompositeOperation = "source-over"
		}

		const getCanvasCoordinates = (
			e:
				| React.MouseEvent<HTMLCanvasElement>
				| React.TouchEvent<HTMLCanvasElement>
		) => {
			const canvas = canvasRef.current
			if (!canvas) return { x: 0, y: 0 }

			const rect = canvas.getBoundingClientRect()
			const scaleX = canvas.width / rect.width
			const scaleY = canvas.height / rect.height

			let clientX: number, clientY: number

			if ("touches" in e) {
				// Touch event
				const touch = e.touches[0] ?? e.changedTouches[0]
				if (!touch) return { x: 0, y: 0 }
				clientX = touch.clientX
				clientY = touch.clientY
			} else {
				// Mouse event
				clientX = e.clientX
				clientY = e.clientY
			}

			return {
				x: (clientX - rect.left) * scaleX,
				y: (clientY - rect.top) * scaleY
			}
		}

		const startDrawing = (
			e:
				| React.MouseEvent<HTMLCanvasElement>
				| React.TouchEvent<HTMLCanvasElement>
		) => {
			e.preventDefault()
			setIsDrawing(true)

			const canvas = canvasRef.current
			if (!canvas) return

			const ctx = canvas.getContext("2d")
			if (!ctx) return

			const { x, y } = getCanvasCoordinates(e)

			ctx.lineWidth = 2
			ctx.lineCap = "round"
			ctx.lineJoin = "round"
			ctx.strokeStyle = "#000"
			ctx.globalCompositeOperation = "source-over"

			// Start a new path and move to the click position
			ctx.beginPath()
			ctx.moveTo(x, y)
		}

		const stopDrawing = () => {
			if (isDrawing) {
				const canvas = canvasRef.current
				const ctx = canvas?.getContext("2d")
				if (ctx) {
					ctx.stroke() // Complete the current stroke
				}
			}
			setIsDrawing(false)
			checkHasSignature()
		}

		const draw = (
			e:
				| React.MouseEvent<HTMLCanvasElement>
				| React.TouchEvent<HTMLCanvasElement>
		) => {
			if (!isDrawing) return
			e.preventDefault()

			const canvas = canvasRef.current
			if (!canvas) return

			const ctx = canvas.getContext("2d")
			if (!ctx) return

			const { x, y } = getCanvasCoordinates(e)

			// Draw line to current position
			ctx.lineTo(x, y)
			ctx.stroke()

			// Move to current position for next segment
			ctx.beginPath()
			ctx.moveTo(x, y)
		}

		const checkHasSignature = useCallback(() => {
			let hasData = false

			if (activeTab === "draw") {
				const canvas = canvasRef.current
				if (canvas) {
					const ctx = canvas.getContext("2d")
					if (ctx) {
						const imageData = ctx.getImageData(
							0,
							0,
							canvas.width,
							canvas.height
						)
						// Check if there's any non-transparent pixel
						for (let i = 0; i < imageData.data.length; i += 4) {
							const alpha = imageData.data[i + 3] ?? 0 // Alpha channel
							if (alpha > 0) {
								hasData = true
								break
							}
						}
					}
				}
			} else if (activeTab === "upload") {
				hasData = uploadedImage !== null
			}

			setHasSignature(hasData)
			onSignatureChange?.(hasData)
		}, [activeTab, uploadedImage, onSignatureChange])

		const scaleImageToFit = (
			imageDataUrl: string,
			maxHeight = 200,
			maxWidth = 800 // Optional width limit to prevent extremely wide signatures
		): Promise<string> => {
			return new Promise((resolve) => {
				const img = new Image()
				img.onload = () => {
					const canvas = document.createElement("canvas")
					const ctx = canvas.getContext("2d")
					if (!ctx) {
						resolve(imageDataUrl) // Fallback to original if canvas context fails
						return
					}

					// Calculate new dimensions maintaining aspect ratio
					const originalWidth = img.width
					const originalHeight = img.height
					const aspectRatio = originalWidth / originalHeight

					// Scale to fit the signature area height while maintaining aspect ratio
					let newHeight = maxHeight
					let newWidth = newHeight * aspectRatio

					// If the scaled width exceeds maxWidth, scale down based on width instead
					if (newWidth > maxWidth) {
						newWidth = maxWidth
						newHeight = newWidth / aspectRatio
					}

					canvas.width = newWidth
					canvas.height = newHeight

					// Don't set a background - preserve transparency
					// The canvas will have a transparent background by default
					// Only set background if the original image doesn't have transparency

					// Draw the scaled image
					ctx.drawImage(img, 0, 0, newWidth, newHeight)

					// Convert to base64 with high quality, preserving transparency
					const scaledDataUrl = canvas.toDataURL("image/png", 1.0)
					resolve(scaledDataUrl)
				}
				img.onerror = () => {
					resolve(imageDataUrl) // Fallback to original if image load fails
				}
				img.src = imageDataUrl
			})
		}

		const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (!file) return

			if (!file.type.startsWith("image/")) {
				alert("Please select an image file")
				return
			}

			const reader = new FileReader()
			reader.onload = async (event) => {
				const result = event.target?.result as string

				try {
					// Scale the image to fit signature area while maintaining aspect ratio
					// Limit height to 200px and width to 800px to prevent extremely wide signatures
					const scaledImage = await scaleImageToFit(result, 200, 800)

					console.log("Debug: Image scaling", {
						originalSize: result.length,
						scaledSize: scaledImage.length,
						originalPrefix: result.substring(0, 50),
						scaledPrefix: scaledImage.substring(0, 50)
					})

					setUploadedImage(scaledImage)
					setHasSignature(true)
					onSignatureChange?.(true)
				} catch (error) {
					console.error("Error scaling image:", error)
					// Fallback to original image if scaling fails
					setUploadedImage(result)
					setHasSignature(true)
					onSignatureChange?.(true)
				}
			}
			reader.readAsDataURL(file)
		}

		const handleTabChange = (tab: string) => {
			setActiveTab(tab as "draw" | "upload")
			// Check signature for new tab
			setTimeout(checkHasSignature, 100)
		}

		useEffect(() => {
			const canvas = canvasRef.current
			if (!canvas) return

			// Set canvas size
			canvas.width = 500
			canvas.height = 200

			const ctx = canvas.getContext("2d")
			if (!ctx) return

			// Set initial canvas state with transparent background
			ctx.globalCompositeOperation = "source-over"
			ctx.lineCap = "round"
			ctx.lineJoin = "round"
		}, [])

		return (
			<div className={className}>
				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					className="w-full"
				>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="draw" className="flex items-center gap-2">
							<PenTool className="h-4 w-4" />
							Draw
						</TabsTrigger>
						<TabsTrigger value="upload" className="flex items-center gap-2">
							<Upload className="h-4 w-4" />
							Upload
						</TabsTrigger>
					</TabsList>

					<TabsContent value="draw" className="space-y-4">
						<div className="rounded-lg border bg-card p-4 shadow-sm">
							<Label className="mb-2 block text-sm font-medium text-card-foreground">
								Draw your signature below
							</Label>
							<div className="overflow-hidden rounded-lg border bg-background">
								<canvas
									ref={canvasRef}
									className="block w-full cursor-crosshair bg-background dark:bg-gray-100"
									onMouseDown={startDrawing}
									onMouseUp={stopDrawing}
									onMouseMove={draw}
									onMouseLeave={stopDrawing}
									onTouchStart={startDrawing}
									onTouchEnd={stopDrawing}
									onTouchMove={draw}
									style={{
										maxWidth: "100%",
										height: "200px",
										touchAction: "none"
									}}
								/>
							</div>
							<div className="mt-3 flex justify-end">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										clearCanvas()
										setHasSignature(false)
										onSignatureChange?.(false)
									}}
									className="flex items-center gap-1"
								>
									<RotateCcw className="h-3 w-3" />
									Clear
								</Button>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="upload" className="space-y-4">
						<div className="rounded-lg border bg-card p-4 shadow-sm">
							<Label
								htmlFor="signature-upload"
								className="mb-2 block text-sm font-medium text-card-foreground"
							>
								Upload signature image
							</Label>
							<div className="space-y-4">
								<Input
									ref={fileInputRef}
									id="signature-upload"
									type="file"
									accept="image/*"
									onChange={handleFileUpload}
									className="cursor-pointer"
								/>
								<p className="text-xs text-muted-foreground">
									Accepted formats: PNG, JPG, GIF. Images will be automatically
									scaled to maintain aspect ratio.
								</p>
							</div>
							{uploadedImage && (
								<div className="mt-4 rounded-lg border bg-muted/30 p-4">
									<Label className="mb-2 block text-sm font-medium text-muted-foreground">
										Preview (scaled to signature area):
									</Label>
									<div className="flex justify-center">
										<div
											className="rounded border bg-background p-2 shadow-sm dark:bg-gray-100"
											style={{ maxHeight: "200px" }}
										>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={uploadedImage}
												alt="Uploaded signature"
												className="max-h-[180px] max-w-full rounded object-contain"
												style={{ height: "auto", width: "auto" }}
											/>
										</div>
									</div>
									<p className="mt-2 text-center text-xs text-muted-foreground">
										Image has been automatically scaled to fit signature area
										while maintaining aspect ratio
									</p>
								</div>
							)}
						</div>
					</TabsContent>
				</Tabs>
			</div>
		)
	}
)

SignaturePad.displayName = "SignaturePad"
