"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react"
import { ChevronRightIcon } from "lucide-react"

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from "@/core/components/ui/collapsible"
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem
} from "@/core/components/ui/sidebar"
import type { NavItem } from "@/core/lib/nav.config"
import { iconMap } from "@/core/lib/nav.config"

function renderSubMenu(items: NavItem[]) {
	return (
		<SidebarMenuSub>
			{items.map((subItem) => {
				const IconComponent = subItem.icon ? iconMap[subItem.icon] : null
				return (
					<SidebarMenuSubItem key={subItem.title}>
						<SidebarMenuSubButton asChild>
							<Link href={subItem.url}>
								{IconComponent && <IconComponent className="h-4 w-4" />}
								<span>{subItem.title}</span>
							</Link>
						</SidebarMenuSubButton>
					</SidebarMenuSubItem>
				)
			})}
		</SidebarMenuSub>
	)
}

export function NavMain({
	label,
	items
}: {
	label?: string
	items?: NavItem[]
}) {
	const currentPath = usePathname()

	if (!items || items.length === 0) return null

	return (
		<SidebarGroup>
			{label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
			<SidebarMenu>
				{items.map((item) => {
					const isActive = item.url === currentPath
					const hasSubItems = !!item.items?.length
					const IconComponent = item.icon ? iconMap[item.icon] : null

					return (
						<Collapsible key={item.title} asChild defaultOpen={item.isActive}>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={isActive}
									tooltip={item.title}
								>
									<Link href={item.url}>
										{IconComponent && <IconComponent className="h-4 w-4" />}
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
								{hasSubItems && (
									<>
										<CollapsibleTrigger asChild>
											<SidebarMenuAction className="data-[state=open]:rotate-90">
												<ChevronRightIcon />
												<span className="sr-only">Toggle</span>
											</SidebarMenuAction>
										</CollapsibleTrigger>
										<CollapsibleContent>
											{renderSubMenu(item.items!)}
										</CollapsibleContent>
									</>
								)}
							</SidebarMenuItem>
						</Collapsible>
					)
				})}
			</SidebarMenu>
		</SidebarGroup>
	)
}
