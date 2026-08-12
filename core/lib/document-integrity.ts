import { PrismaClient } from "@prisma/client"
import { sha256 } from "js-sha256"

import { getSupabaseClient } from "@/services/supabase"

/**
 * Utility function to verify document integrity by comparing stored hash with file content
 * @param documentId - Document ID to verify
 * @param db - Prisma client instance
 * @returns Promise<{isValid: boolean, storedHash: string | null, calculatedHash: string | null}>
 */
export async function verifyDocumentIntegrity(
	documentId: string,
	db: PrismaClient
): Promise<{
	isValid: boolean
	storedHash: string | null
	calculatedHash: string | null
	error?: string
}> {
	try {
		// Get document from database
		const document = await db.document.findUnique({
			where: { id: documentId },
			select: {
				id: true,
				name: true,
				path: true,
				sha256Hash: true
			}
		})

		if (!document) {
			return {
				isValid: false,
				storedHash: null,
				calculatedHash: null,
				error: "Document not found"
			}
		}

		if (!document.sha256Hash) {
			return {
				isValid: false,
				storedHash: null,
				calculatedHash: null,
				error: "No hash stored for this document"
			}
		}

		// Fetch file from Supabase storage and calculate its hash
		const supabase = getSupabaseClient()

		// Determine the correct bucket based on document path
		const bucketName = document.path.includes("/") ? "envelopes" : "documents"

		try {
			// Download the file from Supabase storage
			const { data: fileData, error: downloadError } = await supabase.storage
				.from(bucketName)
				.download(document.path)

			if (downloadError) {
				return {
					isValid: false,
					storedHash: document.sha256Hash,
					calculatedHash: null,
					error: `Failed to download file from storage: ${downloadError.message}`
				}
			}

			// Convert blob to buffer and calculate hash
			const arrayBuffer = await fileData.arrayBuffer()
			const fileBuffer = Buffer.from(arrayBuffer)
			const calculatedHash = sha256(fileBuffer)

			// Compare hashes
			const isValid = calculatedHash === document.sha256Hash

			return {
				isValid,
				storedHash: document.sha256Hash,
				calculatedHash,
				error: isValid
					? undefined
					: "Hash mismatch - file may have been tampered with"
			}
		} catch (storageError) {
			return {
				isValid: false,
				storedHash: document.sha256Hash,
				calculatedHash: null,
				error: `Storage access error: ${storageError instanceof Error ? storageError.message : "Unknown storage error"}`
			}
		}
	} catch (error) {
		return {
			isValid: false,
			storedHash: null,
			calculatedHash: null,
			error: `Error verifying document integrity: ${error instanceof Error ? error.message : "Unknown error"}`
		}
	}
}

/**
 * Verify integrity for multiple documents in parallel
 * @param documentIds - Array of document IDs to verify
 * @param db - Prisma client instance
 * @returns Promise<Map<string, {isValid: boolean, storedHash: string | null, calculatedHash: string | null, error?: string}>>
 */
export async function verifyMultipleDocumentsIntegrity(
	documentIds: string[],
	db: PrismaClient
): Promise<
	Map<
		string,
		{
			isValid: boolean
			storedHash: string | null
			calculatedHash: string | null
			error?: string
		}
	>
> {
	const results = new Map()

	// Process documents in parallel with a concurrency limit to avoid overwhelming storage
	const CONCURRENCY_LIMIT = 5
	const chunks = []

	for (let i = 0; i < documentIds.length; i += CONCURRENCY_LIMIT) {
		chunks.push(documentIds.slice(i, i + CONCURRENCY_LIMIT))
	}

	for (const chunk of chunks) {
		const chunkPromises = chunk.map(async (documentId) => {
			const result = await verifyDocumentIntegrity(documentId, db)
			return { documentId, result }
		})

		const chunkResults = await Promise.all(chunkPromises)

		for (const { documentId, result } of chunkResults) {
			results.set(documentId, result)
		}
		console.log({ results })
	}

	return results
}

/**
 * Log document integrity verification in audit events
 * @param documentId - Document ID
 * @param verificationResult - Result from verifyDocumentIntegrity
 * @param userEmail - User email for audit
 * @param userName - User name for audit
 * @param db - Prisma client instance
 */
export async function logIntegrityVerification(
	documentId: string,
	verificationResult: {
		isValid: boolean
		storedHash: string | null
		calculatedHash: string | null
		error?: string
	},
	userEmail: string,
	userName: string,
	db: PrismaClient
): Promise<void> {
	await db.auditEvent.create({
		data: {
			eventType: verificationResult.isValid
				? "DOCUMENT_VIEWED"
				: "DOCUMENT_HASH_UPDATED",
			description: verificationResult.isValid
				? `Document integrity verified successfully`
				: `Document integrity verification failed: ${verificationResult.error ?? "Hash mismatch"}`,
			userEmail,
			userName,
			documentId,
			timestamp: new Date(),
			metadata: {
				integrityCheck: {
					isValid: verificationResult.isValid,
					storedHash: verificationResult.storedHash,
					calculatedHash: verificationResult.calculatedHash,
					error: verificationResult.error,
					verifiedAt: new Date().toISOString()
				}
			}
		}
	})
}
