import axios, { AxiosError } from "axios"

import { handleUnauthorized } from "@/lib/unauthorized-handler"
import { useAuthStore } from "@/stores/auth-store"

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
})

const PUBLIC_PATHS = [
  "/v1/auth/login",
  "/v1/auth/forgot-password",
  "/v1/auth/reset-password",
]

const COMPANY_CONTEXT_EXCLUDE = ["/v1/permissions", "/v1/permissions/matrix"]

function isPublicPath(url: string | undefined) {
  if (!url) {
    return false
  }

  return PUBLIC_PATHS.some((path) => url.includes(path))
}

function isCompanyContextExcluded(url: string | undefined) {
  if (!url) return false
  return COMPANY_CONTEXT_EXCLUDE.some((path) => url.includes(path))
}

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().session?.accessToken
  const companyUuid = useAuthStore.getState().session?.user?.companyUuid

  if (accessToken && !isPublicPath(config.url)) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  if (companyUuid && !config.headers["X-Company-Context"] && !isCompanyContextExcluded(config.url)) {
    config.headers["X-Company-Context"] = companyUuid
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
