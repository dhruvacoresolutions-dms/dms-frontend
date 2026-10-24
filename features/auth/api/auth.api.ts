import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { getJwtExpiryMs } from "@/lib/jwt"
import { serverNow, syncServerClock } from "@/lib/server-clock"
import { useAuthStore, type AuthSession, type SessionTokenUpdate } from "@/stores/auth-store"
import { useAccessStore } from "@/stores/access-store"
import { getGlobalQueryClient } from "@/lib/unauthorized-handler"
import { authKeys } from "./auth-keys"
import type {
  ChangePasswordResponse,
  LoginResponse,
  MyAccessResponse,
  LoginValues,
  ChangePasswordValues,
  ForgotPasswordValues,
  ResetPasswordValues,
  SessionActivityResponse,
  User,
} from "./auth.types"
import type { EffectiveAccess } from "@/stores/access-store"
import { normalizeMyAccess } from "@/stores/access-store"

/**
 * Resolve an absolute expiry from the API.
 *
 * Preference order:
 * 1. `expiresAt` from the response (server-authoritative, includes session
 *    extension for renewals).
 * 2. The JWT `exp` claim (server-issued) when the endpoint omits `expiresAt`.
 * 3. `expiresIn` only as a last-resort compatibility fallback.
 */
function resolveExpiryMs(
  expiresAt: string | undefined,
  accessToken: string,
  expiresIn?: number
): number {
  if (expiresAt) {
    const parsed = Date.parse(expiresAt)

    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  const jwtExpiry = getJwtExpiryMs(accessToken)

  if (jwtExpiry) {
    return jwtExpiry
  }

  return serverNow() + (expiresIn ?? 0) * 1000
}

export async function loginUser(values: LoginValues): Promise<AuthSession> {
  const { data } = await apiClient.post<ApiSuccessResponse<LoginResponse>>(
    "/api/v1/auth/login",
    {
      username: values.username,
      password: values.password,
      channel: "ADMIN_WEB",
    }
  )

  syncServerClock(data.timestamp)

  const payload = data.data

  return {
    accessToken: payload.accessToken,
    tokenType: payload.tokenType,
    expiresIn: payload.expiresIn,
    expiresAt: resolveExpiryMs(
      payload.expiresAt,
      payload.accessToken,
      payload.expiresIn
    ),
    renewedAt: serverNow(),
    sessionMode: payload.sessionMode,
    mustChangePassword: payload.mustChangePassword,
    user: payload.user,
  }
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<ApiSuccessResponse<User>>(
    "/api/v1/auth/me"
  )

  syncServerClock(data.timestamp)

  return data.data
}

/**
 * Renew the current ADMIN_WEB session after explicit human interaction.
 *
 * The server slides the session by its idle timeout and returns a replacement
 * token. Callers must use the returned `accessToken`/`expiresAt` — never
 * derive expiry locally.
 */
export async function renewSessionActivity(): Promise<SessionTokenUpdate> {
  const { data } = await apiClient.post<
    ApiSuccessResponse<SessionActivityResponse>
  >("/api/v1/auth/session/activity")

  syncServerClock(data.timestamp)

  const payload = data.data

  return {
    accessToken: payload.accessToken,
    expiresIn: payload.expiresIn,
    expiresAt: resolveExpiryMs(
      payload.expiresAt,
      payload.accessToken,
      payload.expiresIn
    ),
    renewedAt: serverNow(),
  }
}

/**
 * Revoke the session server-side. Best-effort: local state is cleared before
 * this runs, so it receives the token explicitly.
 */
export async function logoutSession(accessToken?: string): Promise<void> {
  try {
    await apiClient.post("/api/v1/auth/logout", undefined, {
      timeout: 3_000,
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    })
  } catch {
    // Ignore — the local session is already gone.
  }
}

/**
 * Fetch the logged-in user's access:
 * GET /api/v1/me/access
 *
 * Called right after login (after session is set) so route access can be
 * enforced from the user's effective permissions. Auth + X-Company-Context
 * headers are attached automatically by the shared axios client; the company
 * header is also passed explicitly when the session carries a companyUuid.
 */
export async function getCurrentAccess(): Promise<EffectiveAccess> {
  const companyUuid = useAuthStore.getState().session?.user?.companyUuid

  const { data } = await apiClient.get<ApiSuccessResponse<MyAccessResponse>>(
    "/api/v1/me/access",
    companyUuid ? { headers: { "X-Company-Context": companyUuid } } : undefined
  )

  syncServerClock(data.timestamp)

  return normalizeMyAccess(data.data)
}

/** Identifiers used as the access query key — must match getCurrentAccess(). */
export function getCurrentAccessIdentifiers(): {
  companyUuid: string | null
  userUuid: string | null
} {
  const session = useAuthStore.getState().session
  return {
    companyUuid: session?.user?.companyUuid ?? null,
    userUuid: session?.user?.userUuid ?? null,
  }
}

/**
 * Re-fetch the logged-in user's access mid-session (e.g. after an admin
 * grants/revokes roles or permission sets). Updates both the access store
 * and the TanStack cache. Throws on failure and marks the store errored —
 * callers decide whether to toast.
 */
export async function refreshCurrentAccess(): Promise<EffectiveAccess> {
  const store = useAccessStore.getState()
  store.setAccessLoading()
  try {
    const access = await getCurrentAccess()
    const { companyUuid, userUuid } = getCurrentAccessIdentifiers()
    store.setAccess(access)
    getGlobalQueryClient()?.setQueryData(
      authKeys.access(companyUuid, userUuid),
      access
    )
    return access
  } catch (error) {
    useAccessStore.getState().setAccessError()
    throw error
  }
}

export async function changePassword(values: ChangePasswordValues) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<ChangePasswordResponse>
  >("/api/v1/auth/change-password", values)

  syncServerClock(data.timestamp)

  return data.data
}

export async function forgotPassword(values: ForgotPasswordValues) {
  const { data } = await apiClient.post<{ success: boolean }>(
    "/api/v1/auth/forgot-password",
    values
  )
  return data
}

export async function resetPassword(
  token: string,
  values: ResetPasswordValues
) {
  const { data } = await apiClient.post<{ success: boolean }>(
    `/api/v1/auth/reset-password?token=${encodeURIComponent(token)}`,
    values
  )
  return data
}
