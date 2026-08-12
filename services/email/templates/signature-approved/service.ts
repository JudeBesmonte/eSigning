import { render } from "@react-email/render"

import { emailConfig } from "../../config"
import { SignatureApprovedEmail } from "./components/signature-approved-email"

export interface SignatureApprovedParams {
	recipient: { email: string; name?: string | null }
	approver: { name?: string | null; email?: string | null }
	envelope: { id: string; title: string; description?: string | null }
	documents: { id: string; name: string }[]
	approvalDate: Date
}

/**
 * Generate email subject for signature approval notification
 */
export function generateSubject(envelopeTitle: string): string {
	return `✅ Envelope Approved: ${envelopeTitle}`
}

/**
 * Generate plain text email content
 */
export function generateTextContent({
	recipient,
	approver,
	envelope,
	documents,
	approvalDate
}: SignatureApprovedParams): string {
	const dashboardUrl = `${emailConfig.baseUrl}/dashboard`
	const envelopeUrl = `${emailConfig.baseUrl}/dashboard/envelope/${envelope.id}`

	return `
Hello ${recipient.name ?? recipient.email},

Great news! Your envelope "${envelope.title}" has been approved.

${envelope.description ? `Description: ${envelope.description}` : ""}

Approval Details:
- Approved by: ${approver.name ?? approver.email ?? "System Approver"}
- Approval date: ${approvalDate.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	})}

This envelope contained ${documents.length} document${documents.length !== 1 ? "s" : ""}:
${documents.map((doc) => `- ${doc.name}`).join("\n")}

You can view the approved envelope and its details by visiting:
${envelopeUrl}

Or access your dashboard at:
${dashboardUrl}

Your envelope is now ready for the next steps in the signing process.

This is an automated email from Quanby Sign. Please do not reply to this email.
	`.trim()
}

/**
 * Render HTML email content using React Email template
 */
export async function renderHtmlContent(
	params: SignatureApprovedParams
): Promise<string> {
	return await render(SignatureApprovedEmail(params))
}

/**
 * Prepare complete email data for signature approval notification
 */
export async function prepareSignatureApprovedEmail(
	params: SignatureApprovedParams
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
