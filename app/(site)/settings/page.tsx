"use client"

import { motion } from "motion/react"

import { Card, CardContent } from "@/core/components/ui/card"

import { ChangePasswordForm } from "@/features/profile/components/forms/change-password-form"
import { TwoFactorForm } from "@/features/two-factor-auth/components/two-factor-form"

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

export default function SettingsPage() {
	return (
		<div className="relative min-h-screen overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-rose-500/[0.02] blur-3xl dark:from-indigo-500/[0.05] dark:via-transparent dark:to-rose-500/[0.05]" />

			{/* Animated Background Shapes - Fixed positioning for full screen coverage */}
			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<ElegantShape
					delay={0.3}
					width={450}
					height={600}
					rotate={-12}
					borderRadius={24}
					gradient="from-purple-500/[0.4] dark:from-purple-500/[0.3]"
					className="absolute left-[-20%] top-[-15%]"
				/>
				<ElegantShape
					delay={0.5}
					width={700}
					height={250}
					rotate={18}
					borderRadius={20}
					gradient="from-teal-500/[0.4] dark:from-teal-500/[0.3]"
					className="absolute bottom-[-10%] right-[-25%]"
				/>
				<ElegantShape
					delay={0.4}
					width={380}
					height={380}
					rotate={28}
					borderRadius={32}
					gradient="from-orange-500/[0.4] dark:from-orange-500/[0.3]"
					className="absolute left-[-10%] top-[45%]"
				/>
				<ElegantShape
					delay={0.6}
					width={300}
					height={150}
					rotate={-25}
					borderRadius={12}
					gradient="from-pink-500/[0.4] dark:from-pink-500/[0.3]"
					className="absolute right-[5%] top-[-5%]"
				/>
				<ElegantShape
					delay={0.7}
					width={480}
					height={200}
					rotate={32}
					borderRadius={16}
					gradient="from-cyan-500/[0.4] dark:from-cyan-500/[0.3]"
					className="absolute right-[-15%] top-[50%]"
				/>
				{/* Additional shapes for better coverage */}
				<ElegantShape
					delay={0.8}
					width={320}
					height={400}
					rotate={-40}
					borderRadius={20}
					gradient="from-indigo-500/[0.4] dark:from-indigo-500/[0.3]"
					className="absolute right-[-8%] top-[25%]"
				/>
				<ElegantShape
					delay={0.9}
					width={250}
					height={350}
					rotate={45}
					borderRadius={16}
					gradient="from-emerald-500/[0.4] dark:from-emerald-500/[0.3]"
					className="absolute bottom-[-12%] left-[-8%]"
				/>
				<ElegantShape
					delay={1.0}
					width={200}
					height={200}
					rotate={-30}
					borderRadius={24}
					gradient="from-rose-500/[0.4] dark:from-rose-500/[0.3]"
					className="absolute bottom-[15%] left-[20%]"
				/>
			</div>

			<div className="relative z-10 mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
				{/* Page Header */}
				<div className="mb-12">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						Account Security
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Manage your password and security settings
					</p>
				</div>

				<div className="space-y-8">
					{/* Change Password Card */}
					<Card className="border border-border/60 bg-background/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
						<CardContent className="p-8">
							<div className="space-y-8">
								{/* Section Header */}
								<div>
									<h2 className="text-lg font-medium text-foreground">
										Change Password
									</h2>
									<p className="mt-1 text-sm text-muted-foreground">
										Update your account password for better security
									</p>
								</div>

								{/* Change Password Form */}
								<ChangePasswordForm />
							</div>
						</CardContent>
					</Card>

					{/* Two-Factor Authentication Card */}
					<Card className="border border-border/60 bg-background/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
						<CardContent className="p-8">
							<div className="space-y-8">
								{/* Section Header */}
								<div>
									<h2 className="text-lg font-medium text-foreground">
										Two-Factor Authentication
									</h2>
									<p className="mt-1 text-sm text-muted-foreground">
										Add an extra layer of security to your account
									</p>
								</div>

								{/* Two-Factor Form */}
								<TwoFactorForm />
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
