import { auth } from "@/services/next-auth"
import { HydrateClient } from "@/services/trpc/server"

import { Navbar } from "@/features/home/components/navbar"

export default async function NotificationsLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	const session = await auth()
	const isAuthenticated = !!session?.user

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			{/* Navbar */}
			<Navbar isAuthenticated={isAuthenticated} />

			{/* Main Content */}
			<div className="pt-20">
				<HydrateClient>{children}</HydrateClient>
			</div>
		</div>
	)
}
