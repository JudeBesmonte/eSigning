import { redirect } from "next/navigation"

import { auth } from "@/services/next-auth"
import { db } from "@/services/prisma/db"

import MeetingPage from "@/features/meetings/components/meeting-page"

interface MeetingPageProps {
	params: Promise<{ id: string }>
}

export default async function MeetingPageRoute({ params }: MeetingPageProps) {
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

	return <MeetingPage meeting={meeting} userId={session.user.id} />
}
