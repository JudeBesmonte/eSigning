import type { LegalRegistration, User } from "@prisma/client"

// Database types
export type LegalRegistrationWithApplicant = LegalRegistration & {
	applicant: Pick<User, "name" | "email">
}

export type LegalRegistrationRecord = LegalRegistration

// Update data types
export interface LegalRegistrationUpdateData {
	citizenship?: string
	dateOfBirth?: Date
	residentialAddress?: string
	workOrBusinessAddress?: string
	telephoneNumber?: string | null
	mobileNumber?: string
	emailAddress?: string
	professionalTaxReceiptNumber?: string
	rollOfAttorneysNumber?: string
	ibpMembershipNumber?: string
	mcleComplianceNumber?: string
	ulasComplianceNumber?: string
	obcCertificationUrl?: string
	ibpCertificationUrl?: string
	passportPhotoUrl?: string
	paymentProofUrl?: string
	enfProviderCertificationUrl?: string
	undertakingElectronicNotarialActs?: boolean
	undertakingDataSharingGuidelines?: boolean
}

export interface LegalRegistrationStatusUpdateData {
	status: "UNDER_REVIEW" | "APPROVED" | "REJECTED"
	reviewedBy: string
	reviewedAt: Date
	remarks?: string
	approvedAt?: Date
	rejectedAt?: Date
}

export interface LegalRegistrationSubmissionData {
	status: "SUBMITTED"
	electronicSignatureApplied: boolean
	electronicSignatureUrl: string
	submittedAt: Date
}

// Query result types
export interface LegalRegistrationListResult {
	applications: LegalRegistrationWithApplicant[]
	pagination: {
		page: number
		limit: number
		total: number
		pages: number
	}
}
