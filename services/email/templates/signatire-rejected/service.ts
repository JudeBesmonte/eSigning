import { render } from "@react-email/render"

import { emailConfig } from "../../config"
import { SignatureRejectedEmail } from "./components/signature-rejected-email"

export interface SignatureRejectedParams {
	recipient: { email: string; name?: string | null }
	rejector: { name?: string | null; email?: string | null }
	envelope: { id: string; title: string; description?: string | null }
	documents: { id: string; name: string }[]
	rejectionDate: Date
	rejectionReason?: string | null
	comments?: string | null
}

/**
 * Generate email subject for signature rejection notification
 */
export function generateSubject(envelopeTitle: string): string {
	return `❌ Envelope Rejected: ${envelopeTitle}`
}

/**
 * Generate plain text email content
 */
export function generateTextContent({
	recipient,
	rejector,
	envelope,
	documents,
	rejectionDate,
	rejectionReason,
	comments
}: SignatureRejectedParams): string {
	const dashboardUrl = `${emailConfig.baseUrl}/dashboard`
	const envelopeUrl = `${emailConfig.baseUrl}/dashboard/envelope/${envelope.id}`

	return `
Hello ${recipient.name ?? recipient.email},

We're sorry to inform you that your envelope "${envelope.title}" has been rejected.

${envelope.description ? `Description: ${envelope.description}` : ""}

Rejection Details:
- Rejected by: ${rejector.name ?? rejector.email ?? "System Reviewer"}
- Rejection date: ${rejectionDate.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	})}
${rejectionReason ? `- Reason: ${rejectionReason}` : ""}
${comments ? `- Comments: ${comments}` : ""}

This envelope contained ${documents.length} document${documents.length !== 1 ? "s" : ""}:
${documents.map((doc) => `- ${doc.name}`).join("\n")}

You can review the rejection details and make necessary changes by visiting:
${envelopeUrl}

Or access your dashboard at:
${dashboardUrl}

You may revise and resubmit the envelope once the issues have been addressed.

This is an automated email from Quanby Sign. Please do not reply to this email.
	`.trim()
}

/**
 * Render HTML email content using React Email template
 */
export async function renderHtmlContent(
	params: SignatureRejectedParams
): Promise<string> {
	return await render(SignatureRejectedEmail(params))
}

/**
 * Prepare complete email data for signature rejection notification
 */
export async function prepareSignatureRejectedEmail(
	params: SignatureRejectedParams
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
