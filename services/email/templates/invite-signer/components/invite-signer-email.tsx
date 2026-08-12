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

export interface InviteSignerEmailProps {
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
	document?: {
		id: string
		name: string
	} | null
	inviteUrl: string
}

export const InviteSignerEmail = ({
	recipient,
	sender,
	envelope,
	document,
	inviteUrl
}: InviteSignerEmailProps) => {
	const previewText = `🔐 ${sender.name ?? sender.email ?? "Someone"} needs your signature on "${envelope.title}"`

	return (
		<Html>
			<Head />
			<Body style={main}>
				<Preview>{previewText}</Preview>
				<Container style={container}>
					{/* Header with enhanced branding */}
					<Section style={header}>
						<Img
							src="https://aygaepypiusloubktinn.supabase.co/storage/v1/object/public/documents//Quanby%20LOGO.png"
							width="80"
							height="80"
							alt="Quanby Sign"
							style={logo}
						/>
						<Text style={headerTitle}>Quanby Sign</Text>
						<Text style={headerSubtitle}>Secure Digital Signatures</Text>
					</Section>

					{/* Status Badge */}
					<Section style={badgeSection}>
						<div style={statusBadge}>
							<span style={badgeIcon}>🔐</span>
							<span style={badgeText}>Signature Required</span>
						</div>
					</Section>

					{/* Main content */}
					<Section style={box}>
						<Text style={greeting}>
							Hello{" "}
							{recipient.name ? (
								<strong>{recipient.name}</strong>
							) : (
								<strong>{recipient.email}</strong>
							)}
							,
						</Text>

						<Text style={mainMessage}>
							<strong>{sender.name ?? sender.email}</strong> has requested your
							digital signature on the following document:
						</Text>

						{/* Document Card */}
						<Section style={documentCard}>
							<div style={documentHeader}>
								<span style={documentIcon}>📄</span>
								<div>
									<Text style={documentTitle}>{envelope.title}</Text>
									{document && (
										<Text style={documentName}>{document.name}</Text>
									)}
								</div>
							</div>
							{envelope.description && (
								<Text style={documentDescription}>{envelope.description}</Text>
							)}
						</Section>

						{/* Action Button */}
						<Section style={buttonSection}>
							<Button style={primaryButton} href={inviteUrl}>
								<span style={buttonIcon}>✍️</span>
								<span style={buttonText}>Review & Sign Document</span>
							</Button>
						</Section>

						{/* Security Notice */}
						<Section style={securitySection}>
							<Text style={securityTitle}>
								<span style={securityIcon}>🛡️</span>
								Security & Trust
							</Text>
							<Text style={securityText}>
								• Your signature is protected with bank-level security
								<br />
								• This invitation is sent from a verified Quanby Sign account
								<br />
								• All documents are encrypted and audit-ready
								<br />• Only sign if you recognize the sender and expected this
								request
							</Text>
						</Section>

						<Hr style={hr} />

						{/* Alternative Link */}
						<Section style={linkSection}>
							<Text style={linkTitle}>Having trouble with the button?</Text>
							<Text style={linkText}>
								Copy and paste this secure link into your browser:
							</Text>
							<Text style={linkUrl}>
								<a href={inviteUrl} style={linkStyle}>
									{inviteUrl}
								</a>
							</Text>
						</Section>

						<Hr style={hr} />

						{/* Support */}
						<Text style={supportText}>
							Questions? Contact {sender.name ?? sender.email} directly or reach
							our support team at support@quanbysign.com
						</Text>

						<Text style={signature}>
							Best regards,
							<br />
							<strong>The Quanby Sign Team</strong>
						</Text>
					</Section>

					{/* Enhanced Footer */}
					<Section style={footer}>
						<Text style={footerBrand}>
							<strong>Quanby Sign</strong> - Trusted Digital Signatures
						</Text>
						<Text style={footerText}>
							This is an automated message. Please do not reply to this email.
						</Text>
						<Text style={footerLinks}>
							<a href="#" style={footerLink}>
								Privacy Policy
							</a>{" "}
							|
							<a href="#" style={footerLink}>
								Terms of Service
							</a>{" "}
							|
							<a href="#" style={footerLink}>
								Support
							</a>
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

export default InviteSignerEmail

const main = {
	backgroundColor: "#f8fafc",
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
	borderRadius: "20px",
	overflow: "hidden",
	boxShadow:
		"0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1)",
	border: "1px solid #e2e8f0"
}

const header = {
	background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%)",
	padding: "32px 32px 24px 32px",
	textAlign: "center" as const
}

const headerTitle = {
	color: "#ffffff",
	fontSize: "24px",
	fontWeight: "800",
	margin: "8px 0 4px 0",
	letterSpacing: "-0.025em"
}

const headerSubtitle = {
	color: "#bfdbfe",
	fontSize: "14px",
	fontWeight: "500",
	margin: "0",
	letterSpacing: "0.025em"
}

const badgeSection = {
	padding: "0 32px",
	textAlign: "center" as const,
	transform: "translateY(-16px)"
}

const statusBadge = {
	display: "inline-flex",
	alignItems: "center",
	backgroundColor: "#ffffff",
	border: "2px solid #3b82f6",
	borderRadius: "50px",
	padding: "8px 20px",
	boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)"
}

