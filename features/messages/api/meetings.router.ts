import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"
import { createRoom } from "@/services/video-sdk"

export const meetingsRouter = createTRPCRouter({
	// Get a specific meeting by ID
	getMeetingById: protectedProcedure
		.input(
			z.object({
				meetingId: z.string()
			})
		)
		.query(async ({ input, ctx }) => {
			const { meetingId } = input
			const userId = ctx.session.user.id

			const meeting = await ctx.db.meeting.findFirst({
				where: {
					id: meetingId,
					OR: [{ createdById: userId }, { participants: { some: { userId } } }]
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
									role: true,
									organization: true
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
							role: true,
							organization: true
						}
					}
				}
			})

			if (!meeting) {
				throw new Error("Meeting not found or access denied")
			}

			return meeting
		}),

	// Start a meeting (mark as ongoing)
	startMeeting: protectedProcedure
		.input(
			z.object({
				meetingId: z.string()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { meetingId } = input
			const userId = ctx.session.user.id

			try {
				// Check if user is the creator of the meeting
				const meeting = await ctx.db.meeting.findFirst({
					where: {
						id: meetingId,
						createdById: userId
					}
				})

				if (!meeting) {
					throw new Error("Only the meeting creator can start the meeting")
				}

				// Update meeting status to ongoing
				const updatedMeeting = await ctx.db.meeting.update({
					where: { id: meetingId },
					data: {
						status: "ONGOING",
						startedAt: new Date()
					},
					include: {
						participants: {
							include: {
								user: {
									select: {
										id: true,
										name: true,
										email: true,
										image: true
									}
								}
							}
						},
						createdBy: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true
							}
						}
					}
				})

				console.log("✅ Meeting started:", meetingId)
				return updatedMeeting
			} catch (error) {
				console.error("❌ Error starting meeting:", error)
				throw new Error("Failed to start meeting")
			}
		}),

	// End a meeting (mark as completed)
	endMeeting: protectedProcedure
		.input(
			z.object({
				meetingId: z.string()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { meetingId } = input
			const userId = ctx.session.user.id

			try {
				// Check if user is the creator of the meeting
				const meeting = await ctx.db.meeting.findFirst({
					where: {
						id: meetingId,
						createdById: userId
					}
				})

				if (!meeting) {
					throw new Error("Only the meeting creator can end the meeting")
				}

				// Update meeting status to completed
				const updatedMeeting = await ctx.db.meeting.update({
					where: { id: meetingId },
					data: {
						status: "COMPLETED",
						endedAt: new Date()
					},
					include: {
						participants: {
							include: {
								user: {
									select: {
										id: true,
										name: true,
										email: true,
										image: true
									}
								}
							}
						},
						createdBy: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true
							}
						}
					}
				})

				console.log("✅ Meeting ended:", meetingId)
				return updatedMeeting
			} catch (error) {
				console.error("❌ Error ending meeting:", error)
				throw new Error("Failed to end meeting")
			}
		}),

	// Join a meeting (mark participant as joined)
	joinMeeting: protectedProcedure
		.input(
			z.object({
				meetingId: z.string()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { meetingId } = input
			const userId = ctx.session.user.id

			try {
				// Check if user is a participant in this meeting
				const participant = await ctx.db.meetingParticipant.findFirst({
					where: {
						meetingId,
						userId
					}
				})

				if (!participant) {
					throw new Error("You are not a participant in this meeting")
				}

				// Update participant status to joined
				const updatedParticipant = await ctx.db.meetingParticipant.update({
					where: { id: participant.id },
					data: {
						status: "JOINED",
						joinedAt: new Date()
					},
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true
							}
						}
					}
				})

				console.log("✅ Participant joined meeting:", meetingId, userId)
				return updatedParticipant
			} catch (error) {
				console.error("❌ Error joining meeting:", error)
				throw new Error("Failed to join meeting")
			}
		}),

	// Leave a meeting (mark participant as left)
	leaveMeeting: protectedProcedure
		.input(
			z.object({
				meetingId: z.string()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { meetingId } = input
			const userId = ctx.session.user.id

			try {
				// Check if user is a participant in this meeting
				const participant = await ctx.db.meetingParticipant.findFirst({
					where: {
						meetingId,
						userId
					}
				})

				if (!participant) {
					throw new Error("You are not a participant in this meeting")
				}

				// Update participant status to left
				const updatedParticipant = await ctx.db.meetingParticipant.update({
					where: { id: participant.id },
					data: {
						status: "LEFT",
						leftAt: new Date()
					},
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true
							}
						}
					}
				})

				console.log("✅ Participant left meeting:", meetingId, userId)
				return updatedParticipant
			} catch (error) {
				console.error("❌ Error leaving meeting:", error)
				throw new Error("Failed to leave meeting")
			}
		}),

	// Get ongoing meetings for a user
	getOngoingMeetings: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id

		try {
			const ongoingMeetings = await ctx.db.meeting.findMany({
				where: {
					status: "ONGOING",
					OR: [{ createdById: userId }, { participants: { some: { userId } } }]
				},
				include: {
					participants: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									email: true,
									image: true
								}
							}
						}
					},
					createdBy: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true
						}
					}
				},
				orderBy: {
					startedAt: "desc"
				}
			})

			console.log("✅ Retrieved ongoing meetings:", ongoingMeetings.length)
			return ongoingMeetings
		} catch (error) {
			console.error("❌ Error getting ongoing meetings:", error)
			return []
		}
	}),

	// Create a new meeting
	createMeeting: protectedProcedure
		.input(
			z.object({
				title: z.string().min(1, "Title is required"),
				description: z.string().optional(),
				date: z.string(), // ISO date string
				time: z.string(), // Time string (HH:MM)
				duration: z.number().min(15).max(480), // Duration in minutes
				type: z.enum(["VIDEO", "PHONE", "IN_PERSON"]),
				document: z.string().optional(),
				notes: z.string().optional(),
				meetingUrl: z.string().optional(),
				location: z.string().optional(),
				participantIds: z.array(z.string())
			})
		)
		.mutation(async ({ input, ctx }) => {
			const {
				title,
				description,
				date,
				time,
				duration,
				type,
				document,
				notes,
				meetingUrl,
				location,
				participantIds
			} = input
			const userId = ctx.session.user.id

			try {
				// Combine date and time into a DateTime
				const dateTime = new Date(`${date}T${time}`)

				// Create Video SDK room for video meetings
				let roomId: string | null = null
				let roomName: string | null = null

				if (type === "VIDEO") {
					try {
						console.log("🔧 Creating Video SDK room...")
						const room = (await createRoom(
							`${title} - ${dateTime.toLocaleDateString()}`
						)) as { roomId: string; roomName: string }
						roomId = room.roomId
						roomName = room.roomName
						console.log("✅ Video SDK room created:", roomId)
					} catch (videoError) {
						console.warn("⚠️ Failed to create Video SDK room:", videoError)
						// Continue without video room - meeting will be created as non-video
						console.log("📝 Creating meeting without video room...")
					}
				}

				// Create the meeting
				const meeting = await ctx.db.meeting.create({
					data: {
						title,
						description,
						date: dateTime,
						duration,
						type,
						document,
						notes,
						meetingUrl,
						location,
						roomId,
						roomName,
						status: "PENDING", // Default status
						createdById: userId,
						participants: {
							create: [
								// Add creator as host
								{
									userId,
									role: "HOST",
									status: "ACCEPTED"
								},
								// Add other participants (excluding the creator to avoid duplicates)
								...participantIds
									.filter((participantId) => participantId !== userId)
									.map((participantId) => ({
										userId: participantId,
										role: "PARTICIPANT",
										status: "PENDING"
									}))
							]
						}
					},
					include: {
						participants: {
							include: {
								user: {
									select: {
										id: true,
										name: true,
										email: true,
										image: true
									}
								}
							}
						},
						createdBy: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true
							}
						}
					}
				})

				console.log("✅ Meeting created:", meeting.id)
				return meeting
			} catch (error) {
				console.error("❌ Error creating meeting:", error)
				const message = error instanceof Error ? error.message : "Unknown error"
				throw new Error(`Failed to create meeting: ${message}`)
			}
		}),

	// Get room token for joining a meeting
	getRoomToken: protectedProcedure
		.input(
			z.object({
				meetingId: z.string()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { meetingId } = input
			const userId = ctx.session.user.id
			const userRole = ctx.session.user.role

			try {
				// For admin users, allow access to any meeting
				// For other users, check if they have access to this meeting
				const whereCondition =
					userRole === "ADMIN"
						? { id: meetingId } // Admin can access any meeting
						: {
								id: meetingId,
								OR: [
									{ createdById: userId },
									{
										participants: {
											some: {
												userId
											}
										}
									}
								]
							}

				// Get meeting details
				const meeting = await ctx.db.meeting.findFirst({
					where: whereCondition,
					include: {
						participants: {
							where: { userId },
							include: {
								user: {
									select: {
										id: true,
										name: true,
										email: true
									}
								}
							}
						},
						createdBy: {
							select: {
								id: true,
								name: true,
								email: true
							}
						}
					}
				})

				if (!meeting) {
					throw new Error("Meeting not found or access denied")
				}

				if (!meeting.roomId) {
					throw new Error("This meeting doesn't have a video room")
				}

				// For admin users, if they're not a participant, create a temporary participant entry
				let participant = meeting.participants[0]
				if (!participant && userRole === "ADMIN") {
					// Admin can join any meeting as a participant
					participant = {
						user: {
							id: userId,
							name: ctx.session.user.name,
							email: ctx.session.user.email
						}
					} as (typeof meeting.participants)[0]
				}

				if (!participant) {
					throw new Error("You are not a participant in this meeting")
				}

				// Determine role
				const role = meeting.createdBy.id === userId ? "host" : "participant"
				const participantName =
					participant.user.name ?? participant.user.email ?? "Anonymous"

				// Type guard to ensure roomId is string
				if (!meeting.roomId) {
					throw new Error("Invalid room ID")
				}
				const roomId = meeting.roomId

				// Generate room token
				const { generateRoomToken } = await import("@/services/video-sdk")
				const token = await generateRoomToken(roomId, participantName, role)

				return {
					roomId,
					roomName: meeting.roomName ?? "",
					token,
					participantName,
					role
				}
			} catch (error) {
				console.error("❌ Error getting room token:", error)
				// Log the actual error details
				if (error instanceof Error) {
					console.error("❌ Error details:", error.message)
					console.error("❌ Error stack:", error.stack)
				}
				throw new Error(
					`Failed to get room token: ${error instanceof Error ? error.message : "Unknown error"}`
				)
			}
		}),

	// Get user's meetings (created and participating)
	getUserMeetings: protectedProcedure.query(async ({ ctx }) => {
		const userId = ctx.session.user.id
		const userRole = ctx.session.user.role

		try {
			// For admin users, get ALL meetings in the system
			// For other users, get meetings where they are creator or participant
			const whereCondition =
				userRole === "ADMIN"
					? {} // No filter - get all meetings
					: {
							OR: [
								{ createdById: userId },
								{
									participants: {
										some: {
											userId
										}
									}
								}
							]
						}

			const meetings = await ctx.db.meeting.findMany({
				where: whereCondition,
				include: {
					participants: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									email: true,
									image: true
								}
							}
						}
					},
					createdBy: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true
						}
					}
				},
				orderBy: {
					date: "asc"
				}
			})

			console.log(
				`✅ Retrieved meetings for ${userRole} user:`,
				meetings.length
			)
			return meetings
		} catch (error) {
			console.error("❌ Error getting meetings:", error)
			return []
		}
	}),

	// RSVP to a meeting (accept/decline)
	rsvpToMeeting: protectedProcedure
		.input(
			z.object({
				meetingId: z.string(),
				status: z.enum(["ACCEPTED", "DECLINED"])
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { meetingId, status } = input
			const userId = ctx.session.user.id

			try {
				// Check if user is a participant in this meeting
				const participant = await ctx.db.meetingParticipant.findFirst({
					where: {
						meetingId,
						userId
					}
				})

				if (!participant) {
					throw new Error("You are not a participant in this meeting")
				}

				// Update the participant's status
				const updatedParticipant = await ctx.db.meetingParticipant.update({
					where: {
						id: participant.id
					},
					data: {
						status
					},
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true
							}
						},
						meeting: {
							include: {
								participants: {
									include: {
										user: {
											select: {
												id: true,
												name: true,
												email: true,
												image: true
											}
										}
									}
								},
								createdBy: {
									select: {
										id: true,
										name: true,
										email: true,
										image: true
									}
								}
							}
						}
					}
				})

				console.log("✅ RSVP updated:", meetingId, status)
				return updatedParticipant
			} catch (error) {
				console.error("❌ Error updating RSVP:", error)
				throw new Error("Failed to update RSVP")
			}
		}),

	// Get meeting details with participant statuses
	getMeetingDetails: protectedProcedure
		.input(
			z.object({
				meetingId: z.string()
			})
		)
		.query(async ({ input, ctx }) => {
			const { meetingId } = input
			const userId = ctx.session.user.id
			const userRole = ctx.session.user.role

			try {
				// For admin users, allow access to any meeting
				// For other users, check if they have access to this meeting
				const whereCondition =
					userRole === "ADMIN"
						? { id: meetingId } // Admin can access any meeting
						: {
								id: meetingId,
								OR: [
									{ createdById: userId },
									{
										participants: {
											some: {
												userId
											}
										}
									}
								]
							}

				const meeting = await ctx.db.meeting.findFirst({
					where: whereCondition,
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
					throw new Error("Meeting not found or access denied")
				}

				return meeting
			} catch (error) {
				console.error("❌ Error getting meeting details:", error)
				throw new Error("Failed to get meeting details")
			}
		}),

	// Update meeting status
	updateMeetingStatus: protectedProcedure
		.input(
			z.object({
				meetingId: z.string(),
				status: z.enum([
					"PENDING",
					"CONFIRMED",
					"CANCELLED",
					"COMPLETED",
					"ONGOING"
				])
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { meetingId, status } = input
			const userId = ctx.session.user.id

			try {
				// Check if user has permission to update this meeting
				const meeting = await ctx.db.meeting.findFirst({
					where: {
						id: meetingId,
						OR: [
							{ createdById: userId },
							{
								participants: {
									some: {
										userId
									}
								}
							}
						]
					}
				})

				if (!meeting) {
					throw new Error("Meeting not found or access denied")
				}

				const updatedMeeting = await ctx.db.meeting.update({
					where: { id: meetingId },
					data: { status },
					include: {
						participants: {
							include: {
								user: {
									select: {
										id: true,
										name: true,
										email: true,
										image: true
									}
								}
							}
						},
						createdBy: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true
							}
						}
					}
				})

				console.log("✅ Meeting status updated:", meetingId, status)
				return updatedMeeting
			} catch (error) {
				console.error("❌ Error updating meeting status:", error)
				throw new Error("Failed to update meeting status")
			}
		}),

	// Delete meeting
	deleteMeeting: protectedProcedure
		.input(
			z.object({
				meetingId: z.string()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { meetingId } = input
			const userId = ctx.session.user.id

			try {
				// Check if user is the creator of the meeting
				const meeting = await ctx.db.meeting.findFirst({
					where: {
						id: meetingId,
						createdById: userId
					}
				})

				if (!meeting) {
					throw new Error("Meeting not found or access denied")
				}

				await ctx.db.meeting.delete({
					where: { id: meetingId }
				})

				console.log("✅ Meeting deleted:", meetingId)
				return { success: true }
			} catch (error) {
				console.error("❌ Error deleting meeting:", error)
				throw new Error("Failed to delete meeting")
			}
		}),

	// Start recording for a meeting
	startRecording: protectedProcedure
		.input(
			z.object({
				meetingId: z.string()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { meetingId } = input
			const userId = ctx.session.user.id

			try {
				// Check if user is the creator of the meeting (only host can start recording)
				const meeting = await ctx.db.meeting.findFirst({
					where: {
						id: meetingId,
						createdById: userId
					}
				})

				if (!meeting) {
					throw new Error("Only the meeting host can start recording")
				}

				// Update meeting to mark recording as started
				const updatedMeeting = await ctx.db.meeting.update({
					where: { id: meetingId },
					data: {
						recordingStartedAt: new Date(),
						isRecording: true
					} as Parameters<typeof ctx.db.meeting.update>[0]["data"]
				})

				console.log("🔴 Recording started for meeting:", meetingId)
				return { success: true, recordingId: `rec_${meetingId}_${Date.now()}` }
			} catch (error) {
				console.error("❌ Error starting recording:", error)
				throw new Error("Failed to start recording")
			}
		}),

	// Stop recording for a meeting
	stopRecording: protectedProcedure
		.input(
			z.object({
				meetingId: z.string(),
				recordingUrl: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const { meetingId, recordingUrl } = input
			const userId = ctx.session.user.id

			try {
				// Check if user is the creator of the meeting (only host can stop recording)
				const meeting = await ctx.db.meeting.findFirst({
					where: {
						id: meetingId,
						createdById: userId
					}
				})

				if (!meeting) {
					throw new Error("Only the meeting host can stop recording")
				}

				// Update meeting to mark recording as stopped and save recording URL
				const updatedMeeting = await ctx.db.meeting.update({
					where: { id: meetingId },
					data: {
						recordingEndedAt: new Date(),
						isRecording: false,
						recordingUrl: recordingUrl ?? null
					} as Parameters<typeof ctx.db.meeting.update>[0]["data"]
				})

				console.log("🛑 Recording stopped for meeting:", meetingId)
				return { success: true, recordingUrl: recordingUrl ?? null }
			} catch (error) {
				console.error("❌ Error stopping recording:", error)
				throw new Error("Failed to stop recording")
			}
		}),

	// Get recording status for a meeting
	getRecordingStatus: protectedProcedure
		.input(
			z.object({
				meetingId: z.string()
			})
		)
		.query(async ({ input, ctx }) => {
			const { meetingId } = input
			const userId = ctx.session.user.id

			try {
				// Check if user has access to this meeting
				const meeting = await ctx.db.meeting.findFirst({
					where: {
						id: meetingId,
						OR: [
							{ createdById: userId },
							{ participants: { some: { userId } } }
						]
					},
					select: {
						id: true,
						startedAt: true,
						endedAt: true,
						createdById: true
					} as const
				})

				if (!meeting) {
					throw new Error("Meeting not found or access denied")
				}

				const meetingData = meeting as typeof meeting & {
					isRecording: boolean
					recordingStartedAt: Date | null
					recordingEndedAt: Date | null
					recordingUrl: string | null
				}

				return {
					isRecording: meetingData.isRecording ?? false,
					recordingStartedAt: meetingData.recordingStartedAt ?? null,
					recordingEndedAt: meetingData.recordingEndedAt ?? null,
					recordingUrl: meetingData.recordingUrl ?? null,
					canControlRecording: meetingData.createdById === userId
				}
			} catch (error) {
				console.error("❌ Error getting recording status:", error)
				throw new Error("Failed to get recording status")
			}
		})
})
