export type HealthResponse = {
  groups?: string[]
  status: "UP" | "DOWN" | string
  details?: Record<string, unknown>
}

const HEALTH_URL =
  (process.env.BACKEND_URL ?? "http://localhost:8080") + "/actuator/health"

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(HEALTH_URL, { cache: "no-store" })
  return response.json()
}
