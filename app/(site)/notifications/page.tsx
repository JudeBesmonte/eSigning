"use client"

import { useState } from "react"
import { AlertTriangle, Bell, CheckCircle2, Info } from "lucide-react"
import { motion } from "motion/react"
import { useSession } from "next-auth/react"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"

import { trpc } from "@/services/trpc/client"

function ElegantShape({
	className,
	delay = 0,
	width = 400,
	height = 100,
	rotate = 0,
	gradient = "from-white/[0.08]",
	borderRadius = 16
}: {
	className?: string
	delay?: number
	width?: number
	height?: number
	rotate?: number
	gradient?: string
	borderRadius?: number
}) {
	return (
		<motion.div
			initial={{
				opacity: 0,
				y: -150,
				rotate: rotate - 15
			}}
			animate={{
				opacity: 1,
				y: 0,
				rotate: rotate
			}}
			transition={{
				duration: 2.4,
				delay,
				ease: [0.23, 0.86, 0.39, 0.96],
				opacity: { duration: 1.2 }
			}}
			className={className}
		>
			<motion.div
				animate={{
					y: [0, 15, 0]
				}}
				transition={{
					duration: 12,
					repeat: Number.POSITIVE_INFINITY,
					ease: "easeInOut"
				}}
				style={{
					width,
					height
				}}
				className="relative"
			>
				<div
					style={{ borderRadius }}
					className={`absolute inset-0 bg-gradient-to-r to-transparent ${gradient} shadow-[0_2px_16px_-2px_rgba(255,255,255,0.04)] ring-1 ring-white/[0.03] backdrop-blur-[1px] after:absolute after:inset-0 after:rounded-[inherit] after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.12),transparent_70%)] dark:ring-white/[0.02]`}
				/>
			</motion.div>
		</motion.div>
	)
}

