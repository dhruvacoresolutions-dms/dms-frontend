import { apiClient } from "@/lib/api-client"

export type HealthResponse = {
  groups?: string[]
  status: "UP" | "DOWN" | string
  details?: Record<string, unknown>
}

export async function getHealth() {
  const { data } = await apiClient.get<HealthResponse>("/actuator/health")
  return data
}