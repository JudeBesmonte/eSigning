import type { AuditEventType } from "@prisma/client"

// Define the audit event interface based on the actual API response
export interface AuditEvent {
  id: string
  eventType: AuditEventType
  description: string
  userEmail?: string | null
  userName?: string | null
  timestamp: Date
  metadata?: unknown
  envelopeId?: string | null
  documentId?: string | null
  recipientId?: string | null
  envelope?: {
    id: string
    title: string
    status: string
  } | null
  document?: {
    id: string
    name: string
    type: string
  } | null
  recipient?: {
    id: string
    role: string
    status: string
    user: {
      name: string | null
      email: string | null
    } | null
  } | null
}

export type EventCategory = "envelope" | "document" | "recipient" | "system"
export type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

// Utility function to get event type display name
export function getEventTypeDisplayName(eventType: AuditEventType): string {
  const displayNames: Record<AuditEventType, string> = {
    ENVELOPE_CREATED: "Envelope Created",
    ENVELOPE_PUBLISHED: "Envelope Published",
    ENVELOPE_VIEWED: "Envelope Viewed",
    ENVELOPE_COMPLETED: "Envelope Completed",
    ENVELOPE_CANCELLED: "Envelope Cancelled",
    ENVELOPE_EXPIRED: "Envelope Expired",
    ENVELOPE_PENDING_APPROVAL: "Pending Approval",
    ENVELOPE_APPROVED: "Envelope Approved",
    ENVELOPE_REJECTED: "Envelope Rejected",
    DOCUMENT_UPLOADED: "Document Uploaded",
    DOCUMENT_VIEWED: "Document Viewed",
    DOCUMENT_SIGNED: "Document Signed",
    DOCUMENT_HASH_RECORDED: "Document Hash Recorded",
    DOCUMENT_HASH_UPDATED: "Document Signed",
    RECIPIENT_ADDED: "Recipient Added",
    RECIPIENT_REMOVED: "Recipient Removed",
    RECIPIENT_VIEWED: "Recipient Viewed",
    RECIPIENT_SIGNED: "Recipient Signed",
    RECIPIENT_DECLINED: "Recipient Declined",
    REMINDER_SENT: "Reminder Sent",
    SETTINGS_UPDATED: "Settings Updated"
  }

  return displayNames[eventType] || eventType
}

// Utility function to get event type color/variant for UI
export function getEventTypeVariant(eventType: AuditEventType): BadgeVariant {
  const variants: Record<AuditEventType, BadgeVariant> = {
    ENVELOPE_CREATED: "default",
    ENVELOPE_PUBLISHED: "default",
    ENVELOPE_VIEWED: "secondary",
    ENVELOPE_COMPLETED: "default",
    ENVELOPE_CANCELLED: "destructive",
    ENVELOPE_EXPIRED: "destructive",
    ENVELOPE_PENDING_APPROVAL: "outline",
    ENVELOPE_APPROVED: "default",
    ENVELOPE_REJECTED: "destructive",
    DOCUMENT_UPLOADED: "default",
    DOCUMENT_VIEWED: "secondary",
    DOCUMENT_SIGNED: "default",
    DOCUMENT_HASH_RECORDED: "default",
    DOCUMENT_HASH_UPDATED: "default",
    RECIPIENT_ADDED: "default",
    RECIPIENT_REMOVED: "destructive",
    RECIPIENT_VIEWED: "secondary",
    RECIPIENT_SIGNED: "default",
    RECIPIENT_DECLINED: "destructive",
    REMINDER_SENT: "outline",
    SETTINGS_UPDATED: "secondary"
  }

  return variants[eventType] || "default"
}

// Utility function to get icon for event type
export function getEventTypeIcon(eventType: AuditEventType): string {
  const icons: Record<AuditEventType, string> = {
    ENVELOPE_CREATED: "📄",
    ENVELOPE_PUBLISHED: "📤",
    ENVELOPE_VIEWED: "👁️",
    ENVELOPE_COMPLETED: "✅",
    ENVELOPE_CANCELLED: "❌",
    ENVELOPE_EXPIRED: "⏰",
    ENVELOPE_PENDING_APPROVAL: "⏳",
    ENVELOPE_APPROVED: "✅",
    ENVELOPE_REJECTED: "❌",
    DOCUMENT_UPLOADED: "📁",
    DOCUMENT_VIEWED: "👁️",
    DOCUMENT_SIGNED: "✍️",
    DOCUMENT_HASH_RECORDED: "🔒",
    DOCUMENT_HASH_UPDATED: "🔄",
    RECIPIENT_ADDED: "👤➕",
    RECIPIENT_REMOVED: "👤➖",
    RECIPIENT_VIEWED: "👁️",
    RECIPIENT_SIGNED: "✍️",
    RECIPIENT_DECLINED: "❌",
    REMINDER_SENT: "🔔",
    SETTINGS_UPDATED: "⚙️"
  }

  return icons[eventType] || "📝"
}

// Utility function to format timestamp
export function formatAuditTimestamp(timestamp: Date): string {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`

  return timestamp.toLocaleDateString()
}

// Utility function to determine if event is critical
export function isEventCritical(eventType: AuditEventType): boolean {
  const criticalEvents: AuditEventType[] = [
    "ENVELOPE_CANCELLED",
    "ENVELOPE_EXPIRED",
    "ENVELOPE_REJECTED",
    "RECIPIENT_DECLINED"
  ]

  return criticalEvents.includes(eventType)
}

// Utility function to get event category
export function getEventCategory(eventType: AuditEventType): EventCategory {
  if (eventType.startsWith("ENVELOPE_")) return "envelope"
  if (eventType.startsWith("DOCUMENT_")) return "document"
  if (eventType.startsWith("RECIPIENT_")) return "recipient"
  return "system"
}

// Utility function to filter events by category
export function filterEventsByCategory(
  events: AuditEvent[],
  category: EventCategory | "all"
): AuditEvent[] {
  if (category === "all") return events
  return events.filter(
    (event) => getEventCategory(event.eventType) === category
  )
}

// Utility function to search events by description
export function searchEvents(
  events: AuditEvent[],
  searchTerm: string
): AuditEvent[] {
  if (!searchTerm.trim()) return events

  const searchLower = searchTerm.toLowerCase()
  return events.filter((event) => {
    const descriptionMatch = event.description
      .toLowerCase()
      .includes(searchLower)
    const emailMatch =
      event.userEmail?.toLowerCase().includes(searchLower) ?? false
    const nameMatch =
      event.userName?.toLowerCase().includes(searchLower) ?? false
    const typeMatch = getEventTypeDisplayName(event.eventType)
      .toLowerCase()
      .includes(searchLower)

    return descriptionMatch || emailMatch || nameMatch || typeMatch
  })
}
