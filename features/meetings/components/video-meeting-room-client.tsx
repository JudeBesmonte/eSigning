"use client"

import { useEffect, useState } from "react"
import {
	MeetingProvider,
	useMeeting,
	useParticipant
} from "@videosdk.live/react-sdk"
import {
	Circle,
	Mic,
	MicOff,
	PhoneOff,
	Settings,
	Square,
	Users,
	Video,
	VideoOff
} from "lucide-react"

import { VideoBadge, VideoButton } from "./ui"

interface VideoMeetingRoomProps {
	roomId: string
	meetingId: string
	token: string
	participantName: string
	role: "host" | "participant"
	meetingTitle: string
	onLeave: () => void
}

// Participant video component
function ParticipantVideo({ participantId }: { participantId: string }) {
	const { webcamStream, micStream, webcamOn, micOn, isLocal } =
		useParticipant(participantId)

	return (
		<div className="relative overflow-hidden rounded-lg bg-gray-800">
			{webcamOn && webcamStream ? (
				<video
					autoPlay
					playsInline
					muted={isLocal}
					ref={(node) => {
						if (node) node.srcObject = webcamStream as unknown as MediaStream
					}}
					className="h-full w-full bg-black object-contain"
				/>
			) : (
				<div className="flex h-full w-full items-center justify-center bg-gray-700">
					<div className="text-center text-white">
						<div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gray-600">
							<Users className="h-8 w-8" />
						</div>
						<p className="text-sm">Camera Off</p>
					</div>
				</div>
			)}

			{/* Audio indicator */}
			{micOn && micStream && (
				<div className="absolute bottom-2 left-2">
					<VideoBadge className="bg-green-500 text-white" icon={Mic}>
						Audio
					</VideoBadge>
				</div>
			)}

			{/* Local indicator */}
			{isLocal && (
				<div className="absolute left-2 top-2">
					<VideoBadge variant="outline" className="bg-blue-500 text-white">
						You
					</VideoBadge>
				</div>
			)}
		</div>
	)
}

// Meeting controls component
function MeetingControls({ onLeave }: { onLeave: () => void }) {
	const { leave, startRecording, stopRecording, recordingState } = useMeeting()
	const [isMicOn, setIsMicOn] = useState(true)
	const [isCameraOn, setIsCameraOn] = useState(true)
	const [isRecording, setIsRecording] = useState(false)

	// Check if user is host (you can pass this as a prop or determine from meeting context)
	const isHost = true // For now, show to everyone. You can make this dynamic later

	// Update recording state when it changes
	useEffect(() => {
		console.log("🎬 Recording state changed:", recordingState)
		setIsRecording(
			recordingState === "RECORDING" || recordingState === "RECORDING_STARTED"
		)
	}, [recordingState])

	const handleLeave = () => {
		// Stop recording if active before leaving
		if (isRecording) {
			stopRecording()
		}

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
				}
			})
		}

		leave()
		onLeave()
	}

	const toggleMic = () => {
		setIsMicOn(!isMicOn)
	}

	const toggleCamera = () => {
		setIsCameraOn(!isCameraOn)
	}

	const handleRecordingToggle = () => {
		try {
			console.log("🎬 Recording button clicked!")
			console.log("🎬 Current recording state:", recordingState)
			console.log("🎬 isRecording state:", isRecording)

			if (isRecording || recordingState === "RECORDING_STARTED") {
				console.log("🛑 Stopping recording...")
				stopRecording()
				console.log("🛑 Recording stopped")
			} else {
				console.log("🔴 Starting recording...")
				startRecording()
				console.log("🔴 Recording started")
			}
		} catch (error) {
			console.error("❌ Recording error:", error)
		}
	}

	return (
		<div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center space-x-4 rounded-lg bg-gray-800 px-6 py-3">
			<VideoButton
				onClick={toggleMic}
				variant={isMicOn ? "default" : "destructive"}
				icon={isMicOn ? Mic : MicOff}
			/>
			<VideoButton
				onClick={toggleCamera}
				variant={isCameraOn ? "default" : "destructive"}
				icon={isCameraOn ? Video : VideoOff}
			/>

			{/* Recording Button - Only show for host */}
			{isHost && (
				<div className="group relative flex flex-col items-center">
					<VideoButton
						onClick={handleRecordingToggle}
						variant={isRecording ? "destructive" : "outline"}
						icon={isRecording ? Square : Circle}
						className={`${isRecording ? "animate-pulse bg-red-600 hover:bg-red-700" : ""} transition-all duration-200`}
					/>
					{isRecording && (
						<div className="mt-1 animate-pulse text-xs font-medium text-red-400">
							Recording
						</div>
					)}
					{/* Tooltip */}
					<div className="pointer-events-none absolute bottom-full mb-2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
						{isRecording ? "Stop Recording" : "Start Recording"}
					</div>
				</div>
			)}

			<VideoButton
				onClick={() => console.log("Settings clicked")}
				variant="outline"
				icon={Settings}
			/>
			<VideoButton
				onClick={handleLeave}
				variant="destructive"
				icon={PhoneOff}
				className="bg-red-600 hover:bg-red-700"
			/>
		</div>
	)
}

