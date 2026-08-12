import { createTRPCRouter } from "@/services/trpc/init"

import { postRouter } from "@/app/test/(page)/_api/post-router"

export const testRouter = createTRPCRouter({
	post: postRouter
})
