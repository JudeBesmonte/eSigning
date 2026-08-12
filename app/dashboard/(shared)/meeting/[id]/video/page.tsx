import { redirect } from "next/navigation"

import { auth } from "@/services/next-auth"
import { db } from "@/services/prisma/db"

import VideoMeetingPage from "@/features/meetings/components/video-meeting-page"

interface VideoMeetingPageProps {
	params: Promise<{ id: string }>
}

export default async function VideoMeetingPageRoute({
	params
}: VideoMeetingPageProps) {
	const { id: meetingId } = await params
	const session = await auth()

	if (!session?.user) {
		redirect("/auth/signin")
	}

	// Get meeting details server-side
	const meeting = await db.meeting.findFirst({
		where: {
			id: meetingId,
			OR: [
				{ createdById: session.user.id },
				{ participants: { some: { userId: session.user.id } } }
			]
		},
		include: {
			participants: {
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true,
							role: true
						}
					}
				}
			},
			createdBy: {
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					role: true
				}
			}
		}
	})

	if (!meeting) {
		redirect("/dashboard/scheduling?error=meeting-not-found")
	}

	if (!meeting.roomId) {
		redirect("/dashboard/scheduling?error=no-video-room")
	}

	// Check if user is a participant
	const isParticipant = meeting.participants.some(
		(p: { userId: string }) => p.userId === session.user.id
	)
	const isCreator = meeting.createdById === session.user.id

	if (!isParticipant && !isCreator) {
		redirect("/dashboard/scheduling?error=access-denied")
	}

	// Determine user's role in the meeting
	const userRole = isCreator ? "host" : "participant"
	const participantName = session.user.name ?? session.user.email ?? "Anonymous"

	return (
		<VideoMeetingPage
			meeting={meeting}
			userRole={userRole}
			participantName={participantName}
			userId={session.user.id}
		/>
	)
}
