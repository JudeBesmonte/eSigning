import {
	Body,
	Button,
	Container,
	Head,
	Hr,
	Html,
	Img,
	Preview,
	Section,
	Text
} from "@react-email/components"

const baseUrl = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}`
	: (process.env.AUTH_URL ?? "http://localhost:3000")

interface SignatureRejectedEmailProps {
	recipient: {
		email: string
		name?: string | null
	}
	rejector: {
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
	rejectionDate: Date
	rejectionReason?: string | null
	comments?: string | null
}

export const SignatureRejectedEmail = ({
	recipient,
	rejector,
	envelope,
	documents,
	rejectionDate,
	rejectionReason,
	comments
}: SignatureRejectedEmailProps) => (
	<Html>
		<Head />
		<Body style={main}>
			<Preview>
				Your envelope &ldquo;{envelope.title}&rdquo; has been rejected
			</Preview>
			<Container style={container}>
				{/* Header with logo */}
				<Section style={header}>
					<Img
						src="https://aygaepypiusloubktinn.supabase.co/storage/v1/object/public/documents//Quanby%20LOGO.png"
						width="120"
						height="120"
						alt="Quanby Sign"
						style={logo}
					/>
				</Section>

				{/* Main content */}
				<Section style={box}>
					<Text style={heading}>Envelope Rejected</Text>

					<Text style={paragraph}>
						Hello <strong>{recipient.name ?? recipient.email}</strong>,
					</Text>

					<Text style={paragraph}>
						We&apos;re sorry to inform you that your envelope &ldquo;
						<strong>{envelope.title}</strong>
						&rdquo; has been rejected and requires your attention before it can
						proceed.
					</Text>

					{envelope.description && (
						<Section style={highlightBox}>
							<Text style={paragraph}>
								<strong>Description:</strong> {envelope.description}
							</Text>
						</Section>
					)}

					{/* Rejection Details */}
					<Section style={rejectionDetailsBox}>
						<Text style={sectionTitle}>Rejection Details</Text>
						<Text style={detailItem}>
							<strong>Rejected by:</strong>{" "}
							{rejector.name ?? rejector.email ?? "System Reviewer"}
						</Text>
						<Text style={detailItem}>
							<strong>Rejection date:</strong>{" "}
							{rejectionDate.toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit"
							})}
						</Text>
						{rejectionReason && (
							<Text style={detailItem}>
								<strong>Reason:</strong> {rejectionReason}
							</Text>
						)}
						{comments && (
							<Text style={detailItem}>
								<strong>Comments:</strong> {comments}
							</Text>
						)}
					</Section>

					<Text style={paragraph}>
						<strong>Affected documents ({documents.length}):</strong>
					</Text>
					<Section style={documentList}>
						{documents.map((doc) => (
							<Text key={doc.id} style={documentItem}>
								❌ {doc.name}
							</Text>
						))}
					</Section>

					<Text style={paragraph}>
						To address the issues and resubmit your envelope, please review the
						feedback above and make the necessary changes.
					</Text>

					<Button
						style={button}
						href={`${baseUrl}/dashboard/envelope/${envelope.id}`}
					>
						Review & Edit Envelope →
					</Button>

					<Hr style={hr} />

					<Text style={paragraph}>
						<strong>What you can do next:</strong>
					</Text>

					<Section style={stepsContainer}>
						<Text style={stepItem}>
							1. Review the rejection reason and comments carefully
						</Text>
						<Text style={stepItem}>
							2. Make the necessary changes to your documents or envelope
							settings
						</Text>
						<Text style={stepItem}>
							3. Update any recipient assignments if needed
						</Text>
						<Text style={stepItem}>
							4. Resubmit the envelope for approval once issues are resolved
						</Text>
					</Section>

					<Hr style={hr} />

					<Text style={paragraph}>
						If you have questions about the rejection or need assistance with
						the changes, please contact{" "}
						<strong>{rejector.name ?? rejector.email}</strong> directly or reach
						out to our support team.
					</Text>

					<Text style={paragraph}>— The Quanby Sign Team</Text>
				</Section>

				{/* Footer */}
				<Section style={footer}>
					<Text style={footerText}>
						This is an automated message from Quanby Sign. Please do not reply
						to this email.
					</Text>
				</Section>
			</Container>
		</Body>
	</Html>
)

export default SignatureRejectedEmail

const main = {
	backgroundColor: "#f1f5f9",
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
	lineHeight: "1.6",
	color: "#334155",
	padding: "40px 20px"
}

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "0",
	maxWidth: "600px",
	borderRadius: "16px",
	overflow: "hidden",
	boxShadow:
		"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
	border: "1px solid #e2e8f0"
}

const header = {
	background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
	padding: "40px 32px",
	textAlign: "center" as const
}

const box = {
	padding: "40px 32px"
}

const logo = {
	margin: "0 auto",
	display: "block"
}

const heading = {
	fontSize: "28px",
	fontWeight: "700",
	color: "#0f172a",
	margin: "0 0 24px 0",
	textAlign: "center" as const,
	letterSpacing: "-0.025em"
}

const hr = {
	border: "none",
	borderTop: "1px solid #e2e8f0",
	margin: "32px 0"
}

const paragraph = {
	color: "#475569",
	fontSize: "16px",
	lineHeight: "1.7",
	textAlign: "left" as const,
	margin: "0 0 16px 0"
}

const sectionTitle = {
	color: "#1e293b",
	fontSize: "18px",
	fontWeight: "600",
	margin: "0 0 16px 0"
}

const highlightBox = {
	backgroundColor: "#f1f5f9",
	border: "1px solid #cbd5e1",
	borderRadius: "8px",
	padding: "20px",
	margin: "24px 0"
}

const rejectionDetailsBox = {
	backgroundColor: "#fef2f2",
	border: "1px solid #fca5a5",
	borderRadius: "8px",
	padding: "20px",
	margin: "24px 0"
}

const detailItem = {
	color: "#7f1d1d",
	fontSize: "15px",
	lineHeight: "1.6",
	margin: "8px 0",
	paddingLeft: "4px"
}

const documentList = {
	backgroundColor: "#f8fafc",
	border: "1px solid #e2e8f0",
	padding: "20px",
	borderRadius: "8px",
	margin: "20px 0"
}

const documentItem = {
	color: "#dc2626",
	fontSize: "15px",
	lineHeight: "1.6",
	margin: "8px 0",
	paddingLeft: "4px",
	fontWeight: "500"
}

const button = {
	background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
	borderRadius: "12px",
	color: "#ffffff",
	fontSize: "18px",
	fontWeight: "700",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "block",
	padding: "16px 32px",
	margin: "32px 0",
	boxShadow:
		"0 10px 15px -3px rgba(59, 130, 246, 0.4), 0 4px 6px -2px rgba(59, 130, 246, 0.2)"
}

const stepsContainer = {
	backgroundColor: "#fefefe",
	border: "1px solid #e2e8f0",
	borderRadius: "8px",
	padding: "24px",
	margin: "24px 0"
}

const stepItem = {
	color: "#475569",
	fontSize: "15px",
	lineHeight: "1.6",
	margin: "8px 0",
	paddingLeft: "8px"
}

const footer = {
	backgroundColor: "#f8fafc",
	padding: "24px 32px",
	textAlign: "center" as const,
	borderTop: "1px solid #e2e8f0"
}

const footerText = {
	color: "#94a3b8",
	fontSize: "13px",
	lineHeight: "1.4",
	margin: "0"
}
