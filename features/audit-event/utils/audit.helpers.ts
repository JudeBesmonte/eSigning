import type { AuditEventType } from "@prisma/client"

import { trpc } from "@/services/trpc/client"

type AuditEventMetadata = Record<
	string,
	string | number | boolean | null | undefined
>

interface CreateAuditEventParams {
	eventType: AuditEventType
	description: string
	metadata?: AuditEventMetadata
	envelopeId?: string
	documentId?: string
	recipientId?: string
}

// Optimized audit event helpers with grouped functionality
export const useAuditEventHelpers = () => {
	const createEvent = trpc.auditEvent.create.useMutation()

	// Helper to create an event with common parameters
	const logEvent = (params: CreateAuditEventParams) =>
		createEvent.mutate(params)

	// Envelope-related events
	const envelope = {
		created: (envelopeId: string, title: string) =>
			logEvent({
				eventType: "ENVELOPE_CREATED",
				description: `Envelope "${title}" was created`,
				envelopeId
			}),

		published: (envelopeId: string, title: string) =>
			logEvent({
				eventType: "ENVELOPE_PUBLISHED",
				description: `Envelope "${title}" was published`,
				envelopeId
			}),

		viewed: (envelopeId: string, title: string, viewerEmail?: string) =>
			logEvent({
				eventType: "ENVELOPE_VIEWED",
				description: `Envelope "${title}" was viewed${viewerEmail ? ` by ${viewerEmail}` : ""}`,
				envelopeId,
				metadata: viewerEmail ? { viewerEmail } : undefined
			}),

		completed: (envelopeId: string, title: string) =>
			logEvent({
				eventType: "ENVELOPE_COMPLETED",
				description: `Envelope "${title}" was completed`,
				envelopeId
			}),

		cancelled: (envelopeId: string, title: string, reason?: string) =>
			logEvent({
				eventType: "ENVELOPE_CANCELLED",
				description: `Envelope "${title}" was cancelled${reason ? `: ${reason}` : ""}`,
				envelopeId,
				metadata: reason ? { reason } : undefined
			}),

		pendingApproval: (envelopeId: string, title: string) =>
			logEvent({
				eventType: "ENVELOPE_PENDING_APPROVAL",
				description: `Envelope "${title}" is pending admin approval`,
				envelopeId
			}),

		approved: (envelopeId: string, title: string, adminEmail?: string) =>
			logEvent({
				eventType: "ENVELOPE_APPROVED",
				description: `Envelope "${title}" was approved${adminEmail ? ` by ${adminEmail}` : ""}`,
				envelopeId,
				metadata: adminEmail ? { adminEmail } : undefined
			}),

		rejected: (
			envelopeId: string,
			title: string,
			reason?: string,
			adminEmail?: string
		) =>
			logEvent({
				eventType: "ENVELOPE_REJECTED",
				description: `Envelope "${title}" was rejected${adminEmail ? ` by ${adminEmail}` : ""}${reason ? `: ${reason}` : ""}`,
				envelopeId,
				metadata: { reason, adminEmail }
			})
	}

	// Document-related events
	const document = {
		uploaded: (documentId: string, name: string, envelopeId?: string) =>
			logEvent({
				eventType: "DOCUMENT_UPLOADED",
				description: `Document "${name}" was uploaded`,
				documentId,
				envelopeId
			}),

		viewed: (
			documentId: string,
			name: string,
			viewerEmail?: string,
			envelopeId?: string
		) =>
			logEvent({
				eventType: "DOCUMENT_VIEWED",
				description: `Document "${name}" was viewed${viewerEmail ? ` by ${viewerEmail}` : ""}`,
				documentId,
				envelopeId,
				metadata: viewerEmail ? { viewerEmail } : undefined
			}),

		signed: (
			documentId: string,
			name: string,
			signerEmail: string,
			envelopeId?: string,
			recipientId?: string
		) =>
			logEvent({
				eventType: "DOCUMENT_SIGNED",
				description: `Document "${name}" was signed by ${signerEmail}`,
				documentId,
				envelopeId,
				recipientId,
				metadata: { signerEmail }
			})
	}

	// Recipient-related events
	const recipient = {
		added: (
			recipientId: string,
			email: string,
			name: string,
			envelopeId?: string,
			documentId?: string
		) =>
			logEvent({
				eventType: "RECIPIENT_ADDED",
				description: `Recipient ${name} (${email}) was added`,
				recipientId,
				envelopeId,
				documentId,
				metadata: { recipientEmail: email, recipientName: name }
			}),

		removed: (
			recipientId: string,
			email: string,
			name: string,
			envelopeId?: string,
			documentId?: string
		) =>
			logEvent({
				eventType: "RECIPIENT_REMOVED",
				description: `Recipient ${name} (${email}) was removed`,
				recipientId,
				envelopeId,
				documentId,
				metadata: { recipientEmail: email, recipientName: name }
			}),

		viewed: (
			recipientId: string,
			email: string,
			name: string,
			envelopeId?: string,
			documentId?: string
		) =>
			logEvent({
				eventType: "RECIPIENT_VIEWED",
				description: `${name} (${email}) viewed the document`,
				recipientId,
				envelopeId,
				documentId,
				metadata: { recipientEmail: email, recipientName: name }
			}),

		signed: (
			recipientId: string,
			email: string,
			name: string,
			envelopeId?: string,
			documentId?: string
		) =>
			logEvent({
				eventType: "RECIPIENT_SIGNED",
				description: `${name} (${email}) signed the document`,
				recipientId,
				envelopeId,
				documentId,
				metadata: { recipientEmail: email, recipientName: name }
			}),

		declined: (
			recipientId: string,
			email: string,
			name: string,
			reason?: string,
			envelopeId?: string,
			documentId?: string
		) =>
			logEvent({
				eventType: "RECIPIENT_DECLINED",
				description: `${name} (${email}) declined to sign${reason ? `: ${reason}` : ""}`,
				recipientId,
				envelopeId,
				documentId,
				metadata: { recipientEmail: email, recipientName: name, reason }
			})
	}

	// System events
	const system = {
		reminderSent: (
			recipientEmail: string,
			envelopeTitle: string,
			envelopeId?: string,
			recipientId?: string
		) =>
			logEvent({
				eventType: "REMINDER_SENT",
				description: `Reminder sent to ${recipientEmail} for envelope "${envelopeTitle}"`,
				envelopeId,
				recipientId,
				metadata: { recipientEmail, envelopeTitle }
			}),

		settingsUpdated: (
			settingType: string,
			oldValue?: string | number | boolean,
			newValue?: string | number | boolean,
			envelopeId?: string
		) =>
			logEvent({
				eventType: "SETTINGS_UPDATED",
				description: `${settingType} settings were updated`,
				envelopeId,
				metadata: { settingType, oldValue, newValue }
			})
	}

	return {
		envelope,
		document,
		recipient,
		system,
		// Direct access to the mutation for custom events
		createCustomEvent: logEvent
	}
}