const badgeIcon = {
	fontSize: "16px",
	marginRight: "8px"
}

const badgeText = {
	color: "#1e40af",
	fontSize: "14px",
	fontWeight: "700",
	textTransform: "uppercase" as const,
	letterSpacing: "0.05em"
}

const box = {
	padding: "32px 32px 40px 32px"
}

const logo = {
	margin: "0 auto 16px auto",
	display: "block",
	borderRadius: "12px"
}

const greeting = {
	color: "#1e293b",
	fontSize: "18px",
	fontWeight: "600",
	lineHeight: "1.6",
	margin: "0 0 20px 0"
}

const mainMessage = {
	color: "#475569",
	fontSize: "16px",
	lineHeight: "1.7",
	margin: "0 0 24px 0"
}

const documentCard = {
	backgroundColor: "#f8fafc",
	border: "2px solid #e2e8f0",
	borderRadius: "16px",
	padding: "24px",
	margin: "24px 0"
}

const documentHeader = {
	display: "flex",
	alignItems: "flex-start",
	gap: "16px"
}

const documentIcon = {
	fontSize: "24px",
	marginTop: "2px"
}

const documentTitle = {
	color: "#1e293b",
	fontSize: "18px",
	fontWeight: "700",
	margin: "0 0 4px 0",
	lineHeight: "1.4"
}

const documentName = {
	color: "#64748b",
	fontSize: "14px",
	fontWeight: "500",
	margin: "0",
	lineHeight: "1.4"
}

const documentDescription = {
	color: "#64748b",
	fontSize: "15px",
	lineHeight: "1.6",
	margin: "16px 0 0 0",
	paddingTop: "16px",
	borderTop: "1px solid #e2e8f0"
}

const buttonSection = {
	textAlign: "center" as const,
	margin: "32px 0"
}

const primaryButton = {
	background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
	borderRadius: "16px",
	color: "#ffffff",
	fontSize: "16px",
	fontWeight: "700",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	padding: "18px 32px",
	margin: "0",
	boxShadow:
		"0 12px 24px -6px rgba(59, 130, 246, 0.4), 0 4px 8px -2px rgba(59, 130, 246, 0.2)",
	border: "none",
	transition: "all 0.2s ease"
}

const buttonIcon = {
	fontSize: "18px",
	marginRight: "12px"
}

const buttonText = {
	fontSize: "16px",
	fontWeight: "700"
}

const securitySection = {
	backgroundColor: "#f0fdf4",
	border: "1px solid #bbf7d0",
	borderRadius: "12px",
	padding: "20px",
	margin: "32px 0"
}

const securityTitle = {
	color: "#166534",
	fontSize: "16px",
	fontWeight: "700",
	margin: "0 0 12px 0",
	display: "flex",
	alignItems: "center"
}

const securityIcon = {
	fontSize: "18px",
	marginRight: "8px"
}

const securityText = {
	color: "#15803d",
	fontSize: "14px",
	lineHeight: "1.6",
	margin: "0"
}

const linkSection = {
	backgroundColor: "#fafafa",
	borderRadius: "8px",
	padding: "16px",
	margin: "24px 0"
}

const linkTitle = {
	color: "#374151",
	fontSize: "14px",
	fontWeight: "600",
	margin: "0 0 8px 0"
}

const linkText = {
	color: "#6b7280",
	fontSize: "13px",
	margin: "0 0 8px 0"
}

const linkUrl = {
	margin: "0"
}

const linkStyle = {
	color: "#3b82f6",
	fontSize: "12px",
	wordBreak: "break-all" as const,
	textDecoration: "underline"
}

const hr = {
	border: "none",
	borderTop: "1px solid #e2e8f0",
	margin: "32px 0"
}

const supportText = {
	color: "#64748b",
	fontSize: "14px",
	lineHeight: "1.6",
	margin: "0 0 24px 0"
}

const signature = {
	color: "#475569",
	fontSize: "15px",
	lineHeight: "1.6",
	margin: "0"
}

const footer = {
	backgroundColor: "#f1f5f9",
	padding: "32px 32px 24px 32px",
	textAlign: "center" as const,
	borderTop: "1px solid #e2e8f0"
}

const footerBrand = {
	color: "#1e293b",
	fontSize: "16px",
	fontWeight: "700",
	margin: "0 0 8px 0"
}

const footerText = {
	color: "#64748b",
	fontSize: "13px",
	lineHeight: "1.4",
	margin: "0 0 12px 0"
}

const footerLinks = {
	margin: "0"
}

const footerLink = {
	color: "#3b82f6",
	fontSize: "12px",
	textDecoration: "none",
	margin: "0 8px"
}
