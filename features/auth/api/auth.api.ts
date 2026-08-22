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

export async function loginUser(values: LoginValues): Promise<AuthSession> {
  const { data } = await apiClient.post<ApiSuccessResponse<AuthSession>>(
    "/auth/login",
    {
      username: values.username,
      password: values.password,
    }
  )
  return data.data
}

export async function changePassword(values: ChangePasswordValues) {
  const { data } = await apiClient.post<
    ApiSuccessResponse<ChangePasswordResponse>
  >("/auth/change-password", values)
  return data.data
}

export async function forgotPassword(values: ForgotPasswordValues) {
  const { data } = await apiClient.post<{ success: boolean }>(
    "/auth/forgot-password",
    values
  )
  return data
}

export async function resetPassword(
  token: string,
  values: ResetPasswordValues
) {
  const { data } = await apiClient.post<{ success: boolean }>(
    `/auth/reset-password?token=${encodeURIComponent(token)}`,
    values
  )
  return data
}
