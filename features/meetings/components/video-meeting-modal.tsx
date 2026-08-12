"use client"

// import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"

// import { X } from "lucide-react"

// Dynamically import VideoSDK components to avoid SSR issues
const VideoSDKMeeting = dynamic(() => import("./video-sdk-meeting"), {
	ssr: false
})

interface VideoMeetingModalProps {
	isOpen: boolean
	onClose: () => void
	roomId: string
	token: string
	participantName: string
	role: "host" | "participant"
	meetingTitle: string
}

// Video meeting interface with real VideoSDK - Full screen Google Meet style
function MeetingInterface({
	roomId,
	token,
	participantName,
	role,
	onLeave
}: {
	roomId: string
	token: string
	participantName: string
	role: "host" | "participant"
	onLeave: () => void
}) {
	return (
		<VideoSDKMeeting
			roomId={roomId}
			token={token}
			participantName={participantName}
			role={role}
			onLeave={onLeave}
		/>
	)
}

export default function VideoMeetingModal({
	isOpen,
	onClose,
	roomId,
	token,
	participantName,
	role,
	meetingTitle: _meetingTitle
}: VideoMeetingModalProps) {
	if (!isOpen) return null

	// Full screen Google Meet style - no modal wrapper
	return (
		<div className="fixed inset-0 z-50 bg-gray-900">
			<MeetingInterface
				roomId={roomId}
				token={token}
				participantName={participantName}
				role={role}
				onLeave={onClose}
			/>
		</div>
	)
}