// Recording status indicator component
function RecordingIndicator() {
	const { recordingState } = useMeeting()
	const [isVisible, setIsVisible] = useState(false)
	const [showStopped, setShowStopped] = useState(false)

	useEffect(() => {
		console.log("🎬 RecordingIndicator - State changed:", recordingState)
		if (
			recordingState === "RECORDING" ||
			recordingState === "RECORDING_STARTED"
		) {
			setIsVisible(true)
			setShowStopped(false)
		} else if (recordingState === "RECORDING_STOPPED" && isVisible) {
			setIsVisible(false)
			setShowStopped(true)
			// Hide stopped message after 3 seconds
			setTimeout(() => setShowStopped(false), 3000)
		} else {
			setIsVisible(false)
		}
	}, [recordingState, isVisible])

	if (!isVisible && !showStopped) return null

	return (
		<div className="absolute left-1/2 top-4 z-50 flex -translate-x-1/2 items-center space-x-2 rounded-lg px-4 py-2 text-white shadow-lg transition-all duration-300">
			{isVisible ? (
				<div className="flex items-center space-x-2 bg-red-600">
					<div className="h-3 w-3 animate-pulse rounded-full bg-white"></div>
					<span className="text-sm font-medium">RECORDING</span>
				</div>
			) : showStopped ? (
				<div className="flex items-center space-x-2 bg-green-600">
					<div className="h-3 w-3 rounded-full bg-white"></div>
					<span className="text-sm font-medium">RECORDING STOPPED</span>
				</div>
			) : null}
		</div>
	)
}

// Recording status display component
function RecordingStatusDisplay() {
	const { recordingState } = useMeeting()
	const [isRecording, setIsRecording] = useState(false)

	useEffect(() => {
		console.log("🎬 RecordingStatusDisplay - State changed:", recordingState)
		setIsRecording(
			recordingState === "RECORDING" || recordingState === "RECORDING_STARTED"
		)
	}, [recordingState])

	if (!isRecording) return null

	return (
		<div className="absolute right-4 top-4 z-40 rounded-lg bg-red-600 px-3 py-2 text-white shadow-lg">
			<div className="flex items-center space-x-2">
				<div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
				<span className="text-sm font-medium">Recording in progress...</span>
			</div>
		</div>
	)
}

// Main meeting component
function VideoMeetingRoomInner({
	roomId,
	meetingId,
	token,
	participantName,
	role,
	meetingTitle,
	onLeave
}: VideoMeetingRoomProps) {
	const { participants, localParticipant } = useMeeting()

	// Convert participants Map to array for rendering
	const participantsArray = Array.from(participants.values())

	return (
		<div className="relative h-full bg-gray-900">
			{/* Recording Indicator */}
			<RecordingIndicator />

			{/* Recording Status Display */}
			<RecordingStatusDisplay />

			{/* Participants Grid */}
			<div className="grid h-full grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{/* Local participant */}
				{localParticipant && (
					<ParticipantVideo participantId={localParticipant.id} />
				)}

				{/* Remote participants */}
				{participantsArray
					.filter((participant) => !participant.local)
					.map((participant) => (
						<ParticipantVideo
							key={participant.id}
							participantId={participant.id}
						/>
					))}
			</div>

			{/* Meeting Controls */}
			<MeetingControls onLeave={onLeave} />
		</div>
	)
}

// Client-only wrapper component
export default function VideoMeetingRoom(props: VideoMeetingRoomProps) {
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	if (!isClient) {
		return (
			<div className="flex h-full items-center justify-center bg-gray-900">
				<div className="text-center text-white">
					<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
					<p>Loading video meeting...</p>
				</div>
			</div>
		)
	}

	return (
		<MeetingProvider
			config={{
				name: props.participantName,
				meetingId: props.roomId,
				micEnabled: true,
				webcamEnabled: true,
				participantId: props.participantName,
				debugMode: false
			}}
			token={props.token}
			joinWithoutUserInteraction={true}
		>
			<VideoMeetingRoomInner {...props} />
		</MeetingProvider>
	)
}
