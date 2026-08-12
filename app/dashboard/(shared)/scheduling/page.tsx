"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
// import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar"
import {
	Calendar,
	CalendarDays,
	CheckCircle,
	Clock,
	Clock4,
	Eye,
	FileText,
	MapPin,
	MoreVertical,
	Phone,
	Play,
	Plus,
	Search,
	Sparkles,
	Trash2,
	UserCheck,
	Users,
	UserX,
	Video,
	XCircle
} from "lucide-react"
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
	DialogTitle
} from "@/core/components/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/core/components/ui/dropdown-menu"
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

import { trpc } from "@/services/trpc/client"

import { ParticipantSelector } from "@/features/messages/components/participant-selector"

// Add proper TypeScript interfaces for the meeting data structure
interface UserProfile {
	id: string
	name: string | null
	email: string | null
	image: string | null
	role: string
	organization: string | null
}

interface MeetingParticipant {
	id: string
	meetingId: string
	userId: string
	role: string // Changed from union type to string to match Prisma
	status: string // Changed from union type to string to match Prisma
	user: UserProfile
}

interface Meeting {
	id: string
	title: string
	description: string | null
	date: Date // Changed from string to Date to match Prisma types
	duration: number
	type: string // Changed from union type to string to match Prisma
	status: string // Changed from union type to string to match Prisma
	document: string | null
	notes: string | null
	meetingUrl: string | null
	location: string | null
	roomId: string | null // Add roomId for video meetings
	createdAt: Date // Changed from string to Date
	updatedAt: Date // Changed from string to Date
	createdBy: UserProfile
	participants: MeetingParticipant[]
}

