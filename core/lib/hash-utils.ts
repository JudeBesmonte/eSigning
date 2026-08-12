import { sha256 } from 'js-sha256'

/**
 * Calculate SHA-256 hash of a file buffer
 * @param buffer - File buffer
 * @returns SHA-256 hash as hex string
 */
export function calculateFileHash(buffer: Buffer): string {
	return sha256(buffer)
}

/**
 * Calculate SHA-256 hash of a file from base64 data
 * @param base64Data - Base64 encoded file data
 * @returns SHA-256 hash as hex string
 */
export function calculateHashFromBase64(base64Data: string): string {
	const buffer = Buffer.from(base64Data, 'base64')
	return calculateFileHash(buffer)
}

/**
 * Calculate SHA-256 hash of a blob/file in the browser
 * @param file - File object
 * @returns Promise that resolves to SHA-256 hash as hex string
 */
export async function calculateHashFromFile(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer()
	const buffer = Buffer.from(arrayBuffer)
	return calculateFileHash(buffer)
}

/**
 * Verify file integrity by comparing hashes
 * @param expectedHash - Expected SHA-256 hash
 * @param actualHash - Actual SHA-256 hash
 * @returns True if hashes match
 */
export function verifyFileIntegrity(expectedHash: string, actualHash: string): boolean {
	return expectedHash === actualHash
}