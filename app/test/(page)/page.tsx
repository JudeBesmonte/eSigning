import Link from "next/link"

import { auth } from "@/services/next-auth"
import { HydrateClient, trpc } from "@/services/trpc/server"

import { LatestPost } from "@/app/test/(page)/_components/post"

export default async function Home() {
	const session = await auth()
	const hello = await trpc.test.post.hello({ text: "from tRPC" })

	await trpc.test.post.getLatest.prefetch()

	return (
		<HydrateClient>
			<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
				<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
					<h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
						<span className="text-[hsl(280,100%,70%)]">Play</span>ground
					</h1>
					<div className="flex flex-col items-center gap-2">
						<p className="text-2xl text-white">
							{hello ? hello.greeting : "Loading tRPC query..."}
						</p>

						<div className="flex flex-col items-center justify-center gap-4">
							<p className="text-center text-2xl text-white">
								{session && <span>Logged in as {session.user?.name}</span>}
							</p>
							<Link
								href={session ? "/api/auth/signout" : "/api/auth/signin"}
								className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
							>
								{session ? "Sign out" : "Sign in"}
							</Link>
						</div>
					</div>

					{session?.user && <LatestPost />}

					<div className="mt-8">
						<h2 className="mb-4 text-center text-2xl font-bold">
							Playground Features
						</h2>
						<div className="flex flex-col items-center gap-4">
							<Link
								href="/test/file-upload"
								className="rounded-lg bg-white/10 px-6 py-4 text-center font-semibold no-underline transition hover:bg-white/20"
							>
								📁 File Upload tRPC
								<p className="mt-1 text-sm opacity-80">
									Test blob file uploads with tRPC
								</p>
							</Link>
						</div>
					</div>
				</div>
			</main>
		</HydrateClient>
	)
}
