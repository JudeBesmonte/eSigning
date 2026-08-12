import { AuditEventType } from "@prisma/client"
import { z } from "zod"

export const createAuditEventSchema = z.object({
  eventType: z.nativeEnum(AuditEventType),
  description: z.string().min(1, "Description is required"),
  userEmail: z.string().email().optional(),
  userName: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  envelopeId: z.string().optional(),
  documentId: z.string().optional(),
  recipientId: z.string().optional()
})

export const getAuditEventsSchema = z.object({
  envelopeId: z.string().optional(),
  documentId: z.string().optional(),
  recipientId: z.string().optional(),
  eventType: z.nativeEnum(AuditEventType).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
})

export const getAuditEventByIdSchema = z.object({
  id: z.string()
})

export const deleteAuditEventSchema = z.object({
  id: z.string()
})

export const deleteAuditEventsByTypeSchema = z.object({
  eventType: z.string().optional(),
  description: z.string().optional()
})

export type CreateAuditEventInput = z.infer<typeof createAuditEventSchema>
export type GetAuditEventsInput = z.infer<typeof getAuditEventsSchema>
export type GetAuditEventByIdInput = z.infer<typeof getAuditEventByIdSchema>
