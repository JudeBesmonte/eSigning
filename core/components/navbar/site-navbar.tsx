"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment } from "react"
import { Bell, CheckCircle, Home, MenuIcon, Settings, User } from "lucide-react"
import { useSession } from "next-auth/react"

import { ModeToggle } from "@/core/components/mode-toggle"
import { QuanbyLogo } from "@/core/components/quanby-logo"
import { Button } from "@/core/components/ui/button"
import { Separator } from "@/core/components/ui/separator"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from "@/core/components/ui/sheet"
import { useIsMobile } from "@/core/hooks/use-mobile"
import { cn } from "@/core/lib/utils"

import { trpc } from "@/services/trpc/client"

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator
} from "@/features/home/components/ui/breadcrumb"

import { SiteUser } from "./site-user"

interface SiteNavbarProps {
	items?: {
		label: string
		url?: string
	}[]
}

export function SiteNavbar({ items }: SiteNavbarProps) {
	const isMobile = useIsMobile()
	const pathname = usePathname()

	// Navigation items for mobile sidebar
	const navigationItems = [
		{
			title: "Home",
			href: "/",
			icon: Home,
			isActive: pathname === "/"
		},
		{
			title: "My Signed",
			href: "/my-signed",
			icon: CheckCircle,
			isActive: pathname.startsWith("/my-signed")
		},
		{
			title: "Profile",
			href: "/profile",
			icon: User,
			isActive: pathname.startsWith("/profile")
		},
		{
			title: "Notifications",
			href: "/notifications",
			icon: Bell,
			isActive: pathname.startsWith("/notifications")
		},
		{
			title: "Settings",
			href: "/settings",
			icon: Settings,
			isActive: pathname.startsWith("/settings")
		}
	]

	return (
		<nav className="bg-background backdrop-blur dark:bg-muted/60">
			<div className="mx-auto flex h-16 items-center justify-between px-4 md:px-8">
				<div className="flex items-center gap-2">
					<Link
						href="/"
						className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-muted/50 md:gap-3"
					>
						<div className="flex gap-x-2">
							<QuanbyLogo className="size-6 shrink-0" />
							<span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-lg font-bold leading-tight tracking-tight text-transparent">
								E-Signing
							</span>
						</div>
					</Link>

					{items && (
						<>
							<Separator
								orientation="vertical"
								className="mx-2 hidden data-[orientation=vertical]:h-4 md:block"
							/>
							<Breadcrumb className="hidden md:block">
								<BreadcrumbList>
									{items.map(({ label, url }, index, array) => (
										<Fragment key={index}>
											<BreadcrumbItem>
												{url ? (
													<BreadcrumbLink href={url}>{label}</BreadcrumbLink>
												) : (
													<BreadcrumbPage>{label}</BreadcrumbPage>
												)}
											</BreadcrumbItem>
											{index < array.length - 1 && <BreadcrumbSeparator />}
										</Fragment>
									))}
								</BreadcrumbList>
							</Breadcrumb>
						</>
					)}
				</div>
				<div className="flex items-center gap-2">
					<ModeToggle />

					<NotificationBell />

					<div className="h-6">
						<Separator className="h-full" orientation="vertical" />
					</div>
					{!isMobile && <SiteUser />}

					{isMobile && (
						<Sheet>
							<SheetTrigger asChild>
								<Button variant="ghost" size="icon" className={cn("size-8")}>
									<MenuIcon className="size-5 shrink-0" />
								</Button>
							</SheetTrigger>
							<SheetContent side="left" className="flex w-80 flex-col">
								<SheetHeader>
									<SheetTitle className="flex items-center gap-2">
										<QuanbyLogo className="size-5" />
										E-Signing
									</SheetTitle>
									<SheetDescription>
										Navigate through your E-Signing workspace
									</SheetDescription>
								</SheetHeader>

								<div className="mt-6 flex-1 space-y-2">
									{navigationItems.map((item) => {
										const IconComponent = item.icon
										return (
											<Link
												key={item.href}
												href={item.href}
												className={cn(
													"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
													item.isActive
														? "bg-muted text-foreground"
														: "text-muted-foreground hover:text-foreground"
												)}
											>
												<IconComponent className="size-4" />
												{item.title}
											</Link>
										)
									})}
								</div>

								<div className="mt-auto space-y-4">
									<div className="border-t pt-6">
										<div className="flex items-center justify-between">
											<span className="text-sm text-muted-foreground">
												Theme
											</span>
											<ModeToggle />
										</div>
									</div>

									{/* User Profile Section - Bottom Left */}
									<div className="border-t pt-4">
										<SiteUser />
									</div>
								</div>
							</SheetContent>
						</Sheet>
					)}
				</div>
			</div>
		</nav>
	)
}

function NotificationBell() {
	const { status } = useSession()
	const isAuthenticated = status === "authenticated"

	// Lightweight unread count query; fallback to 0
	const { data: unread = 0 } = trpc.notifications.unreadCount.useQuery(
		undefined,
		{
			enabled: isAuthenticated,
			staleTime: 10_000,
			refetchInterval: 10_000
		}
	)
	return (
		<Link
			href="/notifications"
			className={cn(
				"relative inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			)}
		>
			<Bell className="size-4" />
			{unread > 0 && (
				<span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium leading-none text-white">
					{unread > 99 ? "99+" : unread}
				</span>
			)}
			<span className="sr-only">Notifications</span>
		</Link>
	)
}
