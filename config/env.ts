export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api",
} as const
