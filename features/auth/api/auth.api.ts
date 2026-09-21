import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import { useAccessStore } from "@/stores/access-store"
import { getGlobalQueryClient } from "@/lib/unauthorized-handler"
import { authKeys } from "./auth-keys"
import type {
  AuthSession,
  ChangePasswordResponse,
  MyAccessResponse,
  LoginValues,
  ChangePasswordValues,
  ForgotPasswordValues,
  ResetPasswordValues,
} from "./auth.types"
import type { EffectiveAccess } from "@/stores/access-store"
import { normalizeMyAccess } from "@/stores/access-store"

export async function loginUser(values: LoginValues): Promise<AuthSession> {
  const { data } = await apiClient.post<ApiSuccessResponse<AuthSession>>(
    "/api/v1/auth/login",
    {
      username: values.username,
      password: values.password,
      channel: "ADMIN_WEB",
    }
  )
  return data.data
}

export async function getCurrentUser() {
  const { data } = await apiClient.get<ApiSuccessResponse<AuthSession["user"]>>(
    "/api/v1/auth/me"
  )
  return data.data
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
