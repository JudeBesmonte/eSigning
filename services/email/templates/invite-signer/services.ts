import { render } from "@react-email/render"

import {
  InviteSignerEmail,
  type InviteSignerEmailProps
} from "./components/invite-signer-email"

export interface InviteSignerParams {
  recipient: { email: string; name?: string | null }
  sender: { name?: string | null; email?: string | null }
  envelope: { id: string; title: string; description?: string | null }
  document?: { id: string; name: string } | null
  inviteUrl: string
}

export function generateSubject(envelopeTitle: string): string {
  return `🔐 Your signature is requested: ${envelopeTitle}`
}

export function generateTextContent({
  recipient,
  sender,
  envelope,
  document,
  inviteUrl
}: InviteSignerParams): string {
  return `
🔐 SIGNATURE REQUIRED

Hello ${recipient.name ?? recipient.email},

${sender.name ?? sender.email} has requested your digital signature on the following document:

📄 ${envelope.title}${document ? `\n   ${document.name}` : ""}
${envelope.description ? `\nDescription: ${envelope.description}` : ""}

REVIEW & SIGN: ${inviteUrl}

🛡️ SECURITY & TRUST
• Your signature is protected with bank-level security
• This invitation is sent from a verified Quanby Sign account
• All documents are encrypted and audit-ready
• Only sign if you recognize the sender and expected this request

Questions? Contact ${sender.name ?? sender.email} directly or reach our support team at support@quanbysign.com

Best regards,
The Quanby Sign Team

---
This is an automated message from Quanby Sign. Please do not reply to this email.
	`.trim()
}

export async function renderHtmlContent(
  params: InviteSignerParams
): Promise<string> {
  const props: InviteSignerEmailProps = {
    recipient: params.recipient,
    sender: params.sender,
    envelope: params.envelope,
    document: params.document ?? null,
    inviteUrl: params.inviteUrl
  }
  return await render(InviteSignerEmail(props))
}

export async function prepareInviteSignerEmail(params: InviteSignerParams) {
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