export default function SchedulingPage() {
	const router = useRouter()
	const { data: session } = useSession()
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState("all")
	const [typeFilter, setTypeFilter] = useState("all")
	const [sortBy, setSortBy] = useState("date")
	const [showMeetingModal, setShowMeetingModal] = useState(false)
	const [sessionDetails, setSessionDetails] = useState({
		title: "",
		document: "",
		date: "",
		time: "",
		participants: "",
		notes: ""
	})

	const [selectedParticipants, setSelectedParticipants] = useState<
		Array<{
			id: string
			name: string | null
			email: string | null
			image: string | null
			role: string
			organization: string | null
		}>
	>([])

	// Meeting creation mutation
	const createMeetingMutation = trpc.meetings.createMeeting.useMutation({
		onSuccess: () => {
			toast.success("Meeting scheduled successfully!")
			setShowMeetingModal(false)
			setSessionDetails({
				title: "",
				document: "",
				date: "",
				time: "",
				participants: "",
				notes: ""
			})
			setSelectedParticipants([])
			void refetch()
		},
		onError: (error) => {
			toast.error("Failed to schedule meeting: " + error.message)
		}
	})

	// Get user's meetings from API
	const { data: meetings, refetch } =
		trpc.meetings.getUserMeetings.useQuery() as {
			data: Meeting[] | undefined
			refetch: () => void
		}

	// Get ongoing meetings
	const { data: ongoingMeetings } =
		trpc.meetings.getOngoingMeetings.useQuery() as {
			data: Meeting[] | undefined
		}

	// Mutations
	const updateMeetingStatusMutation =
		trpc.meetings.updateMeetingStatus.useMutation({
			onSuccess: () => {
				toast.success("Meeting status updated successfully!")
				void refetch()
			},
			onError: (error) => {
				toast.error("Failed to update meeting status: " + error.message)
			}
		})

	const deleteMeetingMutation = trpc.meetings.deleteMeeting.useMutation({
		onSuccess: () => {
			toast.success("Meeting deleted successfully!")
			void refetch()
		},
		onError: (error) => {
			toast.error("Failed to delete meeting: " + error.message)
		}
	})

	const rsvpToMeetingMutation = trpc.meetings.rsvpToMeeting.useMutation({
		onSuccess: () => {
			toast.success("RSVP updated successfully!")
			void refetch()
		},
		onError: (error) => {
			toast.error("Failed to update RSVP: " + error.message)
		}
	})

	// Calculate meeting statistics
	const meetingStats = {
		total: meetings?.length ?? 0,
		upcoming:
			meetings?.filter(
				(m) => m.status === "PENDING" || m.status === "CONFIRMED"
			).length ?? 0,
		ongoing: ongoingMeetings?.length ?? 0,
		completed: meetings?.filter((m) => m.status === "COMPLETED").length ?? 0,
		video: meetings?.filter((m) => m.type === "VIDEO").length ?? 0,
		inPerson: meetings?.filter((m) => m.type === "IN_PERSON").length ?? 0,
		phone: meetings?.filter((m) => m.type === "PHONE").length ?? 0
	}

	// Filter and sort meetings
	const filteredMeetings =
		meetings
			?.filter((meeting) => {
				const matchesSearch =
					meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					(meeting.description
						?.toLowerCase()
						.includes(searchTerm.toLowerCase()) ??
						false) ||
					(meeting.createdBy.name
						?.toLowerCase()
						.includes(searchTerm.toLowerCase()) ??
						false)

				const matchesStatus =
					statusFilter === "all" ||
					meeting.status.toLowerCase() === statusFilter.toLowerCase()
				const matchesType =
					typeFilter === "all" ||
					meeting.type.toLowerCase() === typeFilter.toLowerCase()

				return matchesSearch && matchesStatus && matchesType
			})
			.sort((a, b) => {
				switch (sortBy) {
					case "date":
						return new Date(a.date).getTime() - new Date(b.date).getTime()
					case "title":
						return a.title.localeCompare(b.title)
					case "status":
						return a.status.localeCompare(b.status)
					case "type":
						return a.type.localeCompare(b.type)
					default:
						return 0
				}
			}) ?? []

	const handleJoinMeeting = (meeting: Meeting) => {
		if (meeting.type !== "VIDEO") {
			toast.error("This meeting is not a video meeting")
			return
		}

		if (!meeting.roomId) {
			toast.error("This meeting doesn't have a video room")
			return
		}

		router.push(`/dashboard/meeting/${meeting.id}`)
	}

	const handleStartMeeting = (meeting: Meeting) => {
		if (meeting.createdBy.id !== session?.user?.id) {
			toast.error("Only the meeting creator can start the meeting")
			return
		}

		updateMeetingStatusMutation.mutate({
			meetingId: meeting.id,
			status: "ONGOING"
		})
	}

	const handleEndMeeting = (meeting: Meeting) => {
		if (meeting.createdBy.id !== session?.user?.id) {
			toast.error("Only the meeting creator can end the meeting")
			return
		}

		updateMeetingStatusMutation.mutate({
			meetingId: meeting.id,
			status: "COMPLETED"
		})
	}

	const handleDeleteMeeting = (meeting: Meeting) => {
		if (meeting.createdBy.id !== session?.user?.id) {
			toast.error("Only the meeting creator can delete the meeting")
			return
		}

		if (
			confirm(
				"Are you sure you want to delete this meeting? This action cannot be undone."
			)
		) {
			deleteMeetingMutation.mutate({ meetingId: meeting.id })
		}
	}

	const handleRSVP = (meetingId: string, status: "ACCEPTED" | "DECLINED") => {
		rsvpToMeetingMutation.mutate({ meetingId, status })
	}

	const handleCreateSession = () => {
		if (!sessionDetails.title || !sessionDetails.date || !sessionDetails.time) {
			toast.error("Please fill in all required fields")
			return
		}

		// Create the meeting using the API
		createMeetingMutation.mutate({
			title: sessionDetails.title,
			description: sessionDetails.notes || undefined,
			date: sessionDetails.date,
			time: sessionDetails.time,
			duration: 60, // Default 60 minutes
			type: "VIDEO" as const, // Default to video
			document: sessionDetails.document || undefined,
			notes: sessionDetails.notes || undefined,
			participantIds: selectedParticipants.map((p) => p.id)
		})
	}

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case "confirmed":
				return "bg-emerald-500 text-white"
			case "pending":
				return "bg-amber-500 text-white"
			case "cancelled":
				return "bg-red-500 text-white"
			case "completed":
				return "bg-blue-500 text-white"
			case "ongoing":
				return "bg-purple-500 text-white"
			default:
				return "bg-gray-500 text-white"
		}
	}

	const getTypeIcon = (type: string) => {
		switch (type.toLowerCase()) {
			case "video":
				return <FileText className="h-4 w-4" />
			case "phone":
				return <Phone className="h-4 w-4" />
			case "in-person":
				return <MapPin className="h-4 w-4" />
			default:
				return <Calendar className="h-4 w-4" />
		}
	}

	const getRSVPStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case "accepted":
				return "bg-emerald-500 text-white"
			case "declined":
				return "bg-red-500 text-white"
			case "pending":
				return "bg-amber-500 text-white"
			default:
				return "bg-gray-500 text-white"
		}
	}

	const getRSVPStatusIcon = (status: string) => {
		switch (status.toLowerCase()) {
			case "accepted":
				return <CheckCircle className="h-4 w-4" />
			case "declined":
				return <XCircle className="h-4 w-4" />
			case "pending":
				return <UserCheck className="h-4 w-4" />
			default:
				return <UserX className="h-4 w-4" />
		}
	}

	const getCurrentUserRSVPStatus = (meeting: Meeting) => {
		const currentUserParticipant = meeting.participants.find(
			(p) => p.user.id === session?.user?.id
		)
		return currentUserParticipant?.status ?? "PENDING"
	}

	const isMeetingCreator = (meeting: Meeting) => {
		return meeting.createdBy.id === session?.user?.id
	}

	const isMeetingOngoing = (meeting: Meeting) => {
		return meeting.status === "ONGOING"
	}

	const isMeetingUpcoming = (meeting: Meeting) => {
		return meeting.status === "PENDING" || meeting.status === "CONFIRMED"
	}

	// Removed unused function

	return (
		<div className="min-h-screen bg-background" suppressHydrationWarning>
			<div className="container mx-auto max-w-7xl p-6">
				{/* Enhanced Header */}
				<div className="mb-8">
					<div className="mb-4 flex items-center gap-3">
						<div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-2">
							<Calendar className="h-6 w-6 text-white" />
						</div>
						<div>
							<h1 className="text-4xl font-bold">Meetings</h1>
							<p className="mt-1 text-muted-foreground">
								Schedule and manage your meetings with video conferencing
								capabilities
							</p>
						</div>
					</div>

					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Button
								onClick={() => setShowMeetingModal(true)}
								size="lg"
								suppressHydrationWarning
							>
								<Plus className="mr-2 h-5 w-5" />
								Create Meeting
							</Button>
							<div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex"></div>
						</div>
					</div>
				</div>

				{/* Enhanced Statistics Cards */}
				<div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					<Card className="border shadow-sm transition-all duration-200 hover:shadow-md">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Total Meetings
							</CardTitle>
							<div className="rounded-lg bg-muted p-2">
								<Calendar className="h-4 w-4 text-muted-foreground" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{meetingStats.total}</div>
							<p className="mt-1 text-xs text-muted-foreground">
								All time meetings
							</p>
						</CardContent>
					</Card>

					<Card className="border shadow-sm transition-all duration-200 hover:shadow-md">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Upcoming
							</CardTitle>
							<div className="rounded-lg bg-muted p-2">
								<CalendarDays className="h-4 w-4 text-muted-foreground" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{meetingStats.upcoming}</div>
							<p className="mt-1 text-xs text-muted-foreground">
								Scheduled meetings
							</p>
						</CardContent>
					</Card>

					<Card className="border shadow-sm transition-all duration-200 hover:shadow-md">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Ongoing
							</CardTitle>
							<div className="rounded-lg bg-muted p-2">
								<Clock4 className="h-4 w-4 text-muted-foreground" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{meetingStats.ongoing}</div>
							<p className="mt-1 text-xs text-muted-foreground">
								Active meetings
							</p>
						</CardContent>
					</Card>

					<Card className="border shadow-sm transition-all duration-200 hover:shadow-md">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Completed
							</CardTitle>
							<div className="rounded-lg bg-muted p-2">
								<CheckCircle className="h-4 w-4 text-muted-foreground" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{meetingStats.completed}</div>
							<p className="mt-1 text-xs text-muted-foreground">
								Finished meetings
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Enhanced Filters and Search */}
				<div className="mb-8 rounded-lg border p-6 shadow-sm">
					<div className="flex flex-col gap-4 md:flex-row">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search meetings..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
									suppressHydrationWarning
								/>
							</div>
						</div>

						<div className="flex gap-2">
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-32" suppressHydrationWarning>
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="confirmed">Confirmed</SelectItem>
									<SelectItem value="ongoing">Ongoing</SelectItem>
									<SelectItem value="completed">Completed</SelectItem>
									<SelectItem value="cancelled">Cancelled</SelectItem>
								</SelectContent>
							</Select>

							<Select value={typeFilter} onValueChange={setTypeFilter}>
								<SelectTrigger className="w-32" suppressHydrationWarning>
									<SelectValue placeholder="Type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Types</SelectItem>
									<SelectItem value="video">Video</SelectItem>
									<SelectItem value="phone">Phone</SelectItem>
									<SelectItem value="in-person">In Person</SelectItem>
								</SelectContent>
							</Select>

							<Select value={sortBy} onValueChange={setSortBy}>
								<SelectTrigger className="w-32" suppressHydrationWarning>
									<SelectValue placeholder="Sort by" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="date">Date</SelectItem>
									<SelectItem value="title">Title</SelectItem>
									<SelectItem value="status">Status</SelectItem>
									<SelectItem value="type">Type</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{/* Modern Meeting Cards */}
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{filteredMeetings.map((meeting) => (
						<Card
							key={meeting.id}
							className="group overflow-hidden rounded-xl border-0 bg-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:bg-gray-800"
						>
							<CardHeader className="pb-4">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<CardTitle className="line-clamp-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
											{meeting.title}
										</CardTitle>
										<div className="mt-3 flex items-center space-x-2">
											<Badge
												className={`${getStatusColor(meeting.status)} rounded-full border-0 px-2.5 py-1 text-xs font-medium`}
											>
												{meeting.status.toUpperCase()}
											</Badge>
											<Badge
												variant="outline"
												className="rounded-full border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
											>
												{getTypeIcon(meeting.type)} {meeting.type.toUpperCase()}
											</Badge>
										</div>
									</div>

									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
											>
												<MoreVertical className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() =>
													router.push(`/dashboard/meeting/${meeting.id}`)
												}
											>
												<Eye className="mr-2 h-4 w-4" />
												View Details
											</DropdownMenuItem>

											{isMeetingCreator(meeting) && (
												<>
													<DropdownMenuItem
														onClick={() => handleStartMeeting(meeting)}
													>
														<Play className="mr-2 h-4 w-4" />
														Start Meeting
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => handleEndMeeting(meeting)}
													>
														<Clock className="mr-2 h-4 w-4" />
														End Meeting
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => handleDeleteMeeting(meeting)}
													>
														<Trash2 className="mr-2 h-4 w-4" />
														Delete Meeting
													</DropdownMenuItem>
												</>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</CardHeader>

							<CardContent className="space-y-4">
								{/* Meeting Details */}
								<div className="space-y-3 text-sm">
									<div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
										<Calendar className="h-4 w-4" />
										<span>{meeting.date.toLocaleDateString()}</span>
									</div>
									<div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
										<Clock className="h-4 w-4" />
										<span>
											{meeting.date.toLocaleTimeString()} ({meeting.duration}{" "}
											min)
										</span>
									</div>
									{meeting.location && (
										<div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
											<MapPin className="h-4 w-4" />
											<span className="line-clamp-1">{meeting.location}</span>
										</div>
									)}
									<div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
										<Users className="h-4 w-4" />
										<span>{meeting.participants.length} participants</span>
									</div>
								</div>

								{/* Description */}
								{meeting.description && (
									<p className="line-clamp-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-400">
										{meeting.description}
									</p>
								)}

								{/* Current User RSVP Status */}
								{!isMeetingCreator(meeting) && (
									<div className="flex items-center space-x-2">
										<span className="text-sm text-gray-600 dark:text-gray-400">
											Your RSVP:
										</span>
										<Badge
											className={`${getRSVPStatusColor(getCurrentUserRSVPStatus(meeting))} rounded-full border-0 px-2.5 py-1 text-xs font-medium`}
										>
											{getRSVPStatusIcon(getCurrentUserRSVPStatus(meeting))}
											{getCurrentUserRSVPStatus(meeting)}
										</Badge>
									</div>
								)}

								{/* Action Buttons */}
								<div className="flex gap-2 pt-2">
									{isMeetingOngoing(meeting) && meeting.type === "VIDEO" && (
										<Button
											size="sm"
											onClick={() => handleJoinMeeting(meeting)}
											className="flex-1 rounded-lg border-0 bg-blue-600 font-medium text-white hover:bg-blue-700"
										>
											<Video className="mr-2 h-4 w-4" />
											Join Meeting
										</Button>
									)}

									{isMeetingUpcoming(meeting) && !isMeetingCreator(meeting) && (
										<div className="flex flex-1 gap-1">
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleRSVP(meeting.id, "ACCEPTED")}
												className="flex-1 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
											>
												Accept
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleRSVP(meeting.id, "DECLINED")}
												className="flex-1 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
											>
												Decline
											</Button>
										</div>
									)}

									{isMeetingCreator(meeting) && isMeetingUpcoming(meeting) && (
										<Button
											size="sm"
											onClick={() => handleStartMeeting(meeting)}
											className="flex-1 rounded-lg border-0 bg-blue-600 font-medium text-white hover:bg-blue-700"
										>
											<Play className="mr-2 h-4 w-4" />
											Start Meeting
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Enhanced Empty State */}
				{filteredMeetings.length === 0 && (
					<div className="py-20 text-center">
						<div className="relative">
							<div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-muted shadow-lg">
								<Calendar className="h-16 w-16 text-muted-foreground" />
							</div>
							<div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-muted-foreground">
								<Sparkles className="h-4 w-4 text-background" />
							</div>
						</div>
						<h3 className="mb-3 text-2xl font-bold">
							{searchTerm || statusFilter !== "all" || typeFilter !== "all"
								? "No meetings match your criteria"
								: "Ready to schedule your first meeting?"}
						</h3>
						<p className="mx-auto mb-8 max-w-md text-lg text-muted-foreground">
							{searchTerm || statusFilter !== "all" || typeFilter !== "all"
								? "Try adjusting your filters or search terms to find what you're looking for."
								: "Create your first meeting to get started with video conferencing and collaboration."}
						</p>
						{!searchTerm && statusFilter === "all" && typeFilter === "all" && (
							<Button
								onClick={() => setShowMeetingModal(true)}
								size="lg"
								suppressHydrationWarning
							>
								<Plus className="mr-2 h-5 w-5" />
								Create Your First Meeting
							</Button>
						)}
					</div>
				)}

				{/* Professional Session Scheduling Modal */}
				<Dialog open={showMeetingModal} onOpenChange={setShowMeetingModal}>
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
										value={sessionDetails.title}
										onChange={(e) =>
											setSessionDetails({
												...sessionDetails,
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
										Document
									</Label>
									<Select
										value={sessionDetails.document}
										onValueChange={(value) =>
											setSessionDetails({ ...sessionDetails, document: value })
										}
									>
										<SelectTrigger className="border-slate-200 bg-white/50 dark:border-slate-600 dark:bg-slate-700/50">
											<SelectValue placeholder="Select document to sign" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="partnership-agreement">
												Partnership Agreement - TechCorp
											</SelectItem>
											<SelectItem value="employment-contract">
												Employment Contract - John Smith
											</SelectItem>
											<SelectItem value="nda-alpha">
												NDA - Client Project Alpha
											</SelectItem>
											<SelectItem value="lease-agreement">
												Lease Agreement - Property Management
											</SelectItem>
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
										value={sessionDetails.date}
										onChange={(e) =>
											setSessionDetails({
												...sessionDetails,
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
										value={sessionDetails.time}
										onValueChange={(value) =>
											setSessionDetails({ ...sessionDetails, time: value })
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
										selectedParticipants={selectedParticipants}
										onParticipantsChange={setSelectedParticipants}
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
										value={sessionDetails.notes}
										onChange={(e) =>
											setSessionDetails({
												...sessionDetails,
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
									onClick={handleCreateSession}
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
									onClick={() => setShowMeetingModal(false)}
									className="border-slate-200 text-slate-700 dark:border-slate-600 dark:text-slate-300"
								>
									Cancel
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	)
}
