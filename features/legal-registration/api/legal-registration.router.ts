import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { db } from "@/services/prisma/db"
import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

import {
	applicationResponseSchema,
	legalRegistrationFormSchema,
	updateApplicationStatusSchema
} from "./legal-registration.schemas"

export const legalRegistrationRouter = createTRPCRouter({
	// Create a new legal registration application
	create: protectedProcedure
		.input(legalRegistrationFormSchema)
		.output(
			z.object({
				id: z.string(),
				message: z.string()
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				// Check if user already has an application
				const existingApplication = await db.legalRegistration.findUnique({
					where: { applicantId: ctx.session.user.id }
				})

				if (existingApplication) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "You already have a legal registration application"
					})
				}

				// Create new application
				const application = await db.legalRegistration.create({
					data: {
						applicantId: ctx.session.user.id,

						// Personal Qualifications
						citizenship: input.personalQualifications.citizenship,
						dateOfBirth: new Date(input.personalQualifications.dateOfBirth),
						residentialAddress: input.personalQualifications.residentialAddress,
						workOrBusinessAddress:
							input.personalQualifications.workOrBusinessAddress,
						telephoneNumber: input.personalQualifications.telephoneNumber,
						mobileNumber: input.personalQualifications.mobileNumber,
						emailAddress: input.personalQualifications.emailAddress,
						professionalTaxReceiptNumber:
							input.personalQualifications.professionalTaxReceiptNumber,
						rollOfAttorneysNumber:
							input.personalQualifications.rollOfAttorneysNumber,
						ibpMembershipNumber:
							input.personalQualifications.ibpMembershipNumber,
						mcleComplianceNumber:
							input.personalQualifications.mcleComplianceNumber,
						ulasComplianceNumber:
							input.personalQualifications.ulasComplianceNumber,

						// Document URLs
						obcCertificationUrl: input.obcCertification?.fileUrl ?? "",
						ibpCertificationUrl: input.ibpCertification?.fileUrl ?? "",
						passportPhotoUrl: input.passportPhoto?.fileUrl ?? "",
						paymentProofUrl: input.paymentProof?.fileUrl ?? "",
						enfProviderCertificationUrl:
							input.enfProviderCertification?.fileUrl ?? "",

						// Undertakings
						undertakingElectronicNotarialActs:
							input.undertakingElectronicNotarialActs,
						undertakingDataSharingGuidelines:
							input.undertakingDataSharingGuidelines,

						// Status
						status: "DRAFT"
					}
				})

				return {
					id: application.id,
					message: "Legal registration application created successfully"
				}
			} catch (error) {
				console.error("Legal registration creation error:", error)

				if (error instanceof TRPCError) {
					throw error
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create legal registration application"
				})
			}
		}),

	// Submit application for review
	submit: protectedProcedure
		.input(
			z.object({
				applicationId: z.string(),
				electronicSignatureUrl: z.string().url()
			})
		)
		.output(z.object({ message: z.string() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const application = await db.legalRegistration.findFirst({
					where: {
						id: input.applicationId,
						applicantId: ctx.session.user.id
					}
				})

				if (!application) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Legal registration application not found"
					})
				}

				if (application.status !== "DRAFT") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Application has already been submitted"
					})
				}

				await db.legalRegistration.update({
					where: { id: input.applicationId },
					data: {
						status: "SUBMITTED",
						electronicSignatureApplied: true,
						electronicSignatureUrl: input.electronicSignatureUrl,
						submittedAt: new Date()
					}
				})

				return { message: "Application submitted successfully for review" }
			} catch (error) {
				console.error("Legal registration submission error:", error)

				if (error instanceof TRPCError) {
					throw error
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to submit legal registration application"
				})
			}
		}),

	// Get user's application
	getMyApplication: protectedProcedure
		.output(applicationResponseSchema.nullable())
		.query(async ({ ctx }) => {
			try {
				const application = await db.legalRegistration.findUnique({
					where: { applicantId: ctx.session.user.id },
					include: {
						applicant: {
							select: {
								name: true,
								email: true
							}
						}
					}
				})

				if (!application) {
					return null
				}

				return {
					id: application.id,
					applicantId: application.applicantId,
					status: String(application.status),
					submittedAt: application.submittedAt,
					reviewedAt: application.reviewedAt,
					approvedAt: application.approvedAt,
					rejectedAt: application.rejectedAt,
					remarks: application.remarks,
					personalQualifications: {
						citizenship: application.citizenship,
						dateOfBirth: application.dateOfBirth.toISOString().slice(0, 10),
						residentialAddress: application.residentialAddress,
						workOrBusinessAddress: application.workOrBusinessAddress,
						telephoneNumber: application.telephoneNumber ?? undefined,
						mobileNumber: application.mobileNumber,
						emailAddress: application.emailAddress,
						professionalTaxReceiptNumber:
							application.professionalTaxReceiptNumber,
						rollOfAttorneysNumber: application.rollOfAttorneysNumber,
						ibpMembershipNumber: application.ibpMembershipNumber,
						mcleComplianceNumber: application.mcleComplianceNumber,
						ulasComplianceNumber: application.ulasComplianceNumber
					},
					createdAt: application.createdAt,
					updatedAt: application.updatedAt
				}
			} catch (error) {
				console.error("Get legal registration error:", error)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to retrieve legal registration application"
				})
			}
		}),

	// Update application (only in DRAFT status)
	update: protectedProcedure
		.input(
			z.object({
				applicationId: z.string(),
				data: legalRegistrationFormSchema.partial()
			})
		)
		.output(z.object({ message: z.string() }))
		.mutation(async ({ ctx, input }) => {
			try {
				console.log("Update request received:", {
					applicationId: input.applicationId,
					userId: ctx.session.user.id,
					dataKeys: Object.keys(input.data)
				})

				const application = await db.legalRegistration.findFirst({
					where: {
						id: input.applicationId,
						applicantId: ctx.session.user.id
					}
				})

				if (!application) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Legal registration application not found"
					})
				}

				if (application.status !== "DRAFT") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Cannot update submitted application"
					})
				}

				// Build update data
				const updateData: Record<string, unknown> = {}

				if (input.data.personalQualifications) {
					console.log("Updating personal qualifications")
					const pq = input.data.personalQualifications
					Object.assign(updateData, {
						citizenship: pq.citizenship,
						dateOfBirth: pq.dateOfBirth ? new Date(pq.dateOfBirth) : undefined,
						residentialAddress: pq.residentialAddress,
						workOrBusinessAddress: pq.workOrBusinessAddress,
						telephoneNumber: pq.telephoneNumber,
						mobileNumber: pq.mobileNumber,
						emailAddress: pq.emailAddress,
						professionalTaxReceiptNumber: pq.professionalTaxReceiptNumber,
						rollOfAttorneysNumber: pq.rollOfAttorneysNumber,
						ibpMembershipNumber: pq.ibpMembershipNumber,
						mcleComplianceNumber: pq.mcleComplianceNumber,
						ulasComplianceNumber: pq.ulasComplianceNumber
					})
				}

				if (input.data.obcCertification) {
					console.log(
						"Updating OBC certification URL:",
						input.data.obcCertification.fileUrl
					)
					updateData.obcCertificationUrl = input.data.obcCertification.fileUrl
				}

				if (input.data.ibpCertification) {
					console.log(
						"Updating IBP certification URL:",
						input.data.ibpCertification.fileUrl
					)
					updateData.ibpCertificationUrl = input.data.ibpCertification.fileUrl
				}

				if (input.data.passportPhoto) {
					console.log(
						"Updating passport photo URL:",
						input.data.passportPhoto.fileUrl
					)
					updateData.passportPhotoUrl = input.data.passportPhoto.fileUrl
				}

				if (input.data.paymentProof) {
					console.log(
						"Updating payment proof URL:",
						input.data.paymentProof.fileUrl
					)
					updateData.paymentProofUrl = input.data.paymentProof.fileUrl
				}

				if (input.data.enfProviderCertification) {
					console.log(
						"Updating ENF provider certification URL:",
						input.data.enfProviderCertification.fileUrl
					)
					updateData.enfProviderCertificationUrl =
						input.data.enfProviderCertification.fileUrl
				}

				if (input.data.undertakingElectronicNotarialActs !== undefined) {
					console.log(
						"Updating electronic notarial acts undertaking:",
						input.data.undertakingElectronicNotarialActs
					)
					updateData.undertakingElectronicNotarialActs =
						input.data.undertakingElectronicNotarialActs
				}

				if (input.data.undertakingDataSharingGuidelines !== undefined) {
					console.log(
						"Updating data sharing guidelines undertaking:",
						input.data.undertakingDataSharingGuidelines
					)
					updateData.undertakingDataSharingGuidelines =
						input.data.undertakingDataSharingGuidelines
				}

				console.log("Final update data:", updateData)

				await db.legalRegistration.update({
					where: { id: input.applicationId },
					data: updateData
				})

				console.log("Application updated successfully in database")

				return { message: "Application updated successfully" }
			} catch (error) {
				console.error("Legal registration update error:", error)

				if (error instanceof TRPCError) {
					throw error
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update legal registration application"
				})
			}
		}),

	// Admin: List all applications
	listApplications: protectedProcedure
		.input(
			z.object({
				status: z
					.enum([
						"ALL",
						"DRAFT",
						"SUBMITTED",
						"UNDER_REVIEW",
						"APPROVED",
						"REJECTED"
					])
					.default("ALL"),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(50).default(10)
			})
		)
		.query(async ({ ctx, input }) => {
			// Check if user is admin
			if (ctx.session.user.role !== "ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only administrators can view all applications"
				})
			}

			try {
				const where = input.status === "ALL" ? {} : { status: input.status }
				const skip = (input.page - 1) * input.limit

				const [applications, total] = await Promise.all([
					db.legalRegistration.findMany({
						where,
						skip,
						take: input.limit,
						include: {
							applicant: {
								select: {
									name: true,
									email: true
								}
							}
						},
						orderBy: {
							createdAt: "desc"
						}
					}),
					db.legalRegistration.count({ where })
				])

				return {
					applications,
					pagination: {
						page: input.page,
						limit: input.limit,
						total,
						pages: Math.ceil(total / input.limit)
					}
				}
			} catch (error) {
				console.error("List applications error:", error)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to retrieve applications"
				})
			}
		}),

	// Admin: Update application status
	updateStatus: protectedProcedure
		.input(updateApplicationStatusSchema)
		.output(z.object({ message: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Check if user is admin
			if (ctx.session.user.role !== "ADMIN") {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only administrators can update application status"
				})
			}

			try {
				const application = await db.legalRegistration.findUnique({
					where: { id: input.applicationId }
				})

				if (!application) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Legal registration application not found"
					})
				}

				const updateData: Record<string, unknown> = {
					status: input.status,
					reviewedBy: ctx.session.user.id,
					reviewedAt: new Date(),
					remarks: input.remarks
				}

				if (input.status === "APPROVED") {
					updateData.approvedAt = new Date()
				} else if (input.status === "REJECTED") {
					updateData.rejectedAt = new Date()
				}

				await db.legalRegistration.update({
					where: { id: input.applicationId },
					data: updateData
				})

				return {
					message: `Application ${input.status.toLowerCase()} successfully`
				}
			} catch (error) {
				console.error("Update application status error:", error)

				if (error instanceof TRPCError) {
					throw error
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update application status"
				})
			}
		}),

	// Get or create draft application (auto-draft creation)
	getOrCreateDraft: protectedProcedure
		.output(
			z.object({
				id: z.string(),
				message: z.string()
			})
		)
		.mutation(async ({ ctx }) => {
			try {
				console.log("getOrCreateDraft called for user:", ctx.session.user.id)

				// Check if user already has an application
				const existingApplication = await db.legalRegistration.findUnique({
					where: { applicantId: ctx.session.user.id }
				})

				if (existingApplication) {
					console.log("Found existing application:", existingApplication.id)
					return {
						id: existingApplication.id,
						message: "Existing application found"
					}
				}

				console.log("No existing application found, creating new draft...")

				// Create new draft application with minimal data
				const application = await db.legalRegistration.create({
					data: {
						applicantId: ctx.session.user.id,

						// Personal Qualifications - minimal defaults (no "TBD" values)
						citizenship: "Filipino",
						dateOfBirth: new Date("2000-01-01"), // Default date that will be updated
						residentialAddress: "",
						workOrBusinessAddress: "",
						telephoneNumber: "",
						mobileNumber: "",
						emailAddress: ctx.session.user.email ?? "", // Pre-fill from user account
						professionalTaxReceiptNumber: "",
						rollOfAttorneysNumber: "",
						ibpMembershipNumber: "",
						mcleComplianceNumber: "",
						ulasComplianceNumber: "",

						// File uploads - all empty strings initially
						obcCertificationUrl: "",
						ibpCertificationUrl: "",
						passportPhotoUrl: "",
						paymentProofUrl: "",
						enfProviderCertificationUrl: "",

						// Undertakings - false initially
						undertakingElectronicNotarialActs: false,
						undertakingDataSharingGuidelines: false,

						// Electronic signature
						electronicSignatureApplied: false,

						// Set as draft
						status: "DRAFT"
					}
				})

				console.log("Draft application created successfully:", application.id)

				return {
					id: application.id,
					message: "Draft application created successfully"
				}
			} catch (error) {
				console.error("Error in getOrCreateDraft:", error)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create draft application"
				})
			}
		})
})
