import { z } from "zod"

export const getUserDocumentsSchema = z.object({
  status: z.enum(["all", "pending", "completed", "draft", "review"]).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
})

export const getUserStatsSchema = z.object({
  // Add any input parameters if needed
})

export const getDocumentByIdSchema = z.object({
  envelopeId: z.string()
})

export const addCommentSchema = z.object({
  envelopeId: z.string(),
  comment: z.string().min(1).max(1000)
})

export const sendRemindersSchema = z.object({
  envelopeId: z.string()
})

// New schemas for dashboard statistics
export const getDashboardStatsSchema = z.object({
  timeframe: z.enum(["week", "month", "quarter", "year"]).default("month")
})

export const getEnvelopeStatusDistributionSchema = z.object({
  timeframe: z.enum(["week", "month", "quarter", "year"]).default("month")
})

export const getRecentActivitySchema = z.object({
  limit: z.number().min(1).max(1000).default(10),
  offset: z.number().min(0).default(0),
  eventType: z.string().optional(),
  timeframe: z.enum(["all", "today", "week", "month", "custom"]).default("all"),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

export const getPerformanceMetricsSchema = z.object({
  timeframe: z.enum(["week", "month", "quarter", "year"]).default("month")
})

export type GetUserDocumentsInput = z.infer<typeof getUserDocumentsSchema>
export type GetUserStatsInput = z.infer<typeof getUserStatsSchema>
export type GetDocumentByIdInput = z.infer<typeof getDocumentByIdSchema>
export type AddCommentInput = z.infer<typeof addCommentSchema>
export type SendRemindersInput = z.infer<typeof sendRemindersSchema>
export type GetDashboardStatsInput = z.infer<typeof getDashboardStatsSchema>
export type GetEnvelopeStatusDistributionInput = z.infer<
  typeof getEnvelopeStatusDistributionSchema
>
export type GetRecentActivityInput = z.infer<typeof getRecentActivitySchema>
export type GetPerformanceMetricsInput = z.infer<
  typeof getPerformanceMetricsSchema
>
