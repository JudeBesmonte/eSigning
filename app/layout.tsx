import "./globals.css"

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import { SessionProvider } from "next-auth/react"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import { TooltipProvider } from "@/core/components/tooltip"
import { Toaster } from "@/core/components/ui/sonner"
import { TooltipProvider as UITooltipProvider } from "@/core/components/ui/tooltip"
import { ThemeProvider } from "@/core/context/theme-provider"

import { auth } from "@/services/next-auth"
import { TRPCProvider } from "@/services/trpc/client"

const inter = Inter({
	subsets: ["latin"]
})

export const metadata: Metadata = {
	title: "SnapSeal | Fast, Secure, Legally Binding Digital Signatures",
	description:
		"Sign documents online instantly with SnapSeal. Enjoy fast, secure, and legally binding e-signatures—no hassle, just signatures. Trusted by professionals.",
	generator: "SnapSeal",
	applicationName: "SnapSeal",
	authors: [{ name: "Quanby Solutions, Inc.", url: "https://quanbyit.com" }],
	creator: "Quanby Solutions, Inc.",
	keywords: [
		"e-signature",
		"digital signature",
		"sign documents online",
		"SnapSeal",
		"secure signing",
		"legally binding",
		"electronic signature"
	],
	metadataBase: new URL("https://snapseal.quanby.com"),
	openGraph: {
		title: "SnapSeal | Fast, Secure, Legally Binding Digital Signatures",
		description:
			"Sign documents online instantly with SnapSeal. Enjoy fast, secure, and legally binding e-signatures—no hassle, just signatures.",
		url: "https://snapseal.quanby.com",
		siteName: "SnapSeal",
		images: [
			{
				url: "/qsign.logo.png",
				width: 1000,
				height: 1000,
				alt: "SnapSeal - Digitally Sign Documents"
			}
		],
		locale: "en_US",
		type: "website"
	},
	twitter: {
		card: "summary_large_image",
		title: "SnapSeal | Fast, Secure, Legally Binding Digital Signatures",
		description:
			"Sign documents online instantly with SnapSeal. Enjoy fast, secure, and legally binding e-signatures—no hassle, just signatures.",
		images: ["/qsign.logo.png"]
	}
}

export default async function RootLayout({
	children
}: {
	children: React.ReactNode
}) {
	const session = await auth()
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${inter.className} !scrollbar-hide min-h-screen overflow-x-hidden scroll-smooth bg-background antialiased`}
			>
				<SessionProvider session={session}>
					<TRPCProvider>
						<NuqsAdapter>
							<ThemeProvider
								attribute="class"
								defaultTheme="system"
								enableSystem
								disableTransitionOnChange
							>
								<TooltipProvider>
									<UITooltipProvider>
										{children}
										<Toaster richColors closeButton />
									</UITooltipProvider>
								</TooltipProvider>
							</ThemeProvider>
						</NuqsAdapter>
					</TRPCProvider>
				</SessionProvider>
			</body>
		</html>
	)
}
