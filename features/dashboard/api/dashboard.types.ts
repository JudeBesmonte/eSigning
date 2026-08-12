export interface UserDocument {
	id: string
	name: string
	type: string
	status: string
	signers: number
	completed: number
	createdDate: string
	dueDate: string
	size: string
	sender: string
	userRole: string
	userStatus: string
	envelopeId: string
	priority: "high" | "medium" | "low"
}

export interface UserStats {
	documentsToSign: number
	completedDocuments: number
	verificationStatus: string
}

export interface PendingDocument {
	id: string
	name: string
	sender: string
	dueDate: string
	priority: "high" | "medium" | "low"
	envelopeId: string
}

export interface RecentActivity {
	id: string
	type: string
	description: string
	timestamp: string
	documentName: string
}
