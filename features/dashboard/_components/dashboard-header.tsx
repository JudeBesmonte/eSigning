"use client"

import { ModeToggle } from "@/core/components/mode-toggle"
import { SiteSearch } from "@/core/components/navbar/site-search"
import { SiteUser } from "@/core/components/navbar/site-user"
import { Separator } from "@/core/components/ui/separator"
import { SidebarTrigger } from "@/core/components/ui/sidebar"

import { NotificationPopover } from "@/features/notification/components/notification-popover"

export function DashboardHeader() {
	return (
		<header className="sticky top-0 z-auto flex h-16 w-full items-center justify-between border-b border-sidebar-border bg-sidebar/20 px-6 shadow-sm backdrop-blur-md dark:bg-transparent">
			<SidebarTrigger />
			<SiteSearch />

			<div className="flex items-center justify-end gap-x-2">
				<ModeToggle />
				<NotificationPopover />
				<Separator orientation="vertical" className="mx-2 h-6" />
				<SiteUser />
			</div>
		</header>
	)
}
