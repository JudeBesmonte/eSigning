import { type UserRole } from "./config"

// ============================================================================
// LOGGING & MONITORING (Functional)
// ============================================================================

/**
 * Logs middleware access attempts
 */
export function logAccess(
	path: string,
	role: UserRole | null,
	authorized: boolean
): void {
	if (process.env.NODE_ENV === "development") {
		console.log(
			`\n[Middleware] ${path} | Role: ${role ?? "anonymous"} | Authorized: ${authorized}`
		)
	}

	// In production, you might want to use a proper logging service
	// e.g., Datadog, New Relic, CloudWatch, etc.
}

/**
 * Logs redirect actions
 */
export function logRedirect(from: string, to: string, reason: string): void {
	if (process.env.NODE_ENV === "development") {
		console.log(`[Middleware] Redirect: ${from} -> ${to} (${reason})`)
	}
}

/**
 * Logs errors with context
 */
export function logError(error: unknown, context?: string): void {
	const contextInfo = context ? `[${context}] ` : ""
	console.error(`[Middleware] ${contextInfo}Error:`, error)
}
