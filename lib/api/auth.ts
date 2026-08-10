import { apiClient } from "@/lib/api-client"
import type {
  ForgotPasswordValues,
  LoginValues,
  ResetPasswordValues,
} from "@/lib/validations/auth"

type LoginResponse = {
  user: {
    id: string
    email: string
    name?: string
  }
}

export async function loginUser(values: LoginValues) {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", values)
  return data
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