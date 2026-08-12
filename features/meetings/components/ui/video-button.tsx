"use client"

import type { LucideIcon } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import { cn } from "@/core/lib/utils"

interface VideoButtonProps {
	variant?: "default" | "destructive" | "outline"
	onClick: () => void
	icon: LucideIcon
	className?: string
}

export function VideoButton({
	variant = "default",
	onClick,
	icon: Icon,
	className
}: VideoButtonProps) {
	return (
		<Button
			variant={variant}
			onClick={onClick}
			size="icon"
			className={cn("h-12 w-12 rounded-full", className)}
		>
			<Icon className="h-5 w-5" />
		</Button>
	)
}
