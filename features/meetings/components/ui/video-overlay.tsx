"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Mic } from "lucide-react"

import { VideoBadge } from "./video-badge"

interface VideoOverlayProps {
	children: ReactNode
	micOn?: boolean
	micStream: MediaStream | null
	isLocal?: boolean
	participantName?: string
	icon?: LucideIcon
}

export function VideoOverlay({
	children,
	micOn = false,
	micStream,
	isLocal = false,
	participantName,
	icon: Icon
}: VideoOverlayProps) {
	return (
		<div className="group relative">
			{children}

			{/* Audio indicator */}
			{micOn && micStream && (
				<div className="absolute bottom-2 left-2">
					<VideoBadge className="bg-green-500 text-white" icon={Mic}>
						Audio
					</VideoBadge>
				</div>
			)}

			{/* Local indicator */}
			{isLocal && (
				<div className="absolute left-2 top-2">
					<VideoBadge variant="outline" className="bg-blue-500 text-white">
						You
					</VideoBadge>
				</div>
			)}

			{/* Participant name */}
			{participantName && (
				<div className="absolute bottom-2 right-2">
					<VideoBadge variant="outline" className="bg-black/50 text-white">
						{participantName}
					</VideoBadge>
				</div>
			)}

			{/* Custom icon */}
			{Icon && (
				<div className="absolute right-2 top-2">
					<VideoBadge
						variant="outline"
						className="bg-black/50 text-white"
						icon={Icon}
					>
						{participantName}
					</VideoBadge>
				</div>
			)}
		</div>
	)
}
