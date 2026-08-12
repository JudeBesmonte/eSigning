/**
 * Status Flow Analysis for Quanby-Sign
 *
 * ENVELOPE STATUS FLOW:
 * DRAFT → PUBLISHED → COMPLETED/PENDING_APPROVAL → APPROVED/REJECTED
 *
 * RECIPIENT STATUS FLOW:
 * PENDING → PUBLISHED → VIEWED → SIGNED/DECLINED → APPROVED/REJECTED (for approvers)
 *
 * DOCUMENT STATUS FLOW:
 * PENDING → PROCESSING → READY → SIGNED → COMPLETED/ERROR
 *
 * RECOMMENDATIONS:
 *
 * 1. PUBLISHED status in RecipientStatus:
 *    - Currently: PENDING → PUBLISHED → VIEWED → SIGNED
 *    - Recommendation: Consider if PUBLISHED is necessary, or use audit events to track notifications
 *    - PUBLISHED could mean "notification sent to recipient"
 *    - Alternative: PENDING → NOTIFIED → VIEWED → SIGNED
 *
 * 2. Approver workflow:
 *    - Envelope-level approver: PENDING → VIEWED → APPROVED/REJECTED
 *    - This affects envelope status: DRAFT → PUBLISHED → PENDING_APPROVAL → APPROVED/REJECTED
 *
 * 3. Document-level recipients:
 *    - PENDING → PUBLISHED → VIEWED → SIGNED
 *    - Documents themselves: PENDING → READY → SIGNED → COMPLETED
 *
 * 4. Proposed improved flow:
 *    Envelope: DRAFT → PUBLISHED → [COMPLETED/PENDING_APPROVAL] → APPROVED/REJECTED
 *    Recipients: PENDING → NOTIFIED → VIEWED → SIGNED/DECLINED → [APPROVED/REJECTED for approvers]
 *    Documents: PENDING → READY → SIGNED → COMPLETED
 *
 * The current schema supports this workflow well. The main question is whether
 * PUBLISHED status for recipients is necessary or should be replaced with audit tracking.
 */

export const STATUS_FLOW_ANALYSIS = {
	envelope: {
		current: [
			"DRAFT",
			"PUBLISHED",
			"COMPLETED",
			"PENDING_APPROVAL",
			"APPROVED",
			"REJECTED"
		],
		workflow:
			"DRAFT → PUBLISHED → COMPLETED/PENDING_APPROVAL → APPROVED/REJECTED"
	},
	recipient: {
		current: [
			"PENDING",
			"PUBLISHED",
			"VIEWED",
			"SIGNED",
			"DECLINED",
			"EXPIRED",
			"APPROVED",
			"REJECTED"
		],
		workflow:
			"PENDING → PUBLISHED → VIEWED → SIGNED/DECLINED → APPROVED/REJECTED (approvers)",
		note: "PUBLISHED might be redundant - consider using audit events for notification tracking"
	},
	document: {
		current: ["PENDING", "PROCESSING", "READY", "SIGNED", "COMPLETED", "ERROR"],
		workflow: "PENDING → PROCESSING → READY → SIGNED → COMPLETED/ERROR"
	}
} as const

export type EnvelopeStatusFlow =
	(typeof STATUS_FLOW_ANALYSIS.envelope.current)[number]
export type RecipientStatusFlow =
	(typeof STATUS_FLOW_ANALYSIS.recipient.current)[number]
export type DocumentStatusFlow =
	(typeof STATUS_FLOW_ANALYSIS.document.current)[number]
