import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		AUTH_SECRET:
			process.env.NODE_ENV === "production"
				? z.string()
				: z.string().optional(),
		AUTH_URL: z.string(),
		DATABASE_URL: z.string().min(1),
		DIRECT_URL: z.string().min(1),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		MISTRAL_API_KEY: z.string().optional(),
		EMAIL_HOST: z.string(),
		EMAIL_PORT: z.coerce.number(),
		EMAIL_USER: z.string(),
		EMAIL_PASS: z.string(),
		EMAIL_FROM: z.string(),
		EMAIL_FROM_NAME: z.string(),
		VIDEO_SDK_API_KEY: z.string(),
		VIDEO_SDK_SECRET: z.string(),
		SUPABASE_SERVICE_ROLE_KEY: z.string()
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
		NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string()
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		AUTH_SECRET: process.env.AUTH_SECRET,
		AUTH_URL: process.env.AUTH_URL,
		DATABASE_URL: process.env.DATABASE_URL,
		VIDEO_SDK_API_KEY: process.env.VIDEO_SDK_API_KEY,
		VIDEO_SDK_SECRET: process.env.VIDEO_SDK_SECRET,
		DIRECT_URL: process.env.DIRECT_URL,
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
		NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		NODE_ENV: process.env.NODE_ENV,
		MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
		EMAIL_HOST: process.env.EMAIL_HOST,
		EMAIL_PORT: process.env.EMAIL_PORT,
		EMAIL_USER: process.env.EMAIL_USER,
		EMAIL_PASS: process.env.EMAIL_PASS,
		EMAIL_FROM: process.env.EMAIL_FROM,
		EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
		SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true
})
