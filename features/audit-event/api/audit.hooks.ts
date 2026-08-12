import { trpc } from "@/services/trpc/client"

import type { GetAuditEventsInput } from "./audit.schema"

/**
 * Hook to fetch audit events for envelopes the current user has access to
 */
export function useMyEnvelopeEvents(
	input: Omit<GetAuditEventsInput, "envelopeId">
) {
	return trpc.auditEvent.getMyEnvelopeEvents.useQuery(input)
}

/**
 * Hook to fetch all audit events (admin use)
 */
export function useAuditEvents(input: GetAuditEventsInput) {
	return trpc.auditEvent.getAll.useQuery(input)
}

/**
 * Hook to fetch a specific audit event by ID
 */
export function useAuditEventById(id: string) {
	return trpc.auditEvent.getById.useQuery({ id })
}

/**
 * Hook to fetch audit event statistics
 */
export function useAuditEventStats() {
	return trpc.auditEvent.getStats.useQuery()
}

/**
 * Hook to create a new audit event
 */
export function useCreateAuditEvent() {
	return trpc.auditEvent.create.useMutation()
}
