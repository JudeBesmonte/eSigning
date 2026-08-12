// Types for the envelope data structure
export interface User {
	id: string
	name: string | null
	email: string | null
	image: string | null
}

export interface Document {
	id: string
	name: string
	type: string
	size: number
	path: string
	createdAt: Date
}

export interface Recipient {
	id: string
	role: string
	status: string
	user: User | null
}

export interface Envelope {
	id: string
	title: string
	description: string | null
	status:
		| "DRAFT"
		| "PUBLISHED"
		| "COMPLETED"
		| "CANCELLED"
		| "PENDING"
		| "PENDING_APPROVAL"
		| "IN_PROGRESS"
		| "SIGNED"
		| "DECLINED"
		| "EXPIRED"
		| "APPROVED"
		| "REJECTED"
	createdAt: Date
	updatedAt: Date
	userId: string
	documents: Document[]
	recipient: Recipient[]
}

export type EnvelopeStatus =
	| "DRAFT"
	| "PUBLISHED"
	| "COMPLETED"
	| "CANCELLED"
	| "EXPIRED"
	| "PENDING_APPROVAL"
	| "APPROVED"
	| "REJECTED"

export const statusVariantMap = {
	DRAFT: "outline" as const,
	PUBLISHED: "default" as const,
	COMPLETED: "default" as const,
	CANCELLED: "destructive" as const,
	EXPIRED: "destructive" as const,
	PENDING_APPROVAL: "secondary" as const,
	APPROVED: "default" as const,
	REJECTED: "destructive" as const
} as const

export interface EnvelopeTableProps {
	envelopes: Envelope[]
	isLoading?: boolean
}
