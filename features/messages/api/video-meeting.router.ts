import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"
import {
	createRoom,
	generateRoomToken,
	getRoomDetails
} from "@/services/video-sdk"

const createRoomInput = z.object({
	meetingId: z.string(),
	roomName: z.string()
})

const getRoomDetailsInput = z.object({
	roomId: z.string()
})

const generateTokenInput = z.object({
	roomId: z.string(),
	participantName: z.string(),
	role: z.enum(["host", "participant"])
})

const getMeetingParticipantsInput = z.object({
	meetingId: z.string()
})

const updateParticipantStatusInput = z.object({
	meetingId: z.string(),
	participantId: z.string(),
	status: z.enum(["JOINED", "LEFT", "PENDING"])
})

const getMeetingStatsInput = z.object({
	meetingId: z.string()
})

const endMeetingInput = z.object({
	meetingId: z.string()
})

const getParticipantDetailsInput = z.object({
	meetingId: z.string()
})

export const videoMeetingRouter = createTRPCRouter({
	createRoom: protectedProcedure
		.input(createRoomInput)
		.mutation(async ({ input, ctx }) => {
			const { meetingId, roomName } = input

			try {
				// Create room in Video SDK
				const room = await createRoom(roomName)

				// Update meeting with room details
				await ctx.db.meeting.update({
					where: { id: meetingId },
					data: {
						roomId: room.roomId,
						status: "ONGOING"
					}
				})

				return { success: true, roomId: room.roomId }
			} catch (error) {
				console.error("Error creating room:", error)
				throw new Error("Failed to create room")
			}
		}),

	getRoomDetails: protectedProcedure
		.input(getRoomDetailsInput)
		.query(async ({ input }) => {
			const { roomId } = input

			try {
				const roomDetails = await getRoomDetails(roomId)
				return roomDetails
			} catch (error) {
				console.error("Error getting room details:", error)
				throw new Error("Failed to get room details")
			}
		}),

	generateToken: protectedProcedure
		.input(generateTokenInput)
		.mutation(async ({ input }) => {
			const { roomId, participantName, role } = input

			try {
				const token = await generateRoomToken(roomId, participantName, role)
				return { token }
			} catch (error) {
				console.error("Error generating token:", error)
				throw new Error("Failed to generate token")
			}
		}),

	getMeetingParticipants: protectedProcedure
		.input(getMeetingParticipantsInput)
		.query(async ({ input, ctx }) => {
			const { meetingId } = input

			const meeting = await ctx.db.meeting.findUnique({
				where: { id: meetingId },
				include: { participants: true }
			})

			if (!meeting) {
				throw new Error("Meeting not found")
			}

			return meeting.participants
		}),

	updateParticipantStatus: protectedProcedure
		.input(updateParticipantStatusInput)
		.mutation(async ({ input, ctx }) => {
			const { meetingId, participantId, status } = input

			// Check if participant exists and belongs to the meeting
			const participant = await ctx.db.meetingParticipant.findFirst({
				where: {
					id: participantId,
					meetingId
				},
				include: {
					meeting: true
				}
			})

			// Authorize: allow meeting creator to update; if participant not found, check meeting creator
			let isCreator = false
			if (!participant) {
				const meeting = await ctx.db.meeting.findUnique({
					where: { id: meetingId },
					select: { createdById: true }
				})
				isCreator = meeting?.createdById === ctx.session.user.id
			} else {
				isCreator = participant.meeting.createdById === ctx.session.user.id
			}

			if (!participant && !isCreator) {
				throw new Error("Unauthorized to update participant status")
			}

			// Update participant status
			await ctx.db.meetingParticipant.update({
				where: { id: participantId },
				data: {
					status
				}
			})

			return { success: true }
		}),

	getMeetingStats: protectedProcedure
		.input(getMeetingStatsInput)
		.query(async ({ input, ctx }) => {
			const { meetingId } = input

			const meeting = await ctx.db.meeting.findUnique({
				where: { id: meetingId },
				include: { participants: true }
			})

			if (!meeting) {
				throw new Error("Meeting not found")
			}

			const totalParticipants = meeting.participants.length
			const joinedParticipants = meeting.participants.filter(
				(p: { status: string }) => p.status === "JOINED"
			).length
			const leftParticipants = meeting.participants.filter(
				(p: { status: string }) => p.status === "LEFT"
			).length
			const pendingParticipants = meeting.participants.filter(
				(p: { status: string }) => p.status === "PENDING"
			).length

			return {
				totalParticipants,
				joinedParticipants,
				leftParticipants,
				pendingParticipants,
				meetingStatus: meeting.status
			}
		}),

	endMeeting: protectedProcedure
		.input(endMeetingInput)
		.mutation(async ({ input, ctx }) => {
			const { meetingId } = input

			// Check if user is the meeting creator
			const meeting = await ctx.db.meeting.findUnique({
				where: { id: meetingId }
			})

			if (!meeting || meeting.createdById !== ctx.session.user.id) {
				throw new Error("Unauthorized to end meeting")
			}

			// Update meeting status
			await ctx.db.meeting.update({
				where: { id: meetingId },
				data: {
					status: "COMPLETED",
					endedAt: new Date()
				}
			})

			return { success: true }
		}),

	getParticipantDetails: protectedProcedure
		.input(getParticipantDetailsInput)
		.query(async ({ input, ctx }) => {
			const { meetingId } = input

			const meeting = await ctx.db.meeting.findUnique({
				where: { id: meetingId },
				include: { participants: { include: { user: true } } }
			})

			if (!meeting) {
				throw new Error("Meeting not found")
			}

			const participant = meeting.participants[0]

			return {
				participantId: participant?.id,
				participantName: participant?.user?.name ?? null,
				participantEmail: participant?.user?.email ?? null,
				participantRole: participant?.role,
				participantStatus: participant?.status
			}
		})
})
