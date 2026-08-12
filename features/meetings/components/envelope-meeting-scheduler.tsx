"use client"

import { useState } from "react"
// import { useFormContext } from "react-hook-form"
import { Calendar, Clock, Plus, Users, Video } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from "@/core/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/core/components/ui/dialog"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/core/components/ui/select"
import { Textarea } from "@/core/components/ui/textarea"

// import { Separator } from "@/core/components/ui/separator"

import { trpc } from "@/services/trpc/client"

import { ParticipantSelector } from "@/features/messages/components/participant-selector"

// import { type CreateEnvelopeSchema } from "@/features/envelopes/api/envelope.schema"

interface EnvelopeMeetingSchedulerProps {
	envelopeTitle?: string
	envelopeDescription?: string
}

interface MeetingDetails {
	title: string
	description: string
	date: string
	time: string
	duration: number
	type: "VIDEO" | "PHONE" | "IN_PERSON"
	notes: string
	document?: string
	participants: Array<{
		id: string
		name: string | null
		email: string | null
		image: string | null
		role: string
		organization: string | null
	}>
}

export function EnvelopeMeetingScheduler({
	envelopeTitle = "",
	envelopeDescription = ""
}: EnvelopeMeetingSchedulerProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [meetingDetails, setMeetingDetails] = useState<MeetingDetails>({
		title: envelopeTitle,
		description: envelopeDescription,
		date: "",
		time: "",
		duration: 60,
		type: "VIDEO",
		notes: "",
		participants: []
	})

	const { data: session } = useSession()

	// Get user's envelopes (both created by user and where user is recipient)
	const { data: userEnvelopes } = trpc.envelope.getMyEnvelopes.useQuery()
	const { data: recipientEnvelopes } = trpc.toSign.listEnvelopesToSign.useQuery(
		{
			userId: session?.user?.id ?? "",
			status: "PENDING",
			limit: 50,
			offset: 0
		}
	)

	// Combine and deduplicate envelopes
	const allEnvelopes = [
		...(userEnvelopes ?? []),
		...(recipientEnvelopes?.envelopes ?? [])
	].filter(
		(envelope, index, self) =>
			index === self.findIndex((e) => e.id === envelope.id)
	)

	// Meeting creation mutation
	const createMeetingMutation = trpc.meetings.createMeeting.useMutation({
		onSuccess: () => {
			toast.success("Meeting scheduled successfully!")
			setIsOpen(false)
			setMeetingDetails({
				title: envelopeTitle,
				description: envelopeDescription,
				date: "",
				time: "",
				duration: 60,
				type: "VIDEO",
				notes: "",
				participants: []
			})
		},
		onError: (error) => {
			toast.error("Failed to schedule meeting: " + error.message)
		}
	})

	const handleCreateMeeting = () => {
		if (!meetingDetails.title || !meetingDetails.date || !meetingDetails.time) {
			toast.error("Please fill in all required fields")
			return
		}

		if (meetingDetails.participants.length === 0) {
			toast.error("Please add at least one participant")
			return
		}

		// Create the meeting using the API
		createMeetingMutation.mutate({
			title: meetingDetails.title,
			description: meetingDetails.description || undefined,
			date: meetingDetails.date,
			time: meetingDetails.time,
			duration: meetingDetails.duration,
			type: meetingDetails.type,
			notes: meetingDetails.notes || undefined,
			participantIds: meetingDetails.participants.map((p) => p.id)
		})
	}

	const getTypeIcon = (type: string) => {
		switch (type.toLowerCase()) {
			case "video":
				return <Video className="h-4 w-4" />
			case "phone":
				return <Clock className="h-4 w-4" />
			case "in-person":
				return <Users className="h-4 w-4" />
			default:
				return <Calendar className="h-4 w-4" />
		}
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<Label className="text-base font-medium">
						Schedule Meeting (Optional)
					</Label>
					<div className="text-sm text-muted-foreground">
						Schedule a meeting to discuss this envelope with participants
					</div>
				</div>
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogTrigger asChild>
						<Button variant="outline" size="sm">
							<Plus className="mr-2 h-4 w-4" />
							Schedule Meeting
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm dark:bg-slate-800/95">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
								<div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-2">
									<Calendar className="h-5 w-5 text-white" />
								</div>
								Schedule New Session
							</DialogTitle>
							<DialogDescription className="text-slate-600 dark:text-slate-400">
								Create a new remote signing session with participants
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-6">
							{/* Basic Info Row */}
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label
										htmlFor="title"
										className="text-slate-700 dark:text-slate-300"
									>
										Session Title
									</Label>
									<Input
										id="title"
										placeholder="Enter session title"
										value={meetingDetails.title}
										onChange={(e) =>
											setMeetingDetails({
												...meetingDetails,
												title: e.target.value
											})
										}
										className="border-slate-200 bg-white/50 dark:border-slate-600 dark:bg-slate-700/50"
									/>
								</div>
								<div className="space-y-2">
									<Label
										htmlFor="document"
										className="text-slate-700 dark:text-slate-300"
									>
										Envelope
									</Label>
									<Select
										value={meetingDetails.document ?? ""}
										onValueChange={(value) =>
											setMeetingDetails({ ...meetingDetails, document: value })
										}
									>
										<SelectTrigger className="border-slate-200 bg-white/50 dark:border-slate-600 dark:bg-slate-700/50">
											<SelectValue placeholder="Select envelope to discuss" />
										</SelectTrigger>
										<SelectContent>
											{allEnvelopes.length > 0 ? (
												allEnvelopes.map((envelope) => (
													<SelectItem key={envelope.id} value={envelope.id}>
														{envelope.title}
													</SelectItem>
												))
											) : (
												<SelectItem value="" disabled>
													No envelopes available
												</SelectItem>
											)}
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Date & Time Row */}
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label
										htmlFor="date"
										className="text-slate-700 dark:text-slate-300"
									>
										Date
									</Label>
									<Input
										id="date"
										type="date"
										value={meetingDetails.date}
										onChange={(e) =>
											setMeetingDetails({
												...meetingDetails,
												date: e.target.value
											})
										}
										className="border-slate-200 bg-white/50 dark:border-slate-600 dark:bg-slate-700/50"
									/>
								</div>
								<div className="space-y-2">
									<Label
										htmlFor="time"
										className="text-slate-700 dark:text-slate-300"
									>
										Time
									</Label>
									<Select
										value={meetingDetails.time}
										onValueChange={(value) =>
											setMeetingDetails({ ...meetingDetails, time: value })
										}
									>
										<SelectTrigger className="border-slate-200 bg-white/50 dark:border-slate-600 dark:bg-slate-700/50">
											<SelectValue placeholder="Select time" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="09:00">09:00 AM</SelectItem>
											<SelectItem value="09:30">09:30 AM</SelectItem>
											<SelectItem value="10:00">10:00 AM</SelectItem>
											<SelectItem value="10:30">10:30 AM</SelectItem>
											<SelectItem value="11:00">11:00 AM</SelectItem>
											<SelectItem value="11:30">11:30 AM</SelectItem>
											<SelectItem value="12:00">12:00 PM</SelectItem>
											<SelectItem value="12:30">12:30 PM</SelectItem>
											<SelectItem value="13:00">01:00 PM</SelectItem>
											<SelectItem value="13:30">01:30 PM</SelectItem>
											<SelectItem value="14:00">02:00 PM</SelectItem>
											<SelectItem value="14:30">02:30 PM</SelectItem>
											<SelectItem value="15:00">03:00 PM</SelectItem>
											<SelectItem value="15:30">03:30 PM</SelectItem>
											<SelectItem value="16:00">04:00 PM</SelectItem>
											<SelectItem value="16:30">04:30 PM</SelectItem>
											<SelectItem value="17:00">05:00 PM</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Participants & Notes Row */}
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<ParticipantSelector
										selectedParticipants={meetingDetails.participants}
										onParticipantsChange={(participants) =>
											setMeetingDetails({ ...meetingDetails, participants })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label
										htmlFor="notes"
										className="text-slate-700 dark:text-slate-300"
									>
										Session Notes
									</Label>
									<Textarea
										id="notes"
										placeholder="Add any additional notes or instructions"
										value={meetingDetails.notes}
										onChange={(e) =>
											setMeetingDetails({
												...meetingDetails,
												notes: e.target.value
											})
										}
										rows={2}
										className="border-slate-200 bg-white/50 dark:border-slate-600 dark:bg-slate-700/50"
									/>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex justify-center gap-3 pt-4">
								<Button
									onClick={handleCreateMeeting}
									className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 text-white shadow-lg hover:from-blue-700 hover:to-purple-700"
									disabled={createMeetingMutation.isPending}
								>
									<Calendar className="mr-2 h-4 w-4" />
									{createMeetingMutation.isPending
										? "Creating..."
										: "Schedule Session"}
								</Button>
								<Button
									variant="outline"
									onClick={() => setIsOpen(false)}
									className="border-slate-200 text-slate-700 dark:border-slate-600 dark:text-slate-300"
								>
									Cancel
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Meeting Preview Card */}
			{meetingDetails.title && meetingDetails.date && meetingDetails.time && (
				<Card className="border shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-sm font-medium">
							<Calendar className="h-4 w-4" />
							Meeting Preview
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">{meetingDetails.title}</p>
								<p className="text-sm text-muted-foreground">
									{new Date(
										`${meetingDetails.date}T${meetingDetails.time}`
									).toLocaleDateString()}{" "}
									at {meetingDetails.time}
								</p>
							</div>
							<Badge variant="outline" className="border-muted-foreground">
								{getTypeIcon(meetingDetails.type)} {meetingDetails.type}
							</Badge>
						</div>

						{meetingDetails.participants.length > 0 && (
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm text-muted-foreground">
									{meetingDetails.participants.length} participant
									{meetingDetails.participants.length > 1 ? "s" : ""}
								</span>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	)
}
