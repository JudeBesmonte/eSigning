"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

// Dynamically import the VideoMeetingRoom component with no SSR
const VideoMeetingRoom = dynamic(() => import("./video-meeting-room"), {
	ssr: false,
	loading: () => (
		<div className="flex h-screen items-center justify-center">
			<div className="text-center">
				<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
				<p>Loading video meeting...</p>
			</div>
		</div>
	)
})

interface ClientOnlyVideoRoomProps {
	roomId: string
	meetingId: string
	token: string
	participantName: string
	role: "host" | "participant"
	meetingTitle: string
	onLeave: () => void
}

export default function ClientOnlyVideoRoom(props: ClientOnlyVideoRoomProps) {
	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	if (!isClient) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center">
					<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
					<p>Initializing video meeting...</p>
				</div>
			</div>
		)
	}

	return <VideoMeetingRoom {...props} />
}
