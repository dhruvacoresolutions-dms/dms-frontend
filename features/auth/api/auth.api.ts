import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type {
  AuthSession,
  ChangePasswordResponse,
  LoginValues,
  ChangePasswordValues,
  ForgotPasswordValues,
  ResetPasswordValues,
} from "./auth.types"
import type { EffectiveAccess } from "@/stores/access-store"

export async function loginUser(values: LoginValues): Promise<AuthSession> {
  const { data } = await apiClient.post<ApiSuccessResponse<AuthSession>>(
    "/v1/auth/login",
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
    "/v1/auth/me"
  )
  return data.data
}

export async function getCurrentAccess(): Promise<EffectiveAccess> {
  const companyUuid = (await import("@/stores/auth-store")).useAuthStore.getState().session?.user?.companyUuid
  const { data } = await apiClient.get<ApiSuccessResponse<EffectiveAccess>>(
    "/v1/me/access",
    companyUuid ? { headers: { "X-Company-Context": companyUuid } } : undefined
  )
  return data.data
}

export async function changePassword(values: ChangePasswordValues) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<ChangePasswordResponse>
  >("/v1/auth/change-password", values)
  return data.data
}

export async function forgotPassword(values: ForgotPasswordValues) {
  const { data } = await apiClient.post<{ success: boolean }>(
    "/v1/auth/forgot-password",
    values
  )
  return data
}

export async function resetPassword(
  token: string,
  values: ResetPasswordValues
) {
  const { data } = await apiClient.post<{ success: boolean }>(
    `/v1/auth/reset-password?token=${encodeURIComponent(token)}`,
    values
  )
  return data
}
