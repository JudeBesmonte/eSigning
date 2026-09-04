"use client"

import { useState } from "react"
import {
	AlertCircleIcon,
	BellIcon,
	CheckCircleIcon,
	InfoIcon,
	MoreHorizontalIcon,
	SettingsIcon,
	Trash2Icon
} from "lucide-react"
import { useSession } from "next-auth/react"

import { buttonVariants } from "@/core/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/core/components/ui/dropdown-menu"
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from "@/core/components/ui/popover"
import { ScrollArea } from "@/core/components/ui/scroll-area"
import { Separator } from "@/core/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/core/components/ui/toggle-group"
import { cn } from "@/core/lib/utils"

import { trpc } from "@/services/trpc/client"

export function NotificationPopover() {
	const { status } = useSession()
	const isAuthenticated = status === "authenticated"
	const utils = trpc.useUtils()
	const { data: notifications = [] } = trpc.notifications.list.useQuery(
		undefined,
		{
			enabled: isAuthenticated,
			refetchInterval: 10_000,
			staleTime: 5_000
		}
	)

	// Live updates via subscription + background polling fallback
	trpc.notifications.subscribe.useSubscription(undefined, {
		enabled: isAuthenticated,
		onData: () => {
			void utils.notifications.list.invalidate()
			void utils.notifications.unreadCount.invalidate()
		}
	})

	const unreadCount = notifications.filter((n) => !n.read).length
	const [open, setOpen] = useState(false)

	// Filter state: 'all' | 'unread' | 'read'
	const [filter, setFilter] = useState<"all" | "unread" | "read">("all")

	// Filter notifications based on filter state
	const filteredNotifications = notifications.filter((n) => {
		if (filter === "all") return true
		if (filter === "unread") return !n.read
		if (filter === "read") return n.read
		return true
	})

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				className={cn(
					buttonVariants({ variant: "ghost", size: "icon" }),
					"relative size-8"
				)}
				suppressHydrationWarning
			>
				<BellIcon className="shrink-0" />
				<span className="sr-only">Notifications</span>
				{unreadCount > 0 && (
					<span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 p-0">
				<div className="flex items-center justify-between px-2.5 py-2">
					<h1 className="font-semibold">Notifications ({unreadCount})</h1>
					<NotificationActions />
				</div>
				<Separator />

				<NotificationFilter filter={filter} setFilter={setFilter} />

				<ScrollArea className="h-80">
					{filteredNotifications.length === 0 ? (
						<div className="flex h-80 flex-1 flex-col items-center justify-center p-4 text-center">
							<BellIcon className="mb-2 h-8 w-8 text-gray-400" />
							<p className="text-sm text-gray-500">No notifications</p>
						</div>
					) : (
						<div className="space-y-1 p-2 py-0">
							{filteredNotifications.map((notification) => (
								<div
									key={notification.id}
									className={`cursor-pointer rounded-md p-4 hover:bg-gray-50 ${!notification.read ? "bg-blue-50 dark:bg-blue-950" : ""}`}
								>
									<div className="flex items-center gap-3">
										{notification.type === "success" && (
											<CheckCircleIcon className="h-4 w-4" />
										)}
										{notification.type === "error" && (
											<AlertCircleIcon className="h-4 w-4" />
										)}
										{notification.type === "info" && (
											<InfoIcon className="h-4 w-4" />
										)}
										<div className="flex-1">
											<p className="text-sm font-medium">
												{notification.title}
											</p>
											<p className="mt-0.5 text-sm text-gray-600">
												{notification.message}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</PopoverContent>
		</Popover>
	)
}

const NotificationFilter = ({
	filter,
	setFilter
}: {
	filter: "all" | "unread" | "read"
	setFilter: (filter: "all" | "unread" | "read") => void
}) => {
	return (
		<ToggleGroup
			type="single"
			variant="secondary"
			size="xs"
			value={filter}
			onValueChange={(val) =>
				setFilter((val as "all" | "unread" | "read") || "all")
			}
			className="items-center justify-start px-2 py-1.5"
		>
			<ToggleGroupItem
				value="all"
				aria-label="Show all notifications"
				className="rounded-xl"
			>
				All
			</ToggleGroupItem>
			<ToggleGroupItem
				value="unread"
				aria-label="Show unread notifications"
				className="rounded-xl"
			>
				Unread
			</ToggleGroupItem>
			<ToggleGroupItem
				value="read"
				aria-label="Show read notifications"
				className="rounded-xl"
			>
				Read
			</ToggleGroupItem>
		</ToggleGroup>
	)
}

const NotificationActions = () => {
	const utils = trpc.useUtils()
	const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
		onSuccess: () => {
			void utils.notifications.list.invalidate()
			void utils.notifications.unreadCount.invalidate()
		}
	})
	const clearAllNotifications = trpc.notifications.clearAll.useMutation({
		onSuccess: () => {
			void utils.notifications.list.invalidate()
			void utils.notifications.unreadCount.invalidate()
		}
	})

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger
				className={cn(
					buttonVariants({ variant: "ghost", size: "icon" }),
					"relative size-8"
				)}
				suppressHydrationWarning
			>
				<MoreHorizontalIcon className="size-4" />
				<span className="sr-only">Notification actions</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => markAllAsRead.mutate()}>
					<CheckCircleIcon />
					Mark all as read
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => clearAllNotifications.mutate()}>
					<Trash2Icon />
					Clear all
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem>
					<SettingsIcon />
					Notification settings
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
