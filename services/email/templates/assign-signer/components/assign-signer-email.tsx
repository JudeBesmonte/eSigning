import type { RecipientRole } from "@prisma/client"
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

interface RecipientAssignmentEmailProps {
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

const getRoleText = (role: RecipientRole) => {
	switch (role) {
		case "SIGNER":
			return "sign"
		case "APPROVER":
			return "approve"
		case "VIEWER":
			return "view"
		case "CC":
			return "review"
		default:
			return "review"
	}
}

const getRoleTitle = (role: RecipientRole) => {
	switch (role) {
		case "SIGNER":
			return "Document Signing Request"
		case "APPROVER":
			return "Document Approval Request"
		case "VIEWER":
			return "Document Review Request"
		case "CC":
			return "Document Notification"
		default:
			return "Document Request"
	}
}

export const RecipientAssignmentEmail = ({
	recipient,
	sender,
	envelope,
	documents,
	role
}: RecipientAssignmentEmailProps) => (
	<Html>
		<Head />
		<Body style={main}>
			<Preview>
				You have been assigned to {getRoleText(role)} documents in &ldquo;
				{envelope.title}&rdquo;
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
					<div style={{ textAlign: "center", marginBottom: "32px" }}>
						<div style={rolesBadge}>{role.toLowerCase()}</div>
					</div>
					<Text style={heading}>{getRoleTitle(role)}</Text>

					<Text style={paragraph}>
						Hello <strong>{recipient.name ?? recipient.email}</strong>,
					</Text>

					<Text style={paragraph}>
						<strong>{sender.name ?? sender.email}</strong> has assigned you to{" "}
						{getRoleText(role)} documents in the envelope &ldquo;
						{envelope.title}&rdquo;.
					</Text>

					{envelope.description && (
						<Section style={highlightBox}>
							<Text style={paragraph}>
								<strong>Description:</strong> {envelope.description}
							</Text>
						</Section>
					)}

					<Text style={paragraph}>
						<strong>Documents to {getRoleText(role)}:</strong>
					</Text>
					<Section style={documentList}>
						{documents.map((doc) => (
							<Text key={doc.id} style={documentItem}>
								• {doc.name}
							</Text>
						))}
					</Section>

					<Text style={paragraph}>
						To proceed with the {getRoleText(role)} process, please access your
						Quanby Sign account:
					</Text>

					<Button style={button} href={`${baseUrl}/auth/login`}>
						Access Quanby Sign →
					</Button>

					<Text style={smallText}>
						If you don&apos;t have an account yet, you can sign up using the
						link above.
					</Text>

					<Hr style={hr} />

					<Text style={paragraph}>
						<strong>What happens next?</strong>
					</Text>

					<Section style={stepsContainer}>
						{role === "SIGNER" && (
							<>
								<Text style={stepItem}>
									1. Log in to your Quanby Sign account
								</Text>
								<Text style={stepItem}>2. Review the documents carefully</Text>
								<Text style={stepItem}>
									3. Add your digital signature where required
								</Text>
								<Text style={stepItem}>4. Submit the signed documents</Text>
							</>
						)}
						{role === "APPROVER" && (
							<>
								<Text style={stepItem}>
									1. Log in to your Quanby Sign account
								</Text>
								<Text style={stepItem}>2. Review the documents thoroughly</Text>
								<Text style={stepItem}>3. Approve or reject the documents</Text>
								<Text style={stepItem}>4. Add any comments if necessary</Text>
							</>
						)}
						{(role === "VIEWER" || role === "CC") && (
							<>
								<Text style={stepItem}>
									1. Log in to your Quanby Sign account
								</Text>
								<Text style={stepItem}>2. Review the documents</Text>
								<Text style={stepItem}>
									3. No action required from your side
								</Text>
							</>
						)}
					</Section>

					<Hr style={hr} />

					<Text style={paragraph}>
						If you have any questions about this request, please contact{" "}
						<strong>{sender.name ?? sender.email}</strong>.
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

export default RecipientAssignmentEmail

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

const rolesBadge = {
	display: "inline-block",
	backgroundColor: "#3b82f6",
	color: "#ffffff",
	padding: "8px 16px",
	borderRadius: "25px",
	fontSize: "12px",
	fontWeight: "700",
	textTransform: "uppercase" as const,
	letterSpacing: "0.1em",
	margin: "0 auto 32px auto",
	textAlign: "center" as const,
	boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.3)"
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

const highlightBox = {
	backgroundColor: "#f1f5f9",
	border: "1px solid #cbd5e1",
	borderRadius: "8px",
	padding: "20px",
	margin: "24px 0"
}

const documentList = {
	backgroundColor: "#f8fafc",
	border: "1px solid #e2e8f0",
	padding: "20px",
	borderRadius: "8px",
	margin: "20px 0"
}

const documentItem = {
	color: "#64748b",
	fontSize: "15px",
	lineHeight: "1.6",
	margin: "8px 0",
	paddingLeft: "4px"
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

const smallText = {
	color: "#94a3b8",
	fontSize: "14px",
	lineHeight: "1.5",
	textAlign: "center" as const,
	margin: "16px 0"
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
