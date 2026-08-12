import { type Role } from "@prisma/client"
import {
	BarChartIcon,
	BellIcon,
	BookIcon,
	CalendarIcon,
	ClipboardCheckIcon,
	EyeIcon,
	FileTextIcon,
	HouseIcon,
	LayersIcon,
	MailIcon,
	MessageSquareIcon,
	PenToolIcon,
	SettingsIcon,
	ShieldIcon,
	UserCheckIcon,
	UserIcon,
	UsersIcon
} from "lucide-react"

export type RoleType = (typeof Role)[keyof typeof Role]

export interface NavItem {
	title: string
	url: string
	icon?: IconName
	roles?: RoleType[]
	isActive?: boolean
	items?: NavItem[]
}

export interface NavItemGroup {
	label?: string
	items?: NavItem[]
	roles?: RoleType[]
}

export type NavGroups = Record<string, NavItemGroup>

export const iconMap = {
	house: HouseIcon,
	document: FileTextIcon,
	mail: MailIcon,
	message: MessageSquareIcon,
	shield: ShieldIcon,
	calendar: CalendarIcon,
	clipboard: ClipboardCheckIcon,
	bell: BellIcon,
	users: UsersIcon,
	chart: BarChartIcon,
	userCheck: UserCheckIcon,
	eye: EyeIcon,
	layers: LayersIcon,
	user: UserIcon,
	settings: SettingsIcon,
	signature: PenToolIcon,
	book: BookIcon
} as const

type IconName = keyof typeof iconMap

// ------------------------------------------------------------
// Landing Page
// ------------------------------------------------------------

const homeConfig: NavItem[] = [
	{
		icon: "house",
		title: "Features",
		url: "#features"
	},
	{
		icon: "book",
		title: "Pricing",
		url: "#pricing"
	},
	{
		icon: "mail",
		title: "Contact Us",
		url: "#contact-us"
	},
	{
		icon: "users",
		title: "About Us",
		url: "#about-us"
	}
]

const footerConfig: NavGroups = {
	product: {
		label: "Product",
		items: [
			{
				title: "Features",
				url: "#features"
			},
			{
				title: "Pricing",
				url: "#pricing"
			},
			{
				title: "Security",
				url: "#security"
			},
			{
				title: "Templates",
				url: "#templates"
			}
		]
	},
	company: {
		label: "Company",
		items: [
			{
				title: "About Us",
				url: "#about-us"
			},
			{
				title: "Blog",
				url: "#blog"
			},
			{
				title: "Contact Us",
				url: "#contact-us"
			},
			{
				title: "Careers",
				url: "#careers"
			},
			{
				title: "News",
				url: "#news"
			}
		]
	},
	support: {
		label: "Support",
		items: [
			{
				title: "Help Center",
				url: "#help-center"
			},
			{
				title: "Privacy Policy",
				url: "#privacy-policy"
			},
			{
				title: "Terms of Service",
				url: "#terms-of-service"
			},
			{
				title: "FAQ",
				url: "#faq"
			}
		]
	}
}

// ------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------

// --- Unified Navigation Config ---
const sidebarConfig: NavGroups = {
	general: {
		label: "General",
		roles: ["ADMIN", "SUPER_ADMIN"],
		items: [
			{
				title: "Dashboard",
				url: "/dashboard",
				icon: "house"
			},
			{
				title: "Users",
				url: "/dashboard/users",
				icon: "users"
			},
			{
				title: "Envelope Management",
				url: "/dashboard/envelope2",
				icon: "mail"
			},
			{
				title: "Document Management",
				url: "/dashboard/document2",
				icon: "document"
			},
			{
				title: "Audit Events",
				url: "/dashboard/audit-event",
				icon: "shield"
			}
		]
	}
}

const navbarConfig: NavItem[] = [
	{
		title: "Features",
		url: "#features"
	},
	{
		title: "Pricing",
		url: "#pricing"
	},
	{
		title: "Contact Us",
		url: "#contact-us"
	}
]

const siteUserConfig: NavItem[] = [
	{
		title: "Profile",
		url: "/profile",
		icon: "user"
	},
	{
		title: "Notifications",
		url: "/notifications",
		icon: "bell"
	},
	{
		title: "Settings",
		url: "/settings",
		icon: "settings"
	}
]

const profileConfig: NavItem[] = [
	{
		title: "Profile",
		url: "/profile",
		icon: "user"
	}
]

// --- Navigation Filtering Functions ---

function filterNavItemsByRole(
	navItems: NavItem[],
	userRole?: string | null
): NavItem[] {
	return navItems.filter((item) => {
		const roles = item.roles
		return !roles || !userRole || roles.includes(userRole as RoleType)
	})
}

function filterNavGroupByRole(navGroups: NavGroups, userRole?: string | null) {
	return Object.fromEntries(
		Object.entries(navGroups)
			.map(([key, group]) => {
				const items =
					group.items?.filter((item) => {
						const roles = item.roles ?? group.roles
						return !roles || !userRole || roles.includes(userRole as RoleType)
					}) ?? []
				return [key, { ...group, items }] as const
			})
			.filter(([, group]) => group.items.length > 0)
	)
}

// --- Exported Functions ---

export function getHomeConfig(): NavItem[] {
	return homeConfig
}

export function getFooterGroups(): NavGroups {
	return footerConfig
}

export function getSidebarGroups(userRole?: string | null): NavGroups {
	return filterNavGroupByRole(sidebarConfig, userRole)
}

export function getNavbarItems(userRole?: string | null): NavItem[] {
	return filterNavItemsByRole(navbarConfig, userRole)
}

export function getSiteUserItems(userRole?: string | null): NavItem[] {
	return filterNavItemsByRole(siteUserConfig, userRole)
}

export function getProfileItems(): NavItem[] {
	return profileConfig
}
