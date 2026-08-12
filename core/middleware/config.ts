export const USER_ROLE = {
	CLIENT: "CLIENT",
	ADMIN: "ADMIN",
	SUPER_ADMIN: "SUPER_ADMIN"
} as const

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RoutePattern {
	path: string
	exact?: boolean
}

export interface RouteConfig {
	public: RoutePattern[]
	publicOnly: RoutePattern[]
	protected: {
		shared: RoutePattern[]
		[USER_ROLE.CLIENT]: RoutePattern[]
		[USER_ROLE.ADMIN]: RoutePattern[]
		[USER_ROLE.SUPER_ADMIN]: RoutePattern[]
	}
}

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

export const ROUTE_CONFIG: RouteConfig = {
	public: [{ path: "/", exact: true }],

	// Public only routes - accessible to non-authenticated users only
	publicOnly: [
		{ path: "/auth/login", exact: true },
		{ path: "/auth/register", exact: true },
		{ path: "/auth/forgot-password", exact: true },
		{ path: "/auth/reset-password", exact: true },
		{ path: "/auth/verify-email", exact: true }
	],

	// Protected routes - require authentication and role-based access
	protected: {
		shared: [
			{ path: "/profile" },
			{ path: "/notifications" },
			{ path: "/settings" },
			{ path: "/envelopes" },
			{ path: "/envelope" },
			{ path: "/my-signed" },
			{ path: "/auth/signature" }
		],
		[USER_ROLE.CLIENT]: [
			// Client-specific routes
		],
		[USER_ROLE.ADMIN]: [{ path: "/dashboard" }],
		[USER_ROLE.SUPER_ADMIN]: [{ path: "/dashboard" }]
	}
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CUSTOM_HEADERS = {
	// Minimal headers to prevent 431 errors
	// Removed X-Powered-By to reduce header size
} as const

export const DEFAULT_ROUTES: Record<UserRole, string> = {
	[USER_ROLE.CLIENT]: "/",
	[USER_ROLE.ADMIN]: "/",
	[USER_ROLE.SUPER_ADMIN]: "/"
}
