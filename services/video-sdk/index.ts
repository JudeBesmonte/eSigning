import jwt from "jsonwebtoken"

import { env } from "@/env.js"

// Type definitions for VideoSDK API responses
interface VideoSDKRoomResponse {
	roomId: string
	name: string
	status: string
}

interface VideoSDKCreateRoomResponse {
	roomId: string
	name: string
}

// Video SDK configuration
const VIDEO_SDK_API_KEY = env.VIDEO_SDK_API_KEY
const VIDEO_SDK_SECRET = env.VIDEO_SDK_SECRET

// Validate environment variables
if (!VIDEO_SDK_API_KEY || !VIDEO_SDK_SECRET) {
	console.error(
		"❌ VideoSDK API key and secret are not configured. Video meetings will not be available."
	)
	console.error(
		"❌ Please set VIDEO_SDK_API_KEY and VIDEO_SDK_SECRET in your .env file"
	)
	console.error("❌ Get your credentials from: https://app.videosdk.live/")
}

// Generate server JWT for REST API calls (room create/details)
function generateServerJWT() {
	if (!VIDEO_SDK_SECRET) {
		throw new Error("VIDEO_SDK_SECRET is not configured")
	}

	const payload = {
		apikey: VIDEO_SDK_API_KEY,
		permissions: ["allow_join", "allow_mod", "allow_record"],
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours
	}
	return jwt.sign(payload, VIDEO_SDK_SECRET, {
		algorithm: "HS256"
	})
}

// Create a new room
export async function createRoom(roomName: string) {
	try {
		if (!VIDEO_SDK_API_KEY || !VIDEO_SDK_SECRET) {
			throw new Error(
				"VideoSDK API key and secret are not configured. Video meetings are not available."
			)
		}

		// Creating VideoSDK room
		const response = await fetch("https://api.videosdk.live/v2/rooms", {
			method: "POST",
			headers: {
				"Authorization": generateServerJWT(),
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				name: roomName,
				privacy: "public"
			})
		})

		if (!response.ok) {
			const details = await response.text().catch(() => "")
			throw new Error(
				`Failed to create room: ${response.status} ${response.statusText} ${details}`
			)
		}

		const data = (await response.json()) as VideoSDKCreateRoomResponse
		// Room created

		return {
			roomId: data.roomId,
			roomName: roomName
		}
	} catch (error) {
		console.error("❌ Error creating VideoSDK room:", error)
		throw error
	}
}

// Generate room token for joining
export async function generateRoomToken(
	roomId: string,
	participantName: string,
	role: "host" | "participant" = "participant"
) {
	try {
		console.log("🔍 Generating VideoSDK token with:")
		console.log("   - Room ID:", roomId)
		console.log("   - Participant Name:", participantName)
		console.log("   - Role:", role)
		console.log("   - API Key:", VIDEO_SDK_API_KEY ? "✅ Set" : "❌ Missing")
		console.log("   - Secret:", VIDEO_SDK_SECRET ? "✅ Set" : "❌ Missing")

		if (!VIDEO_SDK_API_KEY || !VIDEO_SDK_SECRET) {
			console.error("❌ VideoSDK credentials missing:")
			console.error(
				"   - VIDEO_SDK_API_KEY:",
				VIDEO_SDK_API_KEY ? "✅ Set" : "❌ Missing"
			)
			console.error(
				"   - VIDEO_SDK_SECRET:",
				VIDEO_SDK_SECRET ? "✅ Set" : "❌ Missing"
			)
			throw new Error(
				"VideoSDK API key and secret are not configured. Please set VIDEO_SDK_API_KEY and VIDEO_SDK_SECRET in your .env file. Get your credentials from https://app.videosdk.live/"
			)
		}

		// Generate join token

		// Validate inputs
		if (!roomId || !participantName) {
			throw new Error("Room ID and participant name are required")
		}

		const payload = {
			apikey: VIDEO_SDK_API_KEY,
			permissions:
				role === "host"
					? ["allow_join", "allow_mod", "allow_record"]
					: ["allow_join"],
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours
		}

		// Signing JWT
		console.log("🔍 JWT Payload:", JSON.stringify(payload, null, 2))

		// Sign the JWT without expiresIn since we're setting exp in the payload
		let token: string
		try {
			token = jwt.sign(payload, VIDEO_SDK_SECRET, {
				algorithm: "HS256"
			})
			console.log("✅ JWT token generated successfully")
		} catch (jwtError) {
			console.error("❌ JWT signing error:", jwtError)
			// Try without algorithm specification
			token = jwt.sign(payload, VIDEO_SDK_SECRET)
			console.log("✅ JWT token generated with fallback method")
		}

		// Token generated
		console.log(
			"🔍 Generated token (first 50 chars):",
			token.substring(0, 50) + "..."
		)
		return token
	} catch (error) {
		console.error("❌ Error generating room token:", error)
		if (error instanceof Error) {
			console.error("❌ Error details:", error.message)
			console.error("❌ Error stack:", error.stack)
		}
		throw error
	}
}

// Get room details
export async function getRoomDetails(roomId: string) {
	try {
		if (!VIDEO_SDK_API_KEY || !VIDEO_SDK_SECRET) {
			throw new Error(
				"VideoSDK API key and secret are not configured. Video meetings are not available."
			)
		}

		// Get room details
		const response = await fetch(
			`https://api.videosdk.live/v2/rooms/${roomId}`,
			{
				method: "GET",
				headers: {
					"Authorization": generateServerJWT(),
					"Content-Type": "application/json"
				}
			}
		)

		if (!response.ok) {
			const details = await response.text().catch(() => "")
			throw new Error(
				`Failed to get room details: ${response.status} ${response.statusText} ${details}`
			)
		}

		const data = (await response.json()) as VideoSDKRoomResponse
		// Room details retrieved

		return {
			roomId: data.roomId,
			name: data.name,
			status: data.status
		}
	} catch (error) {
		console.error("❌ Error getting room details:", error)
		throw error
	}
}
