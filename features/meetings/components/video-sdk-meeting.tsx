"use client"

import { useEffect, useRef, useState } from "react"
import {
	MeetingProvider,
	useMeeting,
	useParticipant
} from "@videosdk.live/react-sdk"
import {
	Circle,
	Mic,
	MicOff,
	// MessageSquare,
	Monitor,
	MonitorOff,
	// Phone,
	PhoneOff,
	Settings,
	Square,
	Users,
	Video,
	VideoOff
	// MoreVertical,
	// Grid3X3,
	// Captions,
	// Hand,
	// Clock,
	// Calendar
} from "lucide-react"
import { toast } from "sonner"

import { VideoButton } from "./ui"

interface VideoSDKMeetingProps {
	roomId: string
	token: string
	participantName: string
	role: "host" | "participant"
	onLeave: () => void
}

// Modern participant video component
function ParticipantVideo({ participantId }: { participantId: string }) {
	const {
		webcamStream,
		webcamOn,
		micOn,
		isLocal,
		displayName,
		screenShareStream,
		screenShareOn
	} = useParticipant(participantId)
	const [streamSet, setStreamSet] = useState(false)
	const videoRef = useRef<HTMLVideoElement>(null)

	// Handle video stream setup
	useEffect(() => {
		const videoElement = videoRef.current

		if (videoElement && webcamStream && webcamOn && !streamSet) {
			try {
				if (
					webcamStream.track &&
					webcamStream.track instanceof MediaStreamTrack
				) {
					const mediaStream = new MediaStream([webcamStream.track])
					videoElement.srcObject = mediaStream
					setStreamSet(true)
				} else {
					console.error(`❌ Invalid stream for ${participantId}:`, webcamStream)
				}
			} catch (error) {
				console.error(
					`❌ Error setting video stream for ${participantId}:`,
					error
				)
			}
		}

		if (!webcamOn && streamSet) {
			setStreamSet(false)
			if (videoElement) {
				videoElement.srcObject = null
			}
			// Stop the webcam track to turn off camera light
			if (webcamStream?.track) {
				webcamStream.track.stop()
				console.log("📹 Webcam track stopped for:", participantId)
			}
		}
	}, [participantId, webcamStream, webcamOn, streamSet])

	// Handle screen sharing stream setup
	useEffect(() => {
		const videoElement = videoRef.current

		if (videoElement && screenShareStream && screenShareOn) {
			try {
				console.log(
					"🖥️ Setting up screen share stream for:",
					participantId,
					displayName
				)
				if (
					screenShareStream.track &&
					screenShareStream.track instanceof MediaStreamTrack
				) {
					const mediaStream = new MediaStream([screenShareStream.track])
					videoElement.srcObject = mediaStream
					setStreamSet(true)
					console.log("✅ Screen share stream connected for:", participantId)
				} else {
					console.error(
						`❌ Invalid screen share stream for ${participantId}:`,
						screenShareStream
					)
				}
			} catch (error) {
				console.error(
					`❌ Error setting screen share stream for ${participantId}:`,
					error
				)
			}
		}

		if (!screenShareOn && streamSet) {
			setStreamSet(false)
			if (videoElement) {
				videoElement.srcObject = null
			}
			// Stop the screen share track
			if (screenShareStream?.track) {
				screenShareStream.track.stop()
				console.log("🖥️ Screen share track stopped for:", participantId)
			}
			console.log("🖥️ Screen share stopped for:", participantId)
		}
	}, [participantId, screenShareStream, screenShareOn, streamSet, displayName])

	// Cleanup streams on unmount
	useEffect(() => {
		const videoElement = videoRef.current

		return () => {
			// Stop all tracks when component unmounts
			if (webcamStream?.track) {
				webcamStream.track.stop()
				console.log("📹 Webcam track stopped on unmount for:", participantId)
			}
			if (screenShareStream?.track) {
				screenShareStream.track.stop()
				console.log(
					"🖥️ Screen share track stopped on unmount for:",
					participantId
				)
			}

			// Also stop any active media streams from the video element
			if (videoElement?.srcObject) {
				const stream = videoElement.srcObject as MediaStream
				stream.getTracks().forEach((track) => {
					track.stop()
					console.log("🔴 Media track stopped from video element:", track.kind)
				})
				videoElement.srcObject = null
			}

			setStreamSet(false)
		}
	}, [participantId, webcamStream, screenShareStream])

	useEffect(() => {
		setStreamSet(false)
	}, [webcamStream, screenShareStream])

	// Generate unique display name
	const getDisplayName = () => {
		if (isLocal) {
			return "You"
		}
		if (displayName) {
			return displayName
		}
		return `Participant ${participantId.slice(-4)}`
	}

	// Check if this is a screen share
	const isScreenShare = screenShareOn && screenShareStream

	console.log(`🎥 Participant ${participantId} (${getDisplayName()}):`, {
		webcamOn,
		screenShareOn,
		isScreenShare,
		hasWebcamStream: !!webcamStream,
		hasScreenShareStream: !!screenShareStream,
		isLocal
	})

	return (
		<div className="group relative overflow-hidden rounded-2xl border border-gray-700/30 bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl">
			{isScreenShare ? (
				// Screen share display
				<video
					ref={videoRef}
					autoPlay
					playsInline
					muted={isLocal}
					onLoadedMetadata={() => {
						console.log(
							"🖥️ Screen share video loaded for:",
							participantId,
							getDisplayName()
						)
					}}
					onError={(e) => {
						console.error(`❌ Screen share error for ${participantId}:`, e)
						setStreamSet(false)
					}}
					className="h-full w-full bg-black object-cover"
				/>
			) : webcamOn ? (
				// Regular webcam display
				<video
					ref={videoRef}
					autoPlay
					playsInline
					muted={isLocal}
					onLoadedMetadata={() => {
						console.log(
							"📹 Webcam video loaded for:",
							participantId,
							getDisplayName()
						)
					}}
					onError={(e) => {
						console.error(`❌ Video error for ${participantId}:`, e)
						setStreamSet(false)
					}}
					className="h-full w-full bg-black object-cover"
				/>
			) : (
				// No video display
				<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
					<div className="text-center text-white">
						<div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
							<span className="text-2xl font-bold">
								{getDisplayName().charAt(0).toUpperCase()}
							</span>
						</div>
						<p className="text-sm font-semibold text-gray-200">
							{getDisplayName()}
						</p>
					</div>
				</div>
			)}

			{/* Modern overlay */}
			<div
				className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent ${
					isLocal ? "opacity-100" : "opacity-0 group-hover:opacity-100"
				} transition-all duration-300`}
			>
				{/* Bottom overlay with name and mic status */}
				<div className="absolute bottom-0 left-0 right-0 p-4">
					<div className="flex items-center justify-between">
						<span className="rounded-full bg-black/40 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
							{isScreenShare
								? `${getDisplayName()} (Screen Share)`
								: getDisplayName()}
						</span>

						{/* Mic status indicator */}
						<div className="flex items-center space-x-2">
							{micOn ? (
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/90 shadow-lg">
									<Mic className="h-4 w-4 text-white" />
								</div>
							) : (
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/90 shadow-lg">
									<MicOff className="h-4 w-4 text-white" />
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Local indicator */}
				{isLocal && (
					<div className="absolute left-3 top-3">
						<div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
							You
						</div>
					</div>
				)}

				{/* Screen share indicator */}
				{isScreenShare && (
					<div className="absolute right-3 top-3">
						<div className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
							Screen Share
						</div>
					</div>
				)}
			</div>

			{/* Additional "You" indicator for local user - always visible */}
			{isLocal && !isScreenShare && (
				<div className="absolute right-3 top-3">
					<div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
						You
					</div>
				</div>
			)}
		</div>
	)
}

// Modern meeting controls
function MeetingControls({ onLeave }: { onLeave: () => void; roomId: string }) {
	const {
		leave,
		toggleMic,
		toggleWebcam,
		toggleScreenShare,
		startRecording,
		stopRecording,
		recordingState
	} = useMeeting()
	const [isMicOn, setIsMicOn] = useState(true)
	const [isCameraOn, setIsCameraOn] = useState(true)
	const [isScreenSharing, setIsScreenSharing] = useState(false)
	const [isRecording, setIsRecording] = useState(false)

	const handleLeave = () => {
		// Show leaving toast
		toast.info("Leaving the meeting...", {
			duration: 2000,
			position: "top-center",
			style: {
				background: "#f59e0b",
				color: "white",
				border: "none"
			}
		})

		// Stop all media tracks before leaving
		if (typeof window !== "undefined") {
			// Stop all existing video tracks by accessing the current streams
			const videoElements = document.querySelectorAll("video")
			videoElements.forEach((video) => {
				if (video.srcObject) {
					const stream = video.srcObject as MediaStream
					stream.getTracks().forEach((track) => {
						track.stop()
						console.log(
							"🔴 Media track stopped from video element when leaving:",
							track.kind
						)
					})
					video.srcObject = null
				}
			})

			// Also try to stop any active getUserMedia streams
			navigator.mediaDevices
				.getUserMedia({ video: true, audio: true })
				.then((stream) => {
					stream.getTracks().forEach((track) => {
						track.stop()
						console.log(
							"🔴 Media track stopped when leaving meeting:",
							track.kind
						)
					})
				})
				.catch(() => {
					// Ignore errors if no media access
				})
		}

		leave()
		onLeave()
	}

	const handleToggleMic = () => {
		toggleMic()
		setIsMicOn(!isMicOn)
	}

	const handleToggleCamera = () => {
		toggleWebcam()
		setIsCameraOn(!isCameraOn)

		// If turning off camera, ensure all video tracks are stopped
		if (isCameraOn) {
			console.log("📹 Camera turned off - ensuring tracks are stopped")
			// Stop all existing video tracks by accessing the current streams
			if (typeof window !== "undefined") {
				// Get all video elements and stop their tracks
				const videoElements = document.querySelectorAll("video")
				videoElements.forEach((video) => {
					if (video.srcObject) {
						const stream = video.srcObject as MediaStream
						stream.getTracks().forEach((track) => {
							if (track.kind === "video") {
								track.stop()
								console.log("🔴 Video track stopped from video element")
							}
						})
						video.srcObject = null
					}
				})

				// Also try to stop any active getUserMedia streams
				navigator.mediaDevices
					.getUserMedia({ video: true })
					.then((stream) => {
						stream.getTracks().forEach((track) => {
							if (track.kind === "video") {
								track.stop()
								console.log("🔴 Video track stopped when camera turned off")
							}
						})
					})
					.catch(() => {
						// Ignore errors if no media access
					})
			}
		}
	}

	const handleToggleScreenShare = async () => {
		try {
			console.log("🖥️ Toggling screen share...")
			toggleScreenShare()
			setIsScreenSharing(!isScreenSharing)
			console.log("🖥️ Screen share toggled:", !isScreenSharing)
		} catch (error) {
			console.error("❌ Error toggling screen share:", error)
		}
	}

	const handleToggleRecording = () => {
		try {
			console.log("🎬 Recording button clicked!")
			console.log("🎬 Current recording state:", recordingState)
			console.log("🎬 isRecording state:", isRecording)

			if (
				recordingState === "RECORDING" ||
				recordingState === "RECORDING_STARTED"
			) {
				console.log("🛑 Stopping recording...")
				stopRecording()
				console.log("🛑 Recording stop requested")
			} else {
				console.log("🔴 Starting recording...")
				startRecording()
				console.log("🔴 Recording start requested")
			}
		} catch (error) {
			console.error("❌ Recording error:", error)
			toast.error("Failed to toggle recording", {
				duration: 3000,
				position: "top-center"
			})
		}
	}

	// Update recording state when it changes
	useEffect(() => {
		console.log("🎬 Recording state changed:", recordingState)
		setIsRecording(
			recordingState === "RECORDING" || recordingState === "RECORDING_STARTED"
		)

		if (
			recordingState === "RECORDING" ||
			recordingState === "RECORDING_STARTED"
		) {
			toast.success("Recording started", {
				duration: 2000,
				position: "top-center",
				style: {
					background: "#dc2626",
					color: "white",
					border: "none"
				}
			})
		} else if (recordingState === "RECORDING_STOPPED" && isRecording) {
			// Only show "Recording stopped" toast if recording was actually active
			toast.info("Recording stopped", {
				duration: 2000,
				position: "top-center"
			})
		}
	}, [recordingState, isRecording])

	// Enable camera and mic once on mount
	useEffect(() => {
		let isEnabled = false

		const enableCameraAndMic = async () => {
			if (isEnabled) return

			try {
				if (typeof window !== "undefined" && navigator.mediaDevices) {
					const stream = await navigator.mediaDevices.getUserMedia({
						video: true,
						audio: true
					})
					stream.getTracks().forEach((track) => track.stop())
				}

				setTimeout(() => {
					if (!isEnabled) {
						try {
							toggleMic()
							toggleWebcam()
							isEnabled = true
						} catch (error) {
							console.error(
								"❌ Error enabling camera/mic through VideoSDK:",
								error
							)
						}
					}
				}, 1000)
			} catch (error) {
				console.error("❌ Error enabling camera/mic:", error)
			}
		}

		void enableCameraAndMic()

		return () => {
			isEnabled = true
		}
	}, []) // Add empty dependency array to run only once

	return (
		<div className="flex-shrink-0 border-t border-gray-700/30 bg-gray-900/95 p-2 backdrop-blur-xl md:p-4">
			<div className="flex items-center justify-center space-x-2 md:space-x-4">
				{/* Main controls */}
				<VideoButton
					variant={isMicOn ? "default" : "destructive"}
					onClick={handleToggleMic}
					icon={isMicOn ? Mic : MicOff}
					className="h-10 w-10 md:h-12 md:w-12"
				/>

				<VideoButton
					variant={isCameraOn ? "default" : "destructive"}
					onClick={handleToggleCamera}
					icon={isCameraOn ? Video : VideoOff}
					className="h-10 w-10 md:h-12 md:w-12"
				/>

				<VideoButton
					variant={isScreenSharing ? "destructive" : "outline"}
					onClick={handleToggleScreenShare}
					icon={isScreenSharing ? MonitorOff : Monitor}
					className="h-10 w-10 md:h-12 md:w-12"
				/>

				{/* Recording Button */}
				<div className="flex flex-col items-center">
					<VideoButton
						variant={isRecording ? "destructive" : "outline"}
						onClick={handleToggleRecording}
						icon={isRecording ? Square : Circle}
						className={`h-10 w-10 md:h-12 md:w-12 ${isRecording ? "animate-pulse bg-red-600 hover:bg-red-700" : ""}`}
					/>
					{isRecording && (
						<div className="mt-1 animate-pulse text-xs font-medium text-red-400">
							Recording
						</div>
					)}
				</div>

				<VideoButton
					variant="destructive"
					onClick={handleLeave}
					icon={PhoneOff}
					className="h-10 w-10 md:h-12 md:w-12"
				/>
			</div>
		</div>
	)
}

// Main meeting component - Modern design
function MeetingComponent({
	onLeave,
	roomId
}: {
	onLeave: () => void
	roomId: string
}) {
	const [participantIds, setParticipantIds] = useState<string[]>([])

	const { participants, localParticipant, join, recordingState } = useMeeting({
		onParticipantJoined: (participant) => {
			console.log(
				"👋 Participant joined:",
				participant.id,
				participant.displayName
			)
			const participantName =
				participant.displayName ?? `Participant ${participant.id.slice(-4)}`
			toast.success(`${participantName} joined the meeting`, {
				duration: 3000,
				position: "top-center",
				style: {
					background: "#10b981",
					color: "white",
					border: "none"
				}
			})
		},
		onParticipantLeft: (participant) => {
			console.log(
				"👋 Participant left:",
				participant.id,
				participant.displayName
			)
			const participantName =
				participant.displayName ?? `Participant ${participant.id.slice(-4)}`
			toast.info(`${participantName} left the meeting`, {
				duration: 3000,
				position: "top-center",
				style: {
					background: "#3b82f6",
					color: "white",
					border: "none"
				}
			})
		},
		onWebcamRequested: (data) => {
			data.accept()
		},
		onMicRequested: (data) => {
			data.accept()
		}
	})

	// Join meeting once on mount
	useEffect(() => {
		let hasJoined = false

		if (!hasJoined) {
			join()
			hasJoined = true

			// Show welcome toast when joining
			toast.success("Welcome to the meeting!", {
				duration: 2000,
				position: "top-center",
				style: {
					background: "#10b981",
					color: "white",
					border: "none"
				}
			})
		}

		return () => {
			hasJoined = false
			// Cleanup all media streams when leaving
			if (typeof window !== "undefined" && navigator.mediaDevices) {
				// Stop all active media tracks
				navigator.mediaDevices
					.enumerateDevices()
					.then((_devices) => {
						// Force stop all video and audio tracks
						navigator.mediaDevices
							.getUserMedia({ video: true, audio: true })
							.then((stream) => {
								stream.getTracks().forEach((track) => {
									track.stop()
									console.log(
										"🔴 Media track stopped on meeting cleanup:",
										track.kind
									)
								})
							})
							.catch(() => {
								// Ignore errors if no media access
							})
					})
					.catch(() => {
						// Fallback: try to stop any active streams
						try {
							navigator.mediaDevices
								.getUserMedia({ video: true, audio: true })
								.then((stream) => {
									stream.getTracks().forEach((track) => {
										track.stop()
										console.log("🔴 Fallback media track stopped:", track.kind)
									})
								})
								.catch(() => {
									// Ignore errors
								})
						} catch {
							console.log("🔴 Could not access media devices for cleanup")
						}
					})
			}
		}
	}, []) // Remove join from dependencies to prevent infinite loop

	// Update participant list when participants change
	useEffect(() => {
		if (localParticipant) {
			// Only include participants who have actually joined
			const actualParticipants = new Set<string>()
			const participantNames = new Set<string>()

			// Add local participant
			actualParticipants.add(localParticipant.id)
			const localName = localParticipant.displayName ?? ""
			if (localName) {
				participantNames.add(localName.toLowerCase())
			}

			// Add remote participants who have joined
			participants.forEach((participant, id) => {
				// Only add if participant has actually joined and is not the local participant
				if (participant?.id && id !== localParticipant.id) {
					const remoteName = participant.displayName ?? ""

					// Skip if this participant has the same name as local participant
					if (localName.toLowerCase() === remoteName.toLowerCase()) {
						console.log(
							"🚫 Skipping duplicate participant with same name:",
							remoteName
						)
						return
					}

					// Skip if we already have a participant with this name
					if (remoteName && participantNames.has(remoteName.toLowerCase())) {
						console.log("🚫 Skipping duplicate participant name:", remoteName)
						return
					}

					// Add this participant
					actualParticipants.add(id)
					if (remoteName) {
						participantNames.add(remoteName.toLowerCase())
					}
				}
			})

			const newParticipantIds = Array.from(actualParticipants)

			setParticipantIds((prev) => {
				if (
					prev.length !== newParticipantIds.length ||
					!prev.every((id) => newParticipantIds.includes(id))
				) {
					console.log(
						"📊 Updated participant list:",
						newParticipantIds.length,
						"participants"
					)
					console.log("📊 Participant IDs:", newParticipantIds)

					// Log screen sharing status for each participant
					newParticipantIds.forEach((participantId) => {
						const participant =
							participants.get(participantId) ??
							(participantId === localParticipant.id ? localParticipant : null)
						if (participant) {
							console.log(`🎥 ${participant.displayName ?? participantId}:`, {
								webcamOn: participant.webcamOn,
								micOn: participant.micOn
							})
						}
					})

					return newParticipantIds
				}
				return prev
			})
		}
	}, [localParticipant?.id, participants.size, localParticipant])

	// Modern grid layout
	const getGridClass = (count: number) => {
		if (count === 1) return "grid-cols-1"
		if (count === 2) return "grid-cols-2"
		if (count <= 4) return "grid-cols-2"
		if (count <= 9) return "grid-cols-3"
		if (count <= 16) return "grid-cols-4"
		if (count <= 25) return "grid-cols-5"
		return "grid-cols-6"
	}

	return (
		<div className="flex h-screen flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
			{/* Recording Indicator */}
			{recordingState === "RECORDING" && (
				<div className="absolute left-1/2 top-4 z-50 flex -translate-x-1/2 items-center space-x-2 rounded-lg bg-red-600 px-4 py-2 text-white shadow-lg">
					<div className="h-3 w-3 animate-pulse rounded-full bg-white"></div>
					<span className="text-sm font-medium">RECORDING</span>
				</div>
			)}

			{/* Modern top bar */}
			<div className="flex-shrink-0 border-b border-gray-700/30 bg-gray-900/95 backdrop-blur-xl">
				<div className="flex items-center justify-between px-4 py-3 md:px-8">
					<div className="flex items-center space-x-3 md:space-x-6">
						<div className="flex items-center space-x-2 md:space-x-3">
							<div className="h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
							<h1 className="text-sm font-semibold text-white md:text-base">
								Video Meeting
							</h1>
						</div>
						<span className="hidden text-sm text-gray-400 md:inline">•</span>
						<div className="flex items-center space-x-2 text-gray-300">
							<Users className="h-4 w-4" />
							<span className="text-xs font-medium md:text-sm">
								{participantIds.length} participants
							</span>
						</div>
					</div>

					<div className="flex items-center space-x-2 md:space-x-3">
						<VideoButton
							variant="outline"
							onClick={() => console.log("Settings clicked")}
							icon={Settings}
							className="h-7 w-7 border-gray-600 hover:bg-gray-800 md:h-8 md:w-8"
						/>
					</div>
				</div>
			</div>

			{/* Video Grid - Responsive layout */}
			<div className="flex-1 overflow-auto p-2 pb-20 md:p-4 md:pb-24">
				<div
					className={`grid gap-2 md:gap-4 ${getGridClass(participantIds.length)}`}
				>
					{participantIds.map((participantId) => (
						<div
							key={participantId}
							className="aspect-video max-h-64 md:max-h-80 lg:max-h-96"
						>
							<ParticipantVideo participantId={participantId} />
						</div>
					))}
				</div>
			</div>

			{/* Controls */}
			<MeetingControls onLeave={onLeave} roomId={roomId} />
		</div>
	)
}

// Main component with provider
export default function VideoSDKMeeting({
	roomId,
	token,
	participantName,
	role: _role,
	onLeave
}: VideoSDKMeetingProps) {
	// Check if VideoSDK is properly configured
	if (!token || token === "invalid-token") {
		return (
			<div className="flex h-screen items-center justify-center bg-gray-900">
				<div className="text-center text-white">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500">
						<svg
							className="h-8 w-8"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					</div>
					<h2 className="mb-2 text-xl font-semibold">
						Video Meeting Unavailable
					</h2>
					<p className="mb-4 text-gray-300">
						VideoSDK is not properly configured. Please check your environment
						variables.
					</p>
					<div className="space-y-2 text-sm text-gray-400">
						<p>Required environment variables:</p>
						<p className="font-mono">VIDEO_SDK_API_KEY</p>
						<p className="font-mono">VIDEO_SDK_SECRET</p>
					</div>
					<button
						onClick={onLeave}
						className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					>
						Leave Meeting
					</button>
				</div>
			</div>
		)
	}

	return (
		<MeetingProvider
			config={{
				meetingId: roomId,
				micEnabled: false,
				webcamEnabled: false,
				name: participantName,
				mode: "SEND_AND_RECV",
				multiStream: true,
				debugMode: true
			}}
			token={token}
		>
			<MeetingComponent onLeave={onLeave} roomId={roomId} />
		</MeetingProvider>
	)
}
