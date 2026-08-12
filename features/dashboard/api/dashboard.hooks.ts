"use client"

import { trpc } from "@/services/trpc/client"

// Hook for dashboard statistics
export function useDashboardStats(
  timeframe: "week" | "month" | "quarter" | "year" = "month"
) {
  return trpc.dashboard.getDashboardStats.useQuery({ timeframe })
}

// Hook for envelope status distribution
export function useEnvelopeStatusDistribution(
  timeframe: "week" | "month" | "quarter" | "year" = "month"
) {
  return trpc.dashboard.getEnvelopeStatusDistribution.useQuery({ timeframe })
}

// Hook for recent activity with pagination and filtering
export function useRecentActivity(options?: {
  limit?: number
  offset?: number
  eventType?: string
  timeframe?: "all" | "today" | "week" | "month" | "custom"
  startDate?: string
  endDate?: string
}) {
  return trpc.dashboard.getDashboardActivity.useQuery({
    limit: options?.limit ?? 10,
    offset: options?.offset ?? 0,
    eventType: options?.eventType,
    timeframe: options?.timeframe ?? "all",
    startDate: options?.startDate,
    endDate: options?.endDate
  })
}

// Hook for performance metrics
export function usePerformanceMetrics(
  timeframe: "week" | "month" | "quarter" | "year" = "month"
) {
  return trpc.dashboard.getPerformanceMetrics.useQuery({ timeframe })
}

// Hook for user documents (existing)
export function useUserDocuments(options?: {
  status?: "all" | "pending" | "completed" | "draft" | "review"
  limit?: number
  offset?: number
}) {
  return trpc.dashboard.getUserDocuments.useQuery({
    status: options?.status ?? "all",
    limit: options?.limit ?? 50,
    offset: options?.offset ?? 0
  })
}

// Hook for user stats (existing)
export function useUserStats() {
  return trpc.dashboard.getUserStats.useQuery({})
}

// Hook for admin statistics
export function useAdminStats() {
  return trpc.dashboard.getAdminStats.useQuery()
}

// Hook for all activities without pagination (for printing)
export function useAllActivities(options?: {
  eventType?: string
  timeframe?: "all" | "today" | "week" | "month" | "custom"
  startDate?: string
  endDate?: string
}) {
  return trpc.dashboard.getDashboardActivity.useQuery({
    limit: 1000, // Large limit to get all activities for printing
    offset: 0,
    eventType: options?.eventType,
    timeframe: options?.timeframe ?? "all",
    startDate: options?.startDate,
    endDate: options?.endDate
  })
}