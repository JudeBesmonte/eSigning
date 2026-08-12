import { z } from "zod"

export const notificationType = z.enum(["success", "error", "info", "warning"]) // for reuse

export const notificationSchema = z.object({
	id: z.string(),
	title: z.string(),
	message: z.string(),
	type: notificationType,
	read: z.boolean(),
	timestamp: z.date(),
	link: z.string().nullable().optional()
})

export const createNotificationSchema = notificationSchema.omit({
	id: true,
	timestamp: true,
	read: true
})

export type NotificationSchema = z.infer<typeof notificationSchema>
export type NotificationType = z.infer<typeof notificationType>
