"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { FileText } from "lucide-react"
import { useTheme } from "next-themes"

interface LogoProps {
	className?: string
	showText?: boolean
	size?: "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
	sm: "h-6 w-6",
	md: "h-8 w-8",
	lg: "h-12 w-12",
	xl: "h-16 w-16"
}

const textSizeClasses = {
	sm: "text-lg",
	md: "text-xl",
	lg: "text-2xl",
	xl: "text-3xl"
}

export function Logo({
	className = "",
	showText = true,
	size = "md"
}: LogoProps) {
	const { resolvedTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	// Show fallback icon until mounted to prevent hydration mismatch
	if (!mounted) {
		return (
			<div className={`flex items-center space-x-2 ${className}`}>
				<FileText className={`${sizeClasses[size]} text-blue-600`} />
				{showText && (
					<span
						className={`${textSizeClasses[size]} font-bold text-gray-900 dark:text-white`}
					>
						Quanby Sign
					</span>
				)}
			</div>
		)
	}

	const isDark = resolvedTheme === "dark"
	const logoSrc = isDark ? "/placeholder-logo.png" : "/placeholder-logo.png"

	return (
		<div className={`flex items-center space-x-2 ${className}`}>
			<div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
				<Image
					src={logoSrc || "/placeholder.svg"}
					alt="Quanby Sign Logo"
					fill
					className="object-contain"
					priority
				/>
			</div>
			{showText && (
				<span
					className={`${textSizeClasses[size]} font-bold text-gray-900 dark:text-white`}
				>
					Quanby Sign
				</span>
			)}
		</div>
	)
}
