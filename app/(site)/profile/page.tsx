"use client"

import { motion } from "motion/react"
import { useSession } from "next-auth/react"

import { Card, CardContent } from "@/core/components/ui/card"

import { DefaultSignatureCard } from "@/features/profile/components/default-signature-card"
import { PersonalInformationForm } from "@/features/profile/components/forms/personal-information-form"
import { ProfileAvatar } from "@/features/profile/components/profile-avatar"

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

export default function ProfilePage() {
	const { data: session } = useSession()

	return (
		<div className="relative min-h-screen overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-rose-500/[0.02] blur-3xl dark:from-indigo-500/[0.05] dark:via-transparent dark:to-rose-500/[0.05]" />

			{/* Animated Background Shapes - Fixed positioning for full screen coverage */}
			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<ElegantShape
					delay={0.3}
					width={400}
					height={600}
					rotate={-8}
					borderRadius={24}
					gradient="from-indigo-500/[0.4] dark:from-indigo-500/[0.3]"
					className="absolute left-[-20%] top-[-15%]"
				/>
				<ElegantShape
					delay={0.5}
					width={700}
					height={250}
					rotate={15}
					borderRadius={20}
					gradient="from-rose-500/[0.4] dark:from-rose-500/[0.3]"
					className="absolute bottom-[-10%] right-[-25%]"
				/>
				<ElegantShape
					delay={0.4}
					width={350}
					height={350}
					rotate={24}
					borderRadius={32}
					gradient="from-violet-500/[0.4] dark:from-violet-500/[0.3]"
					className="absolute left-[-10%] top-[35%]"
				/>
				<ElegantShape
					delay={0.6}
					width={300}
					height={150}
					rotate={-20}
					borderRadius={12}
					gradient="from-amber-500/[0.4] dark:from-amber-500/[0.3]"
					className="absolute right-[5%] top-[-5%]"
				/>
				<ElegantShape
					delay={0.7}
					width={450}
					height={200}
					rotate={35}
					borderRadius={16}
					gradient="from-emerald-500/[0.4] dark:from-emerald-500/[0.3]"
					className="absolute right-[-15%] top-[40%]"
				/>
				<ElegantShape
					delay={0.2}
					width={250}
					height={250}
					rotate={-25}
					borderRadius={28}
					gradient="from-blue-500/[0.4] dark:from-blue-500/[0.3]"
					className="absolute bottom-[5%] left-[15%]"
				/>
				{/* Additional shapes for better coverage */}
				<ElegantShape
					delay={0.8}
					width={300}
					height={400}
					rotate={45}
					borderRadius={20}
					gradient="from-purple-500/[0.4] dark:from-purple-500/[0.3]"
					className="absolute right-[-10%] top-[20%]"
				/>
				<ElegantShape
					delay={0.9}
					width={200}
					height={300}
					rotate={-35}
					borderRadius={16}
					gradient="from-cyan-500/[0.4] dark:from-cyan-500/[0.3]"
					className="absolute bottom-[-10%] left-[-5%]"
				/>
			</div>

			<div className="relative z-10 mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
				{/* Page Header */}
				<div className="mb-12">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						Profile Settings
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Manage your account information
					</p>
				</div>

				<div className="space-y-8">
					{/* Profile Avatar Card */}
					<Card className="border border-border/60 bg-background/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
						<CardContent className="p-8">
							<div className="space-y-4 text-center">
								<ProfileAvatar />
								<div>
									<h3 className="text-xl font-medium text-foreground">
										{session?.user?.name ?? "User"}
									</h3>
									<p className="mt-1 text-sm text-muted-foreground">
										Upload your avatar
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Personal Information Card */}
					<Card className="border border-border/60 bg-background/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
						<CardContent className="p-8">
							<div className="space-y-8">
								{/* Section Header */}
								<div>
									<h2 className="text-lg font-medium text-foreground">
										Personal Information
									</h2>
									<p className="mt-1 text-sm text-muted-foreground">
										Update your details below
									</p>
								</div>

								{/* Form Content */}
								<PersonalInformationForm />
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Default Signature Card */}
				<div className="mt-8">
					<DefaultSignatureCard />
				</div>
			</div>
		</div>
	)
}
