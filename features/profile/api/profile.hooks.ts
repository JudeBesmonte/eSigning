import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import { usePresignedUrl } from "@/services/supabase/presigned-url"
import { getPublicUrl } from "@/services/supabase/signed-url"
import { useUploadFile } from "@/services/supabase/upload"
import { trpc } from "@/services/trpc/client"

/**
 * Hook for uploading profile images to Supabase and updating user profile
 * Handles the complete flow: presigned URL generation -> file upload -> database update
 */
export function useProfileImageUpload() {
	const { data: session } = useSession()
	const queryClient = useQueryClient()
	const presignedUrl = usePresignedUrl()
	const uploadFile = useUploadFile()
	const updateProfileImage = trpc.profile.updateProfileImage.useMutation()

	return useMutation({
		mutationFn: async (file: File) => {
			if (!session?.user?.id) {
				throw new Error("User not authenticated")
			}

			// Validate file type
			if (!file.type.startsWith("image/")) {
				throw new Error("Please select a valid image file")
			}

			// Validate file size (max 5MB)
			const maxSize = 5 * 1024 * 1024 // 5MB
			if (file.size > maxSize) {
				throw new Error("Image size must be less than 5MB")
			}

			// Step 1: Generate presigned URL
			const timestamp = Date.now()
			const fileName = `${timestamp}-${file.name}`
			const folderPath = session.user.id

			const presignedData = await presignedUrl.mutateAsync({
				file: new File([file], fileName, { type: file.type }),
				bucket: "avatar",
				folderPath,
				upsert: false
			})

			// Step 2: Upload file to Supabase
			await uploadFile.mutateAsync({
				signedUrl: presignedData.signedUrl,
				file: new File([file], fileName, { type: file.type }),
				contentType: file.type
			})

			// Step 3: Get public URL
			const publicUrl = await getPublicUrl("avatar", presignedData.path)

			// Step 4: Update user profile in database
			const result = await updateProfileImage.mutateAsync({
				imageUrl: publicUrl
			})

			return result
		},
		onSuccess: (data) => {
			toast.success(data.message)

			// Invalidate and refetch user session and profile data
			void queryClient.invalidateQueries({ queryKey: ["session"] })
			void queryClient.invalidateQueries({ queryKey: ["profile"] })
		},
		onError: (error) => {
			toast.error(error.message || "Failed to upload profile image")
		}
	})
}

/**
 * Utility hook for handling profile image file selection and validation
 */
export function useProfileImageSelection() {
	return {
		validateAndProcessFile: (
			file: File
		): Promise<{ file: File; preview: string }> => {
			return new Promise((resolve, reject) => {
				// Validate file type
				if (!file.type.startsWith("image/")) {
					reject(new Error("Please select a valid image file"))
					return
				}

				// Validate file size (max 5MB)
				const maxSize = 5 * 1024 * 1024 // 5MB
				if (file.size > maxSize) {
					reject(new Error("Image size must be less than 5MB"))
					return
				}

				// Create preview URL
				const reader = new FileReader()
				reader.onload = () => {
					resolve({
						file,
						preview: reader.result as string
					})
				}
				reader.onerror = () => {
					reject(new Error("Failed to read image file"))
				}
				reader.readAsDataURL(file)
			})
		}
	}
}

// export const useGetDefaultSignature = () => {
// 	return trpc.profile.getDefaultSignature.useQuery()
// }

// export const useUpdateDefaultSignature = () => {
// 	return trpc.profile.updateDefaultSignature.useMutation()
// }

// export const useRemoveDefaultSignature = () => {
// 	return trpc.profile.removeDefaultSignature.useMutation()
// }
