"use server"

import type { RecipientRole } from "@prisma/client"

import { emailService } from "@/services/email/service"

export interface NotifyApproverParams {
	recipient: {
		email: string
		name?: string | null
	}
	sender: {
		name?: string | null
		email?: string | null
	}
	envelope: {
		id: string
		title: string
		description?: string | null
	}
	documents: {
		id: string
		name: string
	}[]
	role: RecipientRole
}

/**
 * Send email notification to approver when they are assigned to documents
 */
export async function notifyApprover(params: NotifyApproverParams) {
	try {
		console.log(
			`📧 Sending approver assignment notification to ${params.recipient.email}`
		)

		const result = await emailService.sendApproverAssignmentNotification(params)

		console.log(`✅ Approver assignment notification sent successfully`)
		return result
	} catch (error) {
		console.error(`❌ Failed to send approver assignment notification:`, error)
		throw new Error(
			`Failed to send approver assignment notification: ${error instanceof Error ? error.message : "Unknown error"}`
		)
	}
}
