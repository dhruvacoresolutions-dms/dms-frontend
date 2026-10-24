import axios, { AxiosError } from "axios"

import {
  handlePasswordChangeRequired,
  handleUnauthorized,
} from "@/lib/unauthorized-handler"
import { syncServerClock } from "@/lib/server-clock"
import { useAuthStore } from "@/stores/auth-store"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
})

const PUBLIC_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
]

/**
 * Endpoints where a 401/403 is a normal, actionable result rather than a
 * dead session. In particular a 401 from change-password means "wrong current
 * password", not "session expired".
 */
const NO_AUTH_HANDLING_PATHS = [
  ...PUBLIC_PATHS,
  "/api/v1/auth/change-password",
  "/api/v1/auth/logout",
]

// All APIs (including /api/v1/permissions and /api/v1/permissions/matrix)
// require X-Company-Context — nothing is excluded.
const COMPANY_CONTEXT_EXCLUDE: string[] = []

const SESSION_PROBE_TTL_MS = 60_000

/**
 * Bare client for the `/auth/me` probe: no interceptors, so a failed probe
 * cannot recursively trigger another probe.
 */
const probeClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5_000,
})

let probeCache: { token: string; at: number; valid: boolean } | null = null
let probeInFlight: Promise<boolean> | null = null

function isPublicPath(url: string | undefined) {
  if (!url) {
    return false
  }

  return PUBLIC_PATHS.some((path) => url.includes(path))
}

function isNoAuthHandlingPath(url: string | undefined) {
  if (!url) {
    return false
  }

  return NO_AUTH_HANDLING_PATHS.some((path) => url.includes(path))
}

function isCompanyContextExcluded(url: string | undefined) {
  if (!url) return false
  return COMPANY_CONTEXT_EXCLUDE.some((path) => url.includes(path))
}

async function readErrorCode(error: AxiosError): Promise<string | undefined> {
  const data = error.response?.data

  if (!data) {
    return undefined
  }

  // Downloads/imports use responseType "blob", so the JSON error envelope
  // arrives as a Blob and must be parsed before we can read `code`.
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    try {
      const text = await data.text()
      const parsed = JSON.parse(text) as { code?: string; timestamp?: string }
      syncServerClock(parsed.timestamp)
      return parsed.code
    } catch {
      return undefined
    }
  }

  if (typeof data === "object") {
    const parsed = data as { code?: string; timestamp?: string }
    syncServerClock(parsed.timestamp)
    return parsed.code
  }

  return undefined
}

/**
 * Backend defect workaround: master-data / sales-execution / integration
 * return 403 ACCESS_DENIED for expired or revoked tokens. Ask identity once
 * whether the session is still alive; cache the answer briefly to avoid a
 * stampede of probes.
 */
function probeSession(): Promise<boolean> {
  const token = useAuthStore.getState().session?.accessToken

  if (!token) {
    return Promise.resolve(false)
  }

  if (
    probeCache &&
    probeCache.token === token &&
    Date.now() - probeCache.at < SESSION_PROBE_TTL_MS
  ) {
    return Promise.resolve(probeCache.valid)
  }

  if (probeInFlight) {
    return probeInFlight
  }

  probeInFlight = (async () => {
    try {
      const { data } = await probeClient.get<{ timestamp?: string }>(
        "/api/v1/auth/me",
        { headers: { Authorization: `Bearer ${token}` } }
      )

      syncServerClock(data?.timestamp)
      probeCache = { token, at: Date.now(), valid: true }

      return true
    } catch (error) {
      const status = (error as AxiosError).response?.status

      if (status === 401) {
        probeCache = { token, at: Date.now(), valid: false }
        return false
      }

      // Network/5xx: stay signed in; the backend still enforces.
      return true
    } finally {
      probeInFlight = null
    }
  })()

  return probeInFlight
}

function shouldProbeSession(url: string | undefined) {
  if (!url) {
    return false
  }

  // Auth endpoints have their own semantics (renewal 401, change-password
  // validation, etc.).
  return !url.includes("/api/v1/auth/")
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

  // For FormData, let browser set correct multipart boundary – remove default JSON content-type
  if (config.data instanceof FormData) {
    // axios in browser will set correct Content-Type with boundary automatically
    delete (config.headers as Record<string, unknown>)["Content-Type"]
    delete (config.headers as Record<string, unknown>)["content-type"]
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => {
    const timestamp = (
      response.data as { timestamp?: string } | null | undefined
    )?.timestamp

    if (timestamp) {
      syncServerClock(timestamp)
    }

    return response
  },
  async (error: AxiosError) => {
    const url = error.config?.url
    const status = error.response?.status

    // A 401 from change-password is usually "wrong current password", but it
    // can also mean the session died. Ask identity before logging out.
    if (
      status === 401 &&
      url?.includes("/api/v1/auth/change-password")
    ) {
      void probeSession().then((valid) => {
        if (!valid) {
          handleUnauthorized()
        }
      })

      return Promise.reject(error)
    }

    if (!isNoAuthHandlingPath(url)) {
      if (status === 401) {
        // Session expired or revoked everywhere.
        handleUnauthorized()
      } else if (status === 403) {
        const code = await readErrorCode(error)

        if (code === "PASSWORD_CHANGE_REQUIRED") {
          // Keep the session; route to change-password and stop renewal.
          handlePasswordChangeRequired()
        } else if (code === "ACCESS_DENIED" && shouldProbeSession(url)) {
          // Do not block the caller's error UI on the probe; log out if the
          // session is actually dead.
          void probeSession().then((valid) => {
            if (!valid) {
              handleUnauthorized()
            }
          })
        }
      }
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
