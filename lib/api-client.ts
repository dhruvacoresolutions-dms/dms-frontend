import axios, { AxiosError } from "axios"

import { handleUnauthorized } from "@/lib/unauthorized-handler"
import { useAuthStore } from "@/stores/auth-store"

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
})

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/forgot-password",
  "/auth/reset-password",
]

function isPublicPath(url: string | undefined) {
  if (!url) {
    return false
  }

  return PUBLIC_PATHS.some((path) => url.includes(path))
}

apiClient.interceptors.request.use((config) => {
  if (isPublicPath(config.url)) {
    return config
  }

  const accessToken = useAuthStore.getState().session?.accessToken

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error instanceof AxiosError &&
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login")
    ) {
      handleUnauthorized()
    }

    return Promise.reject(error)
  }
)

export type {
  ApiErrorResponse,
  ApiSuccessResponse,
  FieldErrorDetail,
} from "@/lib/api/api-error"

export { getApiError, getApiErrorMessage } from "@/lib/api/api-error"
