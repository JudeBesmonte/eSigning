import { render } from "@react-email/render"

import { emailConfig } from "../../config"
import { SignatureCompleteEmail } from "./components/signature-complete-email"

export interface SignatureCompleteParams {
	recipient: { email: string; name?: string | null }
	envelope: { id: string; title: string; description?: string | null }
	documents: { id: string; name: string }[]
	completionDate: Date
	signers: { name?: string | null; email: string }[]
}

/**
 * Generate email subject for signature completion notification
 */
export function generateSubject(envelopeTitle: string): string {
	return `✅ Signing Complete: ${envelopeTitle}`
}

/**
 * Generate plain text email content
 */
export function generateTextContent({
	recipient,
	envelope,
	documents,
	completionDate,
	signers
}: SignatureCompleteParams): string {
	const dashboardUrl = `${emailConfig.baseUrl}/dashboard`
	const envelopeUrl = `${emailConfig.baseUrl}/dashboard/envelope/${envelope.id}`

	return `
Hello ${recipient.name ?? recipient.email},

Excellent news! All signatures have been completed for your envelope "${envelope.title}".

${envelope.description ? `Description: ${envelope.description}` : ""}

Completion Details:
- Completed on: ${completionDate.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	})}
- Total signers: ${signers.length}

Signed documents (${documents.length}):
${documents.map((doc) => `- ${doc.name}`).join("\n")}

Signers who completed the process:
${signers.map((signer) => `- ${signer.name ?? signer.email}`).join("\n")}

You can download the final signed documents and view the complete envelope by visiting:
${envelopeUrl}

Or access your dashboard at:
${dashboardUrl}

All parties now have access to the completed, legally binding documents.

This is an automated email from Quanby Sign. Please do not reply to this email.
	`.trim()
}

/**
 * Render HTML email content using React Email template
 */
export async function renderHtmlContent(
	params: SignatureCompleteParams
): Promise<string> {
	return await render(SignatureCompleteEmail(params))
}

/**
 * Prepare complete email data for signature completion notification
 */
export async function prepareSignatureCompleteEmail(
	params: SignatureCompleteParams
) {
	const subject = generateSubject(params.envelope.title)
	const html = await renderHtmlContent(params)
	const text = generateTextContent(params)

	return {
		to: params.recipient.email,
		subject,
		html,
		text
	}
}
