import { QuanbyLogo } from "@/core/components/quanby-logo"
import { NavMain } from "@/core/components/sidebar/nav-main"
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail
} from "@/core/components/ui/sidebar"
import { getSidebarGroups } from "@/core/lib/nav.config"

import { auth } from "@/services/next-auth"

export async function AppSidebar({
	...props
}: React.ComponentPropsWithoutRef<typeof Sidebar>) {
	const session = await auth()
	const userRole = session?.user?.role
	const navGroups = getSidebarGroups(userRole)

	return (
		<Sidebar
			className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
			{...props}
		>
			<SidebarHeader className="max-h-16 border-b border-sidebar-border">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" className="hover:cursor-default">
							<QuanbyLogo className="!size-8 p-0.5" />
							<h1 className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-xl font-bold leading-tight tracking-tight text-transparent">
								SnapSeal
							</h1>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent className="gap-y-0">
				{Object.entries(navGroups).map(([key, group]) => (
					<NavMain key={key} label={group.label} items={group.items} />
				))}
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	)
}
