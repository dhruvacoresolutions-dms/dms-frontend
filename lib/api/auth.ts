import { apiClient, type ApiSuccessResponse } from "@/lib/api-client"
import type {
  ChangePasswordValues,
  ForgotPasswordValues,
  LoginValues,
  ResetPasswordValues,
} from "@/lib/validations/auth"
import type { AuthSession } from "@/stores/auth-store"

type ChangePasswordResponse = {
  passwordChanged: boolean
  loginAgainRequired: boolean
}

export async function loginUser(values: LoginValues): Promise<AuthSession> {
  const { data } = await apiClient.post<ApiSuccessResponse<AuthSession>>(
    "/v1/auth/login",
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
