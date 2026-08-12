import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge class names
 * @param inputs - Class values
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

/**
 * Format an enum value to a human readable label
 * @param value - The enum value
 * @returns The human readable label
 */
export function formatEnumToLabel(value: string): string {
	return value
		.toLowerCase()
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ")
}

/**
 * Get initials from a name string
 * @param name - Full name string
 * @returns Initials (max 2 characters)
 */
export function getInitials(name?: string | null): string {
	if (!name?.trim()) return ""

	const parts = name.trim().split(/\s+/)

	// Single word name
	if (parts.length === 1) {
		const word = parts[0] ?? ""
		return word.length <= 1 ? word : word.slice(0, 2).toUpperCase()
	}

	// Multiple word name - take first letter of first two words
	return parts
		.slice(0, 2)
		.map((word) => word.charAt(0))
		.join("")
		.toUpperCase()
}

/**
 * Convert SCREAMING_SNAKE_CASE to "Word word" format.
 * @param value - The input string (e.g., "WORD_WORD")
 * @returns The formatted string (e.g., "Word Word")
 */
export function normalCase(value: string): string {
	return value
		.toLowerCase()
		.split("_")
		.map((word, index) =>
			index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word
		)
		.join(" ")
}
