import { PrismaClient } from "@prisma/client"

export const db = new PrismaClient({
	log: ["warn", "error"],
	transactionOptions: {
		maxWait: 5000,
		timeout: 30000
	}
})

export const SEED_RANGES = {
	ADMIN: [1, 3],
	SUPER_ADMIN: [1, 2],
	CLIENT: [10, 20]
} as const

export const EMAIL_DOMAIN = "@email.com"
export const DEFAULT_PASSWORD = "asdfasdf"

// Test accounts with predefined data
export const TEST_ACCOUNTS = {
	// Client Account
	"client@email.com": {
		email: "client@email.com",
		name: "Sarah Johnson",
		role: "CLIENT" as const,
		emailVerified: new Date()
	},
	// Another Client Account
	"john@email.com": {
		email: "john@email.com",
		name: "John Smith",
		role: "CLIENT" as const,
		emailVerified: new Date()
	},
	// Admin Account
	"admin@email.com": {
		email: "admin@email.com",
		name: "Michael Chen",
		role: "ADMIN" as const,
		emailVerified: new Date()
	},
	// Super Admin Account
	"superadmin@email.com": {
		email: "superadmin@email.com",
		name: "Emily Davis",
		role: "SUPER_ADMIN" as const,
		emailVerified: new Date()
	}
} as const
