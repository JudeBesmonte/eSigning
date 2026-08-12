"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, Calendar, Clock, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/core/components/ui/button"

import { trpc } from "@/services/trpc/client"

// Dynamically import VideoMeetingRoom with no SSR to avoid VideoSDK browser dependencies on server
const VideoMeetingRoom = dynamic(
	() => import("@/features/meetings/components/video-meeting-room-client"),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-full items-center justify-center bg-gray-900">
				<div className="text-center text-white">
					<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
					<p>Loading video meeting...</p>
				</div>
			</div>
		)
	}
)

interface VideoMeetingPageProps {
	meeting: {
		id: string
		title: string
		roomId: string | null
		duration: number
		date: Date
		participants: Array<{ userId: string }>
	}
	userRole: "host" | "participant"
	participantName: string
	userId: string
}

export default function VideoMeetingPage({
	meeting,
	userRole,
	participantName
}: VideoMeetingPageProps) {
	const router = useRouter()
	const [isInMeeting, setIsInMeeting] = useState(false)
	const [roomToken, setRoomToken] = useState<string | null>(null)
	const [role, setRole] = useState<"host" | "participant">(userRole)
	const [meetingTitle] = useState<string>(String(meeting.title ?? ""))

	// Get room token mutation
	const getRoomTokenMutation = trpc.meetings.getRoomToken.useMutation({
		onSuccess: (data) => {
			setRoomToken(data.token)
			setRole(data.role as "host" | "participant")
			setIsInMeeting(true)
			toast.success("Joining meeting...")
		},
		onError: (error) => {
			toast.error("Failed to join meeting: " + error.message)
		}
	})

	// Join meeting mutation
	const joinMeetingMutation = trpc.meetings.joinMeeting.useMutation({
		onSuccess: () => {
			// joined
		},
		onError: (error) => {
			console.error("❌ Failed to join meeting:", error)
		}
	})

	// Leave meeting mutation
	const leaveMeetingMutation = trpc.meetings.leaveMeeting.useMutation({
		onSuccess: () => {
			// left
		},
		onError: (error) => {
			console.error("❌ Failed to leave meeting:", error)
		}
	})

	// Auto-join meeting when component mounts
	useEffect(() => {
		if (meeting.roomId) {
			getRoomTokenMutation.mutate({
				meetingId: String(meeting.id)
			})
		}
	}, [meeting.roomId, meeting.id, getRoomTokenMutation])

	// Join meeting when we get the room token
	useEffect(() => {
		if (roomToken) {
			joinMeetingMutation.mutate({
				meetingId: String(meeting.id)
			})
		}
	}, [roomToken, meeting.id, joinMeetingMutation])

	const handleLeaveMeeting = () => {
		// Leave the meeting in the database
		leaveMeetingMutation.mutate({ meetingId: String(meeting.id) })

		setIsInMeeting(false)
		setRoomToken(null)
		router.push("/dashboard/scheduling")
	}

	if (!isInMeeting || !roomToken) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
					<p className="text-gray-600">Joining meeting...</p>
				</div>
			</div>
		)
	}

	// Ensure roomId is available
	if (!meeting.roomId) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="mb-4 text-red-600">⚠️</div>
					<p className="text-gray-600">Meeting room not available</p>
					<Button
						variant="outline"
						onClick={() => router.push("/dashboard/scheduling")}
						className="mt-4"
					>
						Back to Meetings
					</Button>
				</div>
			</div>
		)
	}

	// At this point, meeting.roomId is guaranteed to be a string
	const roomId = String(meeting.roomId)

	return (
		<div className="min-h-screen bg-gray-900">
			{/* Header */}
			<div className="border-b border-gray-700 bg-gray-800 px-6 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleLeaveMeeting}
							className="text-gray-300 hover:text-white"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Leave Meeting
						</Button>
						<div className="h-6 w-px bg-gray-600"></div>
						<div className="flex items-center space-x-4 text-gray-300">
							<div className="flex items-center space-x-2">
								<Users className="h-4 w-4" />
								<span className="text-sm">
									{meeting.participants?.length ?? 0} participants
								</span>
							</div>
							<div className="flex items-center space-x-2">
								<Clock className="h-4 w-4" />
								<span className="text-sm">
									{Number(meeting.duration)} minutes
								</span>
							</div>
							<div className="flex items-center space-x-2">
								<Calendar className="h-4 w-4" />
								<span className="text-sm">
									{new Date(meeting.date).toLocaleDateString()}
								</span>
							</div>
						</div>
					</div>
					<div className="font-medium text-white">
						{meetingTitle ?? "Meeting"}
					</div>
				</div>
			</div>

			{/* Video Meeting Room */}
			<div className="h-[calc(100vh-80px)]">
				<VideoMeetingRoom
					roomId={roomId}
					meetingId={meeting.id}
					token={roomToken}
					participantName={participantName}
					role={role}
					meetingTitle={meetingTitle}
					onLeave={handleLeaveMeeting}
				/>
			</div>
		</div>
	)
}
