"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserIcon } from "lucide-react"
import { useSession } from "next-auth/react"

import { buttonVariants } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import { Separator } from "@/core/components/ui/separator"
import { cn } from "@/core/lib/utils"

import { trpc } from "@/services/trpc/client"

import { ProfileAvatar } from "@/features/profile/components/profile-avatar"

export function SummaryCard() {
	const { data: session } = useSession()
	const { data } = trpc.profile.getSummary.useQuery()
	const pathname = usePathname()

	return (
		<Card className="lg:col-span-1" suppressHydrationWarning>
			<CardContent className="pt-6">
				<div className="flex flex-col items-center text-center">
					<ProfileAvatar />

					<h2 className="mt-4 text-xl font-bold">{session?.user.name}</h2>
					{data?.organization && (
						<p className="text-gray-600">{data.organization}</p>
					)}
				</div>

				<Separator className="my-6" />

				<nav className="space-y-2">
					<Link
						href={"/profile"}
						className={cn(
							buttonVariants({
								variant: pathname === "/profile" ? "secondary" : "ghost"
							}),
							"w-full justify-start text-base"
						)}
					>
						<UserIcon className="size-4" />
						<span>Profile</span>
					</Link>
				</nav>
			</CardContent>
		</Card>
	)
}
