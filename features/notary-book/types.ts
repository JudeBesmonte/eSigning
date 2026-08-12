export type DocumentStatus = "signed" | "pending" | "declined"

export enum RecipientStatus {
	PENDING = "PENDING",
	PUBLISHED = "PUBLISHED",
	VIEWED = "VIEWED",
	SIGNED = "SIGNED",
	DECLINED = "DECLINED",
	EXPIRED = "EXPIRED",
	APPROVED = "APPROVED",
	REJECTED = "REJECTED"
}

export const DocumentStatus = {
	DRAFT: "DRAFT",
	PENDING: "PENDING",
	IN_PROGRESS: "IN_PROGRESS",
	COMPLETED: "COMPLETED",
	ARCHIVED: "ARCHIVED",
	REJECTED: "REJECTED"
} as const

export enum RecipientRole {
	SIGNER = "SIGNER",
	VIEWER = "VIEWER",
	APPROVER = "APPROVER",
	CC = "CC"
}

export interface Recipient {
	id: string
	role: RecipientRole
	status: RecipientStatus
	email?: string | null
	name?: string | null
	user?: {
		id: string
		name: string | null
		email: string | null
	} | null
}

export interface Signer {
	id: string
	name: string
	email: string
	status: RecipientStatus
	role: RecipientRole
}

export interface Document {
	id: string
	name: string
	status: DocumentStatus // This is now properly typed
	date: string
	size: number
	notarized: boolean
	type?: string
	signers?: Signer[]
	description?: string
	createdAt?: string | Date
	updatedAt?: string | Date
	recipients?: Array<{
		id: string
		role: RecipientRole
		status: RecipientStatus
		user?: {
			id: string
			name: string | null
			email: string | null
		}
	}>
}

export interface Envelope {
	id: string
	title: string
	status: string
	description?: string
	createdAt: Date
	updatedAt: Date
	documentCount?: number
	signedCount?: number
	documents?: Document[]
	recipients?: Array<{
		id: string
		role: RecipientRole
		status: RecipientStatus
		email?: string | null
		user?: {
			id: string
			name: string | null
			email: string | null
		}
	}>
}

export interface Month {
	id: string
	name: string
	year: number
	month: number
	envelopeCount: number
	envelopes?: Envelope[]
}
