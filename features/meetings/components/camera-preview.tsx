"use client"

import { useEffect, useRef, useState } from "react"
import { Mic, MicOff, Users, Video, VideoOff } from "lucide-react"

import { VideoButton } from "./ui/video-button"

export function CameraPreview({ onReady }: { onReady?: () => void }) {
	const [localStream, setLocalStream] = useState<MediaStream | null>(null)
	const [isCameraOn, setIsCameraOn] = useState(true)
	const [isMicOn, setIsMicOn] = useState(true)
	const videoRef = useRef<HTMLVideoElement>(null)

	useEffect(() => {
		const startCamera = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: true,
					audio: true
				})
				setLocalStream(stream)
				if (videoRef.current) {
					videoRef.current.srcObject = stream
				}
				onReady?.()
			} catch (error) {
				console.error("Failed to access camera:", error)
			}
		}

		void startCamera()

		return () => {
			if (localStream) {
				localStream.getTracks().forEach((track) => track.stop())
			}
		}
	}, [])

	const toggleCamera = () => {
		if (localStream) {
			const videoTrack = localStream.getVideoTracks()[0]
			if (videoTrack) {
				videoTrack.enabled = !videoTrack.enabled
				setIsCameraOn(videoTrack.enabled)
			}
		}
	}

	const toggleMic = () => {
		if (localStream) {
			const audioTrack = localStream.getAudioTracks()[0]
			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled
				setIsMicOn(audioTrack.enabled)
			}
		}
	}

	return (
		<div className="text-center">
			<p className="mb-4 text-gray-500">
				Test your camera and microphone before joining the meeting
			</p>
			<div className="relative mx-auto mb-4 max-w-md overflow-hidden rounded-lg bg-gray-800">
				{isCameraOn && localStream ? (
					<video
						ref={videoRef}
						autoPlay
						playsInline
						muted
						className="h-64 w-full object-cover"
					/>
				) : (
					<div className="flex h-64 w-full items-center justify-center bg-gray-700">
						<div className="text-center text-white">
							<div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gray-600">
								<Users className="h-8 w-8" />
							</div>
							<p className="text-sm">Camera Off</p>
						</div>
					</div>
				)}

				<div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 transform space-x-2">
					<VideoButton
						variant={isMicOn ? "default" : "destructive"}
						onClick={toggleMic}
						icon={isMicOn ? Mic : MicOff}
					/>
					<VideoButton
						variant={isCameraOn ? "default" : "destructive"}
						onClick={toggleCamera}
						icon={isCameraOn ? Video : VideoOff}
					/>
				</div>
			</div>
		</div>
	)
}
