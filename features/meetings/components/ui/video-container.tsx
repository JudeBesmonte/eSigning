"use client"

import type { ReactNode } from "react"

interface VideoContainerProps {
	children: ReactNode
	className?: string
	isLocal?: boolean
	isActive?: boolean
}

export function VideoContainer({
	children,
	className = "",
	isLocal = false,
	isActive = true
}: VideoContainerProps) {
	return (
		<div
			className={`relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 ${isLocal ? "ring-2 ring-blue-500 ring-opacity-50" : ""} ${isActive ? "opacity-100" : "opacity-60"} ${className} `}
		>
			{children}
		</div>
	)
}
