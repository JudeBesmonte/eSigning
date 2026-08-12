import { createWorker } from "tesseract.js"
import { z } from "zod"

import { createTRPCRouter, publicProcedure } from "@/services/trpc/init"

import { ocrResultSchema } from "./ocr.schemas"

// Helper function to extract ID information from OCR text
function extractIdInfo(text: string) {
	// Preprocess the text to normalize spacing and clean up
	let cleanedText = text
		.replace(/\s+/g, " ") // Replace multiple spaces with single space
		.replace(/([a-z])([A-Z])/g, "$1 $2") // Add space between lowercase and uppercase
		.trim()

	// Try to split the text into logical lines based on common patterns
	// Look for patterns that typically start new lines in ID documents
	cleanedText = cleanedText
		.replace(
			/(License No\.|License Number|Id No\.|ID NO|Nationality|Sex|Date of Birth|Address|Expiration Date|Blood Type|Restrictions|Conditions)/gi,
			"\n$1"
		)
		.replace(
			/(Last Name[^A-Z]*|First Name[^A-Z]*|Middle Name[^A-Z]*)/gi,
			"\n$1"
		)
		.replace(/([A-Z]{3,}\s+[A-Z]{3,}[^a-z]*)/g, "\n$1") // Names in all caps
		.replace(/([A-Z]\d{2}-\d{2}-\d{6})/g, "\n$1") // Philippine license numbers
		.replace(/(\d{4}\/\d{1,2}\/\d{1,2}|\d{1,2}\/\d{1,2}\/\d{4})/g, "\n$1") // Dates
		.replace(/(UNIT\/HOUSE|[A-Z]+\/[A-Z]+\s+NO\.)/gi, "\n$1") // Address patterns

	const lines = cleanedText
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0)

	console.log("OCR Lines for debugging:", lines)

	const result = {
		idNumber: "",
		fullName: "",
		address: "",
		birthdate: "",
		rawText: text
	}

	// Common patterns for different ID information
	const patterns = {
		// ID Number patterns - look for patterns after sentence case labels
		idNumber: [
			/(?:Id\s*(?:No|Number|#)?[:\s]+)([A-Z0-9\-]{6,20})/,
			/(?:ID\s*(?:NO|NUMBER|#)?[:\s]+)([A-Z0-9\-]{6,20})/,
			/(?:Identification\s*(?:No|Number)?[:\s]+)([A-Z0-9\-]{6,20})/,
			/(?:License\s*(?:No|Number)?[:\s]+)([A-Z0-9\-]{6,20})/,
			/(?:Driver.*License[:\s]+)([A-Z0-9\-]{6,20})/,
			// Standalone patterns for ID numbers
			/^([A-Z][0-9]{7,12})$/,
			/^([0-9]{4}\s*-?\s*[0-9]{4}\s*-?\s*[0-9]{4,8})$/,
			/^([A-Z0-9\-]{8,20})$/
		],
		// Name patterns - focus on all caps names after sentence case labels
		name: [
			/(?:Name[:\s]+)([A-Z][A-Z\s]+[A-Z])/,
			/(?:Full\s*Name[:\s]+)([A-Z][A-Z\s]+[A-Z])/,
			/(?:Last\s*Name[:\s]+)([A-Z]+)(?:\s*,?\s*)?(?:First\s*Name[:\s]+)?([A-Z]+)/,
			/(?:Lastname[:\s]+)([A-Z]+)(?:\s*,?\s*)?(?:Firstname[:\s]+)?([A-Z]+)/,
			/(?:Given\s*Name[:\s]+)([A-Z][A-Z\s]+[A-Z])/,
			/(?:Surname[:\s]+)([A-Z]+)/,
			// Standalone all caps names (at least 2 words)
			/^([A-Z]+\s+[A-Z]+(?:\s+[A-Z]+)*)$/
		],
		// Birthdate patterns - after sentence case labels
		birthdate: [
			/(?:Birth\s*(?:Date)?[:\s]+)(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
			/(?:Date\s*of\s*Birth[:\s]+)(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
			/(?:DOB[:\s]+)(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
			/(?:Born[:\s]+)(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
			/(?:Birthday[:\s]+)(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
			// Standalone date patterns
			/^(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})$/,
			/^(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})$/
		],
		// Address patterns - after sentence case labels, look for all caps addresses
		address: [
			/(?:Address[:\s]+)([A-Z0-9][A-Z0-9\s,.-]+(?:STREET|ST|AVENUE|AVE|ROAD|RD|BOULEVARD|BLVD|CITY|PROVINCE|STATE)[A-Z0-9\s,.-]*)/,
			/(?:Residence[:\s]+)([A-Z0-9][A-Z0-9\s,.-]+(?:STREET|ST|AVENUE|AVE|ROAD|RD|BOULEVARD|BLVD|CITY|PROVINCE|STATE)[A-Z0-9\s,.-]*)/,
			/(?:Home\s*Address[:\s]+)([A-Z0-9][A-Z0-9\s,.-]+(?:STREET|ST|AVENUE|AVE|ROAD|RD|BOULEVARD|BLVD|CITY|PROVINCE|STATE)[A-Z0-9\s,.-]*)/,
			// Standalone address patterns (all caps with address keywords)
			/^([A-Z0-9][A-Z0-9\s,.-]*(?:STREET|ST|AVENUE|AVE|ROAD|RD|BOULEVARD|BLVD)[A-Z0-9\s,.-]*)$/,
			/^([A-Z0-9][A-Z0-9\s,.-]*(?:CITY|PROVINCE|STATE)[A-Z0-9\s,.-]*)$/
		]
	}

	// Extract ID Number
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const nextLine = lines[i + 1]

		// Check if current line contains ID label (Philippine specific patterns)
		if (
			line &&
			/(?:License\s*No|License\s*Number|Id\s*(?:No|Number)|ID\s*(?:NO|NUMBER)|Identification)[.\s:]*$/i.test(
				line
			)
		) {
			if (nextLine) {
				// Look for Philippine license pattern (N03-12-123456 format)
				const phLicensePattern =
					/([A-Z]\d{2}-\d{2}-\d{6}|[A-Z0-9]{3}-[A-Z0-9]{2}-[A-Z0-9]{6})/
				let idMatch = phLicensePattern.exec(nextLine)

				// Fallback to general ID pattern
				if (!idMatch) {
					const generalIdPattern = /([A-Z0-9\-]{6,20})/
					idMatch = generalIdPattern.exec(nextLine)
				}

				if (idMatch?.[1]) {
					const idNum = idMatch[1].replace(/\s/g, "").toUpperCase()
					if (idNum.length >= 6) {
						result.idNumber = idNum
						break
					}
				}
			}
		}

		// Also check for same-line patterns as fallback
		if (line) {
			// Philippine license pattern on same line
			const phPattern =
				/(?:License\s*No[.\s:]*|License\s*Number[.\s:]*|Id\s*(?:No|Number)[.\s:]*|ID\s*(?:NO|NUMBER)[.\s:]*)([A-Z]\d{2}-\d{2}-\d{6}|[A-Z0-9]{3}-[A-Z0-9]{2}-[A-Z0-9]{6})/i
			let match = phPattern.exec(line)

			if (!match) {
				for (const pattern of patterns.idNumber) {
					match = pattern.exec(line)
					if (match) break
				}
			}

			if (match?.[1]) {
				const idNum = match[1].replace(/\s/g, "").toUpperCase()
				if (idNum.length >= 6) {
					result.idNumber = idNum
					break
				}
			}
		}
		if (result.idNumber) break
	}

	// Extract Name
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const nextLine = lines[i + 1]

		console.log(`Checking line ${i}: "${line}" with next line: "${nextLine}"`)

		// Check if current line contains name label
		if (
			line &&
			/(?:Last\s*Name.*First\s*Name.*Middle\s*Name|Name|Full\s*Name|Last\s*Name|Lastname|Given\s*Name|Surname)[.\s:]*$/i.test(
				line
			)
		) {
			console.log(`Found name label at line ${i}: "${line}"`)
			if (nextLine) {
				console.log(`Checking next line ${i + 1}: "${nextLine}"`)
				// Skip if next line contains ID titles or document types
				if (
					!/(?:DRIVER|LICENSE|REPUBLIC|PHILIPPINES|DEPARTMENT|TRANSPORTATION|LTO|GOVERNMENT|ID|CARD|IDENTIFICATION)/i.test(
						nextLine
					)
				) {
					// Look for name pattern in next line - handle Philippine format (DELA CRUZ, JUAN PEDRO GARCIA)
					const namePattern = /([A-Z\s]+(?:,\s*[A-Z\s]+)*)/
					const nameMatch = namePattern.exec(nextLine)
					if (nameMatch?.[1]) {
						const name = nameMatch[1].trim()
						console.log(`Potential name found: "${name}"`)

						// Clean up the name and validate it's not an ID title
						if (
							name.length > 3 &&
							!/(?:DRIVER|LICENSE|REPUBLIC|PHILIPPINES|DEPARTMENT|TRANSPORTATION|LTO|GOVERNMENT|ID|CARD|IDENTIFICATION)/i.test(
								name
							)
						) {
							// Check if it's mostly uppercase letters and spaces/commas
							const validNameChars = name.replace(/[^A-Z\s,]/g, "").length
							const upperCaseRatio = validNameChars / name.length

							console.log(
								`Name validation - Length: ${name.length}, Valid chars: ${validNameChars}, Ratio: ${upperCaseRatio}`
							)

							if (upperCaseRatio > 0.8) {
								console.log(`Name accepted: "${name}"`)
								result.fullName = name
								break
							}
						}
					}
				}
			}
		}

		// Special check for separate "Last Name." "First Name." "Middle Name" lines
		if (line && /^(?:Last\s*Name)[.\s:]*$/i.test(line)) {
			console.log(`Found "Last Name" label at line ${i}`)
			// Look ahead for the actual name - it might be after "First Name." and "Middle Name" labels
			for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
				const futureLine = lines[j]
				console.log(`Checking future line ${j}: "${futureLine}"`)

				// Skip label lines but look for the actual name
				if (
					futureLine &&
					!/^(?:First\s*Name|Middle\s*Name|Last\s*Name)[.\s:]*$/i.test(
						futureLine
					) &&
					!/(?:DRIVER|LICENSE|REPUBLIC|PHILIPPINES|DEPARTMENT|TRANSPORTATION|LTO|GOVERNMENT|ID|CARD|IDENTIFICATION)/i.test(
						futureLine
					)
				) {
					const namePattern = /([A-Z\s]+(?:,\s*[A-Z\s]+)*)/
					const nameMatch = namePattern.exec(futureLine)
					if (nameMatch?.[1]) {
						const name = nameMatch[1].trim()
						console.log(`Found potential name after labels: "${name}"`)

						// Validate it's a proper name (contains comma for Philippine format)
						if (
							name.length > 6 &&
							name.includes(",") &&
							!/(?:DRIVER|LICENSE|REPUBLIC|PHILIPPINES|DEPARTMENT|TRANSPORTATION|LTO|GOVERNMENT|ID|CARD|IDENTIFICATION|Nationality|Sex|Date|Address|Weight|Height)/i.test(
								name
							)
						) {
							const validNameChars = name.replace(/[^A-Z\s,]/g, "").length
							const upperCaseRatio = validNameChars / name.length

							if (upperCaseRatio > 0.8) {
								console.log(`Name accepted from future line: "${name}"`)
								result.fullName = name
								break
							}
						}
					}
				}
			}
			if (result.fullName) break
		}

		// Also check for same-line patterns as fallback
		if (line) {
			// Check for "Last Name, First Name, Middle Name: ACTUAL NAME" format
			const sameLinePattern =
				/(?:Last\s*Name.*First\s*Name.*Middle\s*Name|Name|Full\s*Name)[.\s:]+([A-Z][A-Z\s,]+)/i
			const sameLineMatch = sameLinePattern.exec(line)

			if (sameLineMatch?.[1]) {
				const name = sameLineMatch[1].trim()
				// Exclude ID titles from same-line matches
				if (
					name.length > 3 &&
					!/(?:DRIVER|LICENSE|REPUBLIC|PHILIPPINES|DEPARTMENT|TRANSPORTATION|LTO|GOVERNMENT|ID|CARD|IDENTIFICATION)/i.test(
						name
					)
				) {
					const validNameChars = name.replace(/[^A-Z\s,]/g, "").length
					const upperCaseRatio = validNameChars / name.length

					if (upperCaseRatio > 0.8) {
						result.fullName = name
						break
					}
				}
			} else {
				// Try original patterns but exclude ID titles
				for (const pattern of patterns.name) {
					const match = pattern.exec(line)
					if (match?.[1]) {
						const potentialName = match[1].trim()

						// Skip if it contains ID title keywords
						if (
							!/(?:DRIVER|LICENSE|REPUBLIC|PHILIPPINES|DEPARTMENT|TRANSPORTATION|LTO|GOVERNMENT|ID|CARD|IDENTIFICATION)/i.test(
								potentialName
							)
						) {
							if (match[2]) {
								// Last name, First name format
								const fullName = `${match[2]} ${match[1]}`
								if (
									!/(?:DRIVER|LICENSE|REPUBLIC|PHILIPPINES|DEPARTMENT|TRANSPORTATION|LTO|GOVERNMENT|ID|CARD|IDENTIFICATION)/i.test(
										fullName
									)
								) {
									result.fullName = fullName
								}
							} else if (match[1]) {
								// Full name format - ensure it has at least 2 words and reasonable length
								const name = match[1].trim()
								const words = name.split(/\s+/)
								if (words.length >= 2 && name.length > 3) {
									// Check if it's mostly uppercase or has proper capitalization
									const upperCaseRatio =
										name.split("").filter((char) => char === char.toUpperCase())
											.length / name.length
									if (
										upperCaseRatio > 0.6 ||
										words.every(
											(word) =>
												word.length > 0 &&
												word.startsWith(word.charAt(0).toUpperCase())
										)
									) {
										result.fullName = name
									}
								}
							}
						}
						if (result.fullName) break
					}
				}
			}
		}
		if (result.fullName) break
	}

	// Extract Birthdate
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const nextLine = lines[i + 1]

		// Check if current line contains birthdate label
		if (
			line &&
			/(?:Date\s*of\s*Birth|Birth\s*(?:Date)?|DOB|Born|Birthday)[.\s:]*$/i.test(
				line
			)
		) {
			if (nextLine) {
				// Look for date pattern in next line - prioritize YYYY/MM/DD format
				const datePattern =
					/(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/
				const dateMatch = datePattern.exec(nextLine)
				if (dateMatch?.[1]) {
					result.birthdate = dateMatch[1]
					break
				}
			}
		}

		// Also check for same-line patterns as fallback
		if (line) {
			// Check for date with label on same line
			const sameLineDatePattern =
				/(?:Date\s*of\s*Birth|Birth\s*(?:Date)?|DOB|Born|Birthday)[.\s:]+(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i
			const sameLineDateMatch = sameLineDatePattern.exec(line)

			if (sameLineDateMatch?.[1]) {
				result.birthdate = sameLineDateMatch[1]
				break
			} else {
				// Try original patterns
				for (const pattern of patterns.birthdate) {
					const match = pattern.exec(line)
					if (match?.[1]) {
						result.birthdate = match[1]
						break
					}
				}
			}
		}
		if (result.birthdate) break
	}

	// Extract Address
	const addressLines: string[] = []
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const nextLine = lines[i + 1]

		// Check if current line contains address label
		if (line && /(?:Address|Residence|Home\s*Address)[:\s]*$/i.test(line)) {
			if (nextLine) {
				// Look for address pattern in next line (and potentially following lines)
				let addressText = nextLine
				// Check if the next line after that is also part of the address
				const thirdLine = lines[i + 2]
				if (
					thirdLine &&
					!/(?:Name|Id|Birth|DOB|License|Sex|Height|Weight|Eye|Hair)/.test(
						thirdLine
					)
				) {
					addressText += ", " + thirdLine
				}

				// Validate if it looks like an address
				if (addressText.length > 5) {
					const upperCaseRatio =
						addressText.split("").filter((char) => char === char.toUpperCase())
							.length / addressText.length
					if (
						upperCaseRatio > 0.5 ||
						/\d+.*(?:STREET|ST|AVENUE|AVE|ROAD|RD|BOULEVARD|BLVD|CITY|PROVINCE|STATE)/i.test(
							addressText
						)
					) {
						addressLines.push(addressText.trim())
					}
				}
			}
		}

		// Also check for same-line patterns as fallback
		if (line) {
			for (const pattern of patterns.address) {
				const match = line.match(pattern)
				if (match?.[1]) {
					const address = match[1].trim()
					// Ensure the address is primarily in uppercase
					if (
						address.length > 5 &&
						address.split("").filter((char) => char === char.toUpperCase())
							.length >
							address.length * 0.7
					) {
						addressLines.push(address)
					}
				}
			}
			// Also look for standalone lines that are all caps and contain address keywords
			if (
				/^[A-Z0-9][A-Z0-9\s,.-]*(?:STREET|ST|AVENUE|AVE|ROAD|RD|BOULEVARD|BLVD|CITY|PROVINCE|STATE)[A-Z0-9\s,.-]*$/.test(
					line
				)
			) {
				if (!addressLines.includes(line)) {
					addressLines.push(line)
				}
			}
		}
	}
	if (addressLines.length > 0) {
		// Remove duplicates and clean up
		const uniqueAddresses = [...new Set(addressLines)]
		result.address = uniqueAddresses.join(", ")
	}

	// If we still have very few lines, try direct pattern matching on the full text
	if (lines.length <= 3) {
		// Direct extraction from the full text for single-line OCR results

		// Extract License Number directly
		if (!result.idNumber) {
			const licenseMatch = /([A-Z]\d{2}-\d{2}-\d{6})/.exec(text)
			if (licenseMatch?.[1]) {
				result.idNumber = licenseMatch[1]
			}
		}

		// Extract name directly (look for pattern like "DELA CRUZ, JUAN PEDRO GARCIA")
		if (!result.fullName) {
			// First try to find a name with comma format (Last, First Middle) - prioritize this format
			const nameMatch = /([A-Z]+(?:\s+[A-Z]+)*,\s*[A-Z]+(?:\s+[A-Z]+)+)/.exec(
				text
			)
			if (nameMatch?.[1]) {
				const name = nameMatch[1].trim()
				console.log(`Direct pattern found name: "${name}"`)
				// Exclude ID titles and validate proper name format
				if (
					!/(?:DRIVER|LICENSE|REPUBLIC|PHILIPPINES|DEPARTMENT|TRANSPORTATION|LTO|GOVERNMENT|ID|CARD|IDENTIFICATION)/i.test(
						name
					) &&
					name.length > 10 && // Ensure reasonable length
					name.includes(",") && // Must have comma for Philippine format
					!/(?:Signature|Licensee|Assistant|ANA|WANE)/i.test(name)
				) {
					// Exclude signature artifacts
					result.fullName = name
				}
			} else {
				// Try to find any sequence of all-caps words that looks like a name, but exclude ID titles
				const lines = text.split(/\s+/)

				for (let i = 0; i < lines.length - 1; i++) {
					const currentWord = lines[i]
					const nextWord = lines[i + 1]

					// Look for sequences of uppercase words that could be names
					if (
						currentWord &&
						nextWord &&
						/^[A-Z]{2,}$/.test(currentWord) &&
						/^[A-Z]{2,}$/.test(nextWord)
					) {
						// Check if this sequence doesn't contain ID title keywords
						const wordSequence = lines
							.slice(i, Math.min(i + 4, lines.length))
							.join(" ")
						if (
							!/(?:DRIVER|LICENSE|REPUBLIC|PHILIPPINES|DEPARTMENT|TRANSPORTATION|LTO|GOVERNMENT|ID|CARD|IDENTIFICATION)/i.test(
								wordSequence
							)
						) {
							// Build potential name from consecutive uppercase words
							const nameWords = []
							for (let j = i; j < lines.length && j < i + 4; j++) {
								const word = lines[j]
								if (word && /^[A-Z]{2,}$/.test(word)) {
									nameWords.push(word)
								} else {
									break
								}
							}

							if (nameWords.length >= 2 && nameWords.length <= 4) {
								const potentialName = nameWords.join(" ")
								// Additional validation: check if it has typical name characteristics
								if (potentialName.length > 6 && potentialName.length < 50) {
									result.fullName = potentialName
									break
								}
							}
						}
					}
				}
			}
		}

		// Extract birthdate directly
		if (!result.birthdate) {
			const dateMatch = /(\d{4}\/\d{1,2}\/\d{1,2})/.exec(text)
			if (dateMatch?.[1]) {
				result.birthdate = dateMatch[1]
			}
		}

		// Extract address directly
		if (!result.address) {
			const addressMatch =
				/(UNIT\/HOUSE\s+NO\.\s+BUILDING,\s+STREET\s+NAME,\s*BARANGAY,\s+CITY\/MUNICIPALITY)/.exec(
					text
				)
			if (addressMatch?.[1]) {
				result.address = addressMatch[1].trim()
			}
		}
	}

	return result
}

export const ocrRouter = createTRPCRouter({
	extractIdInfo: publicProcedure
		.input(
			z.object({
				imageBase64: z.string().min(1, "Image data is required"),
				language: z.string().default("eng")
			})
		)
		.output(ocrResultSchema)
		.mutation(async ({ input }) => {
			try {
				console.log("Starting OCR processing...")

				// Create a Tesseract worker with default settings
				const worker = await createWorker("eng")

				console.log("Worker created successfully")

				// Set parameters for better ID recognition
				await worker.setParameters({
					tessedit_char_whitelist:
						"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-/:., "
				})

				// Perform OCR
				const { data } = await worker.recognize(input.imageBase64)

				console.log("OCR Raw Text:", data.text)
				console.log("OCR Confidence:", data.confidence)

				// Extract structured information from the OCR text
				const extractedInfo = extractIdInfo(data.text)

				// Clean up
				await worker.terminate()

				return {
					success: true,
					data: {
						...extractedInfo,
						confidence: Math.round(data.confidence ?? 0)
					}
				}
			} catch (error) {
				console.error("OCR Error:", error)

				return {
					success: false,
					error:
						error instanceof Error ? error.message : "OCR processing failed"
				}
			}
		})
})
