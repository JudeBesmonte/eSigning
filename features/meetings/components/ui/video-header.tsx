"use client"

import type { LucideIcon } from "lucide-react"

import { VideoBadge } from "./video-badge"

interface VideoHeaderProps {
	participantCount: number
	meetingTitle?: string
	icon?: LucideIcon
	className?: string
}

export function VideoHeader({
	participantCount,
	meetingTitle,
	icon,
	className = ""
}: VideoHeaderProps) {
	return (
		<div
			className={`absolute left-6 right-6 top-6 z-10 flex items-center justify-between ${className} `}
		>
			<div className="flex items-center space-x-3">
				<VideoBadge
					variant="outline"
					className="border-gray-500 bg-black/60 text-white backdrop-blur-sm"
					icon={icon}
				>
					{participantCount} participant{participantCount !== 1 ? "s" : ""}
				</VideoBadge>

				{meetingTitle && (
					<VideoBadge
						variant="outline"
						className="border-gray-600 bg-black/40 text-gray-200 backdrop-blur-sm"
					>
						{meetingTitle}
					</VideoBadge>
				)}
			</div>
		</div>
	)
}
