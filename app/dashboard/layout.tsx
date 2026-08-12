import { ClientOnly } from "@/core/components/client-only"
import { AppSidebar } from "@/core/components/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/core/components/ui/sidebar"

import { DashboardHeader } from "@/features/dashboard/_components/dashboard-header"

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider
			className="min-h-screen [--header-height:calc(--spacing(14))]"
			suppressHydrationWarning
		>
			<AppSidebar />
			<SidebarInset>
				<ClientOnly>
					<DashboardHeader />
				</ClientOnly>
				<div
					className="container mx-auto px-4 py-2 md:px-8 md:py-4 xl:px-10 xl:py-6"
					suppressHydrationWarning
				>
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
