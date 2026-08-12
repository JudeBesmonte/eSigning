"use client"

import type { LucideIcon } from "lucide-react"

import { Badge } from "@/core/components/ui/badge"

interface VideoBadgeProps {
	variant?: "default" | "outline"
	className?: string
	icon?: LucideIcon
	children: React.ReactNode
}

export function VideoBadge({
	variant = "default",
	className = "",
	icon: Icon,
	children
}: VideoBadgeProps) {
	return (
		<Badge variant={variant} className={className}>
			{Icon && <Icon className="mr-1 h-3 w-3" />}
			{children}
		</Badge>
	)
}