export default function NotificationsPage() {
	const { status } = useSession()
	const isAuthenticated = status === "authenticated"
	const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
	const { data: notifications = [], refetch } =
		trpc.notifications.list.useQuery(undefined, {
			enabled: isAuthenticated
		})
	const markAll = trpc.notifications.markAllAsRead.useMutation({
		onSuccess: () => refetch()
	})
	const markOne = trpc.notifications.markAsRead.useMutation({
		onSuccess: () => refetch()
	})

	const filtered = notifications.filter((n) =>
		filter === "all" ? true : filter === "unread" ? !n.read : n.read
	)
	const unread = notifications.filter((n) => !n.read).length

	return (
		<div className="relative min-h-screen overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-rose-500/[0.02] blur-3xl dark:from-indigo-500/[0.05] dark:via-transparent dark:to-rose-500/[0.05]" />

			{/* Animated Background Shapes - Fixed positioning for full screen coverage */}
			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<ElegantShape
					delay={0.2}
					width={380}
					height={580}
					rotate={-10}
					borderRadius={24}
					gradient="from-yellow-500/[0.4] dark:from-yellow-500/[0.3]"
					className="absolute left-[-20%] top-[-15%]"
				/>
				<ElegantShape
					delay={0.4}
					width={680}
					height={240}
					rotate={20}
					borderRadius={20}
					gradient="from-green-500/[0.4] dark:from-green-500/[0.3]"
					className="absolute bottom-[-10%] right-[-25%]"
				/>
				<ElegantShape
					delay={0.6}
					width={320}
					height={320}
					rotate={30}
					borderRadius={32}
					gradient="from-red-500/[0.4] dark:from-red-500/[0.3]"
					className="absolute left-[-12%] top-[35%]"
				/>
				<ElegantShape
					delay={0.3}
					width={290}
					height={140}
					rotate={-22}
					borderRadius={12}
					gradient="from-indigo-500/[0.4] dark:from-indigo-500/[0.3]"
					className="absolute right-[8%] top-[-8%]"
				/>
				<ElegantShape
					delay={0.8}
					width={420}
					height={180}
					rotate={38}
					borderRadius={16}
					gradient="from-violet-500/[0.4] dark:from-violet-500/[0.3]"
					className="absolute right-[-15%] top-[42%]"
				/>
				<ElegantShape
					delay={0.5}
					width={230}
					height={230}
					rotate={-30}
					borderRadius={28}
					gradient="from-rose-500/[0.4] dark:from-rose-500/[0.3]"
					className="absolute bottom-[10%] left-[18%]"
				/>
				{/* Additional shapes for better coverage */}
				<ElegantShape
					delay={0.7}
					width={300}
					height={450}
					rotate={25}
					borderRadius={20}
					gradient="from-sky-500/[0.4] dark:from-sky-500/[0.3]"
					className="absolute right-[-10%] top-[20%]"
				/>
				<ElegantShape
					delay={0.9}
					width={280}
					height={380}
					rotate={-35}
					borderRadius={16}
					gradient="from-lime-500/[0.4] dark:from-lime-500/[0.3]"
					className="absolute bottom-[-15%] left-[-8%]"
				/>
				<ElegantShape
					delay={1.1}
					width={200}
					height={280}
					rotate={50}
					borderRadius={24}
					gradient="from-pink-500/[0.4] dark:from-pink-500/[0.3]"
					className="absolute bottom-[25%] right-[15%]"
				/>
			</div>

			<div className="relative z-10 mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
				{/* Page Header */}
				<div className="mb-12 flex items-center justify-between">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						Notifications
					</h1>
					<div className="flex items-center gap-2">
						<Button
							variant={filter === "all" ? "default" : "outline"}
							size="sm"
							onClick={() => setFilter("all")}
						>
							All
						</Button>
						<Button
							variant={filter === "unread" ? "default" : "outline"}
							size="sm"
							onClick={() => setFilter("unread")}
						>
							Unread ({unread})
						</Button>
						<Button
							variant={filter === "read" ? "default" : "outline"}
							size="sm"
							onClick={() => setFilter("read")}
						>
							Read
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => markAll.mutate()}
							disabled={unread === 0 || markAll.isPending}
						>
							Mark all read
						</Button>
					</div>
				</div>

				<Card className="border border-border/60 bg-background/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
					<CardContent className="p-0">
						{filtered.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-muted-foreground">
								<Bell className="size-6 opacity-60" />
								<span>No notifications</span>
							</div>
						) : (
							<ul className="divide-y">
								{filtered.map((n) => (
									<li
										key={n.id}
										className="flex gap-3 p-4 transition-colors hover:bg-muted/40"
									>
										<Icon type={n.type} />
										<div className="flex flex-1 flex-col">
											<div className="flex items-start justify-between gap-4">
												<div>
													<p className="text-sm font-medium leading-snug text-foreground">
														{n.title}
													</p>
													<p className="mt-0.5 text-xs text-muted-foreground">
														{n.message}
													</p>
												</div>
												<div className="flex items-center gap-2">
													{!n.read && (
														<Button
															variant="ghost"
															size="sm"
															onClick={() => markOne.mutate(n.id)}
															className="text-xs"
														>
															Mark read
														</Button>
													)}
												</div>
											</div>
											<div className="mt-2 flex items-center gap-2">
												<span className="text-[10px] uppercase tracking-wide text-muted-foreground">
													{new Date(n.timestamp).toLocaleString()}
												</span>
												{!n.read && (
													<span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
												)}
											</div>
										</div>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

function Icon({ type }: { type: string }) {
	if (type === "success")
		return <CheckCircle2 className="mt-1 size-4 text-green-600" />
	if (type === "warning")
		return <AlertTriangle className="mt-1 size-4 text-yellow-600" />
	if (type === "error")
		return <AlertTriangle className="mt-1 size-4 text-red-600" />
	return <Info className="mt-1 size-4 text-blue-600" />
}
