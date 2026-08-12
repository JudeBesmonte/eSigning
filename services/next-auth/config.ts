import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Role } from "@prisma/client"
import { compare } from "bcryptjs"
import {
	type DefaultSession,
	type NextAuthConfig,
	type Session,
	type User
} from "next-auth"
import { type JWT } from "next-auth/jwt"
import Credentials from "next-auth/providers/credentials"

import { db } from "@/services/prisma/db"

import { loginSchema } from "@/features/auth/api/auth.schemas"

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string
			name: string
			email: string
			image: string
			role: Role
		}
	}

	interface User {
		role: Role
	}
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
	pages: {
		signIn: "/auth/login"
	},
	providers: [
		Credentials({
			authorize: async (credentials) => {
				// Handle 2FA verification token
				if (credentials?.verificationToken) {
					const verificationToken = credentials.verificationToken as string
					const email = credentials.email as string

					try {
						// Verify the token exists and is valid
						const tokenRecord = await db.twoFactorCode.findFirst({
							where: {
								code: verificationToken,
								used: false,
								expires: { gt: new Date() }
							}
						})

						if (!tokenRecord) {
							return null
						}

						// Get the user separately
						const user = await db.user.findUnique({
							where: { id: tokenRecord.userId },
							select: {
								id: true,
								email: true,
								name: true,
								image: true,
								role: true
							}
						})

						if (!user || user.email !== email) {
							return null
						}

						// Mark token as used
						await db.twoFactorCode.update({
							where: { id: tokenRecord.id },
							data: { used: true }
						})

						return user
					} catch {
						return null
					}
				}

				// Handle regular username/password login
				const validatedFields = loginSchema.safeParse({
					email: credentials?.email,
					password: credentials?.password
				})
				if (!validatedFields.success) return null

				const { email, password } = validatedFields.data
				const user = await db.user.findUnique({
					where: { email },
					select: {
						id: true,
						email: true,
						name: true,
						image: true,
						role: true,
						password: true,
						twoFactorEnabled: true
					}
				})
				if (!user) return null

				// If 2FA is enabled, don't allow direct login
				if (user.twoFactorEnabled) return null

				const isPasswordValid = await compare(password, user.password)
				if (!isPasswordValid) return null

				return user
			}
		})
	],
	adapter: PrismaAdapter(db),
	session: { strategy: "jwt" },
	callbacks: {
		signIn: async ({ user }) => {
			const existingUser = await db.user.findUnique({ where: { id: user.id } })
			if (!existingUser) return false
			return true
		},

		redirect: async ({ url, baseUrl }) => {
			// Allows relative callback URLs
			if (url.startsWith("/")) return `${baseUrl}${url}`
			// Allows callback URLs on the same origin
			else if (new URL(url).origin === baseUrl) return url
			return baseUrl
		},

		session: ({ session, token }) => {
			return {
				...session,

				user: {
					id: token.id as string,
					name: token.name as string | undefined,
					email: token.email as string | undefined,
					image: token.image as string | undefined,
					role: token.role as Role
				}
			}
		},

		jwt: async ({
			token,
			user,
			trigger,
			session
		}: {
			token: JWT
			user?: User
			trigger?: "signIn" | "signUp" | "update"
			session?: Session
		}) => {
			if (trigger === "update" && session?.user) {
				if (session.user.name) token.name = session.user.name
				if (session.user.image) token.image = session.user.image
				if (session.user.email) token.email = session.user.email
				if (session.user.role) token.role = session.user.role
			}

			if (user) {
				token.id = user.id
				token.name = user.name
				token.email = user.email
				token.image = user.image
				token.role = user.role
			}

			return token
		}
	}
} satisfies NextAuthConfig
