// "use server"

// import { auth } from "@/services/next-auth"
// import { db } from "@/services/prisma/db"
// import { createClient } from "@supabase/supabase-js"

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// const supabase = createClient(supabaseUrl, supabaseServiceKey)

// export async function updateProfileImage(formData: FormData) {
// 	const session = await auth()

// 	if (!session?.user?.id) {
// 		throw new Error("Authentication required")
// 	}

// 	const file = formData.get("file") as File

// 	if (!file) {
// 		throw new Error("No file provided")
// 	}

// 	// Validate file
// 	if (file.size > 5 * 1024 * 1024) {
// 		throw new Error("File size must be less than 5MB")
// 	}

// 	const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
// 	if (!allowedTypes.includes(file.type)) {
// 		throw new Error("Only JPG, PNG and GIF formats are supported")
// 	}

// 	try {
// 		const userId = session.user.id

// 		// Check if user has existing profile image and delete it
// 		const existingUser = await db.user.findUnique({
// 			where: { id: userId },
// 			select: { image: true }
// 		})

// 		if (existingUser?.image) {
// 			const existingFilePath = extractFilePathFromUrl(existingUser.image)
// 			if (existingFilePath) {
// 				await supabase.storage.from("avatar").remove([existingFilePath])
// 			}
// 		}

// 		// Upload new image
// 		const fileName = `${Date.now()}-${file.name}`
// 		const filePath = `${userId}/${fileName}`

// 		const { error: uploadError } = await supabase.storage
// 			.from("avatar")
// 			.upload(filePath, file, {
// 				cacheControl: "3600",
// 				upsert: true
// 			})

// 		if (uploadError) {
// 			console.error("Supabase upload error:", uploadError)
// 			throw new Error("Failed to upload image")
// 		}

// 		// Get public URL
// 		const { data: publicUrlData } = supabase.storage
// 			.from("avatar")
// 			.getPublicUrl(filePath)

// 		const imageUrl = publicUrlData.publicUrl

// 		// Update user in database
// 		await db.user.update({
// 			where: { id: userId },
// 			data: { image: imageUrl }
// 		})

// 		return { imageUrl, message: "Profile image updated successfully" }
// 	} catch (error) {
// 		console.error("Profile image update error:", error)
// 		throw new Error(error instanceof Error ? error.message : "Failed to update profile image")
// 	}
// }

// // Helper function to extract file path from Supabase URL
// function extractFilePathFromUrl(url: string): string | null {
// 	try {
// 		const urlObject = new URL(url)
// 		const pathSegments = urlObject.pathname.split("/").filter(Boolean)

// 		// Find the index of the bucket name "avatar" in the path
// 		const bucketIndex = pathSegments.findIndex(segment => segment === "avatar")

// 		if (bucketIndex !== -1 && bucketIndex + 1 < pathSegments.length) {
// 			// Return everything after the bucket name
// 			return pathSegments.slice(bucketIndex + 1).join("/")
// 		}

// 		return null
// 	} catch (error) {
// 		console.error("Failed to extract file path from URL:", error)
// 		return null
// 	}
// }
