import type { RecipientRole } from "@prisma/client"
import { render } from "@react-email/render"

import { emailConfig } from "../../config"
import { RecipientAssignmentEmail } from "./components/assign-signer-email"

export interface RecipientAssignmentParams {
	recipient: { email: string; name?: string | null }
	sender: { name?: string | null; email?: string | null }
	envelope: { id: string; title: string; description?: string | null }
	documents: { id: string; name: string }[]
	role: RecipientRole
}

/**
 * Generate email subject based on recipient role
 */
export function generateSubject(
	role: RecipientRole,
	envelopeTitle: string
): string {
	switch (role) {
		case "SIGNER":
			return `Signature Required: ${envelopeTitle}`
		case "APPROVER":
			return `Approval Required: ${envelopeTitle}`
		case "VIEWER":
			return `Document Access: ${envelopeTitle}`
		case "CC":
			return `Document Notification: ${envelopeTitle}`
		default:
			return `Document Request: ${envelopeTitle}`
	}
}

/**
 * Generate plain text email content
 */
export function generateTextContent({
	recipient,
	sender,
	envelope,
	documents,
	role
}: RecipientAssignmentParams): string {
	const actionUrl = `${emailConfig.baseUrl}/dashboard/to-sign?envelope=${envelope.id}`

	return `
Hello ${recipient.name ?? recipient.email},

${sender.name ?? sender.email ?? "Someone"} has assigned you as a ${role.toLowerCase()} for the envelope: "${envelope.title}"

${envelope.description ? `Description: ${envelope.description}` : ""}

This envelope contains ${documents.length} document${documents.length !== 1 ? "s" : ""}.

Please visit the following link to ${role === "SIGNER" ? "sign" : role === "APPROVER" ? "approve" : "review"} the documents:
${actionUrl}

If you have any questions about this request, please contact ${sender.name ?? sender.email} directly or reach out to our support team.

This is an automated email from Quanby Sign. Please do not reply to this email.
	`.trim()
}

/**
 * Render HTML email content using React Email template
 */
export async function renderHtmlContent(
	params: RecipientAssignmentParams
): Promise<string> {
	return await render(RecipientAssignmentEmail(params))
}

/**
 * Prepare complete email data for recipient assignment
 */
export async function prepareRecipientAssignmentEmail(
	params: RecipientAssignmentParams
) {
	const subject = generateSubject(params.role, params.envelope.title)
	const html = await renderHtmlContent(params)
	const text = generateTextContent(params)

	return {
		to: params.recipient.email,
		subject,
		html,
		text
	}
}
