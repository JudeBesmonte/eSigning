import type { inferRouterOutputs } from "@trpc/server"

import type { auditEventRouter } from "./audit.router"

// Infer the output types from the tRPC router
type AuditEventRouterOutputs = inferRouterOutputs<typeof auditEventRouter>

// Extract the audit event with includes type from the getMyEnvelopeEvents output
export type AuditEventWithIncludes =
	AuditEventRouterOutputs["getMyEnvelopeEvents"]["data"][number]

// Extract the paginated response type
export type AuditEventsPaginatedResponse =
	AuditEventRouterOutputs["getMyEnvelopeEvents"]

// Extract individual audit event type from getById
export type AuditEventDetail = AuditEventRouterOutputs["getById"]

// Extract stats type
export type AuditEventStats = AuditEventRouterOutputs["getStats"]
