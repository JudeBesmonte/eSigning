"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
	ArrowLeft,
	Calendar,
	Camera,
	CheckCircle,
	Clock,
	MapPin,
	Mic,
	Phone,
	User,
	UserCheck,
	Users,
	Video,
	XCircle
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"

import { trpc } from "@/services/trpc/client"

import { CameraPreview } from "@/features/meetings/components/camera-preview"
import VideoMeetingModal from "@/features/meetings/components/video-meeting-modal"

interface MeetingPageProps {
	meeting: {
		id: string
		title: string
		type: string
		status: string
		date: Date
		duration: number
		location?: string | null
		description?: string | null
		roomId?: string | null
		createdBy: {
			id: string
			name: string | null
			email: string | null
			image: string | null
			role: string
		}
		participants: Array<{
			id: string
			role: string
			status: string
			user: {
				id: string
				name: string | null
				email: string | null
				image: string | null
				role: string
			}
		}>
	}
	userId: string
}

export default function MeetingPage({ meeting, userId }: MeetingPageProps) {
	const router = useRouter()
	const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
	const [roomToken, setRoomToken] = useState<string | null>(null)
	const [participantName, setParticipantName] = useState<string>("")
	const [role, setRole] = useState<"host" | "participant">("participant")

	// Get room token mutation
	const getRoomTokenMutation = trpc.meetings.getRoomToken.useMutation({
		onSuccess: (data) => {
			setRoomToken(data.token)
			setParticipantName(data.participantName)
			setRole(data.role as "host" | "participant")
			setIsVideoModalOpen(true)
			toast.success("Joining meeting...")
		},
		onError: (error) => {
			toast.error("Failed to join meeting: " + error.message)
		}
	})

	// Start meeting mutation
	const startMeetingMutation = trpc.meetings.startMeeting.useMutation({
		onSuccess: () => {
			// status updated
		},
		onError: (error) => {
			console.error("❌ Error updating meeting status:", error)
		}
	})

	// Join meeting mutation
	const joinMeetingMutation = trpc.meetings.joinMeeting.useMutation({
		onSuccess: () => {
			// participant joined
		},
		onError: (error) => {
			console.error("❌ Error joining meeting:", error)
		}
	})

	const handleJoinMeeting = () => {
		if (meeting.type !== "VIDEO") {
			toast.error(
				"This meeting is not a video meeting. Only VIDEO type meetings support video calls."
			)
			return
		}

		if (!meeting?.roomId) {
			toast.error(
				"This meeting doesn't have a video room. Please contact support."
			)
			return
		}

		// Only host can start the meeting
		if (meeting.createdBy.id === userId) {
			startMeetingMutation.mutate({ meetingId: meeting.id })
		}

		// Mark participant as joined
		joinMeetingMutation.mutate({ meetingId: meeting.id })

		getRoomTokenMutation.mutate({ meetingId: meeting.id })
	}

	const handleCloseVideoModal = () => {
		setIsVideoModalOpen(false)
		setRoomToken(null)
	}

	const handleGoBack = () => {
		router.push("/dashboard/scheduling")
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto max-w-6xl p-6">
				{/* Header */}
				<div className="mb-8">
					<Button variant="outline" onClick={handleGoBack} className="mb-6">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Meetings
					</Button>

					{/* Meeting Header */}
					<div className="mb-8 flex items-start gap-4">
						<div className="rounded-lg bg-muted p-3">
							<Calendar className="h-6 w-6 text-muted-foreground" />
						</div>
						<div className="flex-1">
							<h1 className="mb-3 text-3xl font-bold">{meeting.title}</h1>
							<div className="flex items-center gap-3">
								<Badge className={getStatusColor(meeting.status)}>
									{meeting.status}
								</Badge>
								<Badge variant="outline">
									{getTypeIcon(meeting.type)} {meeting.type}
								</Badge>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="space-y-8">
					{/* Video Join Section - Prominent Position */}
					{meeting.type === "VIDEO" && meeting.roomId && (
						<Card className="mx-auto max-w-2xl">
							<CardHeader>
								<CardTitle className="flex items-center justify-center gap-2 text-center">
									<Video className="h-5 w-5 text-muted-foreground" />
									Ready to join?
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="text-center">
									<p className="mb-6 text-sm text-muted-foreground">
										Test your camera and microphone before joining the meeting
										to ensure everything works properly.
									</p>

									{/* Camera Preview */}
									<div className="relative mb-6">
										<div className="rounded-lg bg-muted p-4">
											<CameraPreview />
										</div>

										{/* Camera/Mic Status Indicators */}
										<div className="absolute right-4 top-4 flex space-x-2">
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
												<Mic className="h-4 w-4 text-white" />
											</div>
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
												<Camera className="h-4 w-4 text-white" />
											</div>
										</div>
									</div>

									<div className="space-y-4">
										<p className="text-sm text-muted-foreground">
											Click the button below to join the video meeting
										</p>
										<Button
											onClick={handleJoinMeeting}
											disabled={getRoomTokenMutation.isPending}
											size="lg"
											className="w-full"
										>
											<Video className="mr-2 h-5 w-5" />
											{getRoomTokenMutation.isPending
												? "Joining..."
												: "Join Meeting"}
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{meeting.type !== "VIDEO" && (
						<Card className="mx-auto max-w-2xl">
							<CardHeader>
								<CardTitle className="flex items-center justify-center gap-2 text-center">
									<Calendar className="h-5 w-5 text-muted-foreground" />
									Meeting Type
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-center">
									<p className="text-muted-foreground">
										This is a {meeting.type.toLowerCase()} meeting. No video
										call is available.
									</p>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Meeting Details Grid */}
					<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
						{/* Meeting Information Card */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Calendar className="h-5 w-5 text-muted-foreground" />
									Meeting Information
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-4">
									<div className="flex items-center gap-3">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<span className="font-medium">
											{new Date(meeting.date).toLocaleDateString()}
										</span>
									</div>
									<div className="flex items-center gap-3">
										<Clock className="h-4 w-4 text-muted-foreground" />
										<span className="font-medium">
											{new Date(meeting.date).toLocaleTimeString()} (
											{meeting.duration} minutes)
										</span>
									</div>
									{meeting.location && (
										<div className="flex items-center gap-3">
											<MapPin className="h-4 w-4 text-muted-foreground" />
											<span className="font-medium">{meeting.location}</span>
										</div>
									)}
									<div className="flex items-center gap-3">
										<Users className="h-4 w-4 text-muted-foreground" />
										<span className="font-medium">
											{meeting.participants.length} participants
										</span>
									</div>
									<div className="flex items-center gap-3">
										<User className="h-4 w-4 text-muted-foreground" />
										<span className="font-medium">
											Created by:{" "}
											{meeting.createdBy.name ?? meeting.createdBy.email}
										</span>
									</div>
								</div>

								{/* Description */}
								{meeting.description && (
									<div className="border-t pt-6">
										<h3 className="mb-3 font-semibold">Description</h3>
										<p className="rounded-lg bg-muted p-4 text-muted-foreground">
											{meeting.description}
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Participants Card */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Users className="h-5 w-5 text-muted-foreground" />
									Participants ({meeting.participants.length})
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{meeting.participants.map((participant) => (
										<div
											key={participant.id}
											className="flex items-center justify-between rounded-lg bg-muted p-4"
										>
											<div>
												<p className="font-medium">
													{participant.user.name ?? participant.user.email}
												</p>
												<p className="text-sm capitalize text-muted-foreground">
													{participant.role}
												</p>
											</div>
											<Badge className={getRSVPStatusColor(participant.status)}>
												{getRSVPStatusIcon(participant.status)}
												{participant.status}
											</Badge>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>

			{/* Video Meeting Modal */}
			{isVideoModalOpen && roomToken && meeting.roomId && (
				<VideoMeetingModal
					isOpen={isVideoModalOpen}
					onClose={handleCloseVideoModal}
					roomId={meeting.roomId}
					token={roomToken}
					participantName={participantName}
					role={role}
					meetingTitle={meeting.title}
				/>
			)}
		</div>
	)
}

// Helper functions
function getStatusColor(status: string) {
	switch (status.toLowerCase()) {
		case "confirmed":
			return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
		case "pending":
			return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800"
		case "cancelled":
			return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800"
		case "completed":
			return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800"
		case "ongoing":
			return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800"
		default:
			return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
	}
}

function getTypeIcon(type: string) {
	switch (type.toLowerCase()) {
		case "video":
			return <Video className="h-4 w-4" />
		case "phone":
			return <Phone className="h-4 w-4" />
		case "in-person":
			return <MapPin className="h-4 w-4" />
		default:
			return <Calendar className="h-4 w-4" />
	}
}

function getRSVPStatusColor(status: string) {
	switch (status.toLowerCase()) {
		case "accepted":
			return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
		case "declined":
			return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800"
		case "pending":
			return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800"
		default:
			return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
	}
}

function getRSVPStatusIcon(status: string) {
	switch (status.toLowerCase()) {
		case "accepted":
			return <CheckCircle className="h-4 w-4" />
		case "declined":
			return <XCircle className="h-4 w-4" />
		case "pending":
			return <UserCheck className="h-4 w-4" />
		default:
			return <UserCheck className="h-4 w-4" />
	}
}
