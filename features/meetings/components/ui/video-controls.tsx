"use client"

import type { LucideIcon } from "lucide-react"

import { VideoButton } from "./video-button"

interface VideoControlProps {
	variant: "default" | "destructive" | "outline"
	onClick: () => void
	icon: LucideIcon
	isActive?: boolean
	tooltip?: string
}

interface VideoControlsProps {
	controls: VideoControlProps[]
	className?: string
}

export function VideoControls({
	controls,
	className = ""
}: VideoControlsProps) {
	return (
		<div
			className={`fixed bottom-6 left-1/2 -translate-x-1/2 transform rounded-2xl border border-gray-700/50 bg-gray-900/95 px-6 py-4 shadow-2xl backdrop-blur-sm ${className} `}
		>
			<div className="flex items-center space-x-4">
				{controls.map((control, index) => (
					<VideoButton
						key={index}
						variant={control.variant}
						onClick={control.onClick}
						icon={control.icon}
						className={`transition-all duration-200 hover:scale-110 ${control.isActive ? "ring-2 ring-blue-400 ring-opacity-50" : ""} `}
					/>
				))}
			</div>
		</div>
	)
}
