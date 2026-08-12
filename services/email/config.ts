import nodemailer from "nodemailer"

import { env } from "../../env.js"

function validateAndNormalizeHost(raw: unknown): string {
	const host = typeof raw === "string" ? raw.trim() : ""
	// Basic hostname validation: letters, numbers, dashes and dots, must contain a dot
	if (!host || !/^[A-Za-z0-9.-]+$/.test(host) || !host.includes(".")) {
		throw new Error(
			`Invalid EMAIL_HOST value: ${JSON.stringify(host)}. Please set a valid SMTP hostname (e.g., "smtp.gmail.com").`
		)
	}
	return host
}

// Create SMTP transporter
export const createTransporter = () => {
	const host = validateAndNormalizeHost(env.EMAIL_HOST)
	const port = Number(env.EMAIL_PORT)
	const secure = port === 465 // true for 465, false for other ports

	return nodemailer.createTransport({
		host,
		port,
		secure,
		auth: {
			user: String(env.EMAIL_USER),
			pass: String(env.EMAIL_PASS)
		},
		// For STARTTLS on port 587, explicitly require TLS
		requireTLS: port === 587,
		// Additional options for better reliability
		pool: true,
		maxConnections: 5,
		maxMessages: 100,
		rateDelta: 1000,
		rateLimit: 5
	})
}

// Email configuration
export const emailConfig = {
	from: {
		name: String(env.EMAIL_FROM_NAME),
		address: String(env.EMAIL_FROM)
	},
	// Base URL for email links (you can make this configurable)
	baseUrl: env.AUTH_URL
}

// Verify transporter configuration
export const verifyEmailConfig = async () => {
	try {
		const transporter = createTransporter()
		await transporter.verify()
		console.log(
			`✅ Email configuration verified successfully (host=${String(env.EMAIL_HOST)}, port=${String(env.EMAIL_PORT)})`
		)
		return true
	} catch (error) {
		console.error("❌ Email configuration verification failed:", error)
		return false
	}
}
