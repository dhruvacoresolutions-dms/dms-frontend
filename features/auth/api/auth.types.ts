import type { LoginValues, ChangePasswordValues, ForgotPasswordValues, ResetPasswordValues } from "@/lib/validations/auth"

export type { LoginValues, ChangePasswordValues, ForgotPasswordValues, ResetPasswordValues }

export type User = {
  userUuid: string
  username: string
  displayName: string
  companyUuid: string | null
  companyCode: string | null
  context?: "PLATFORM" | "COMPANY"
  roles: string[]
  mustChangePassword?: boolean
}

export type AuthSession = {
  accessToken: string
  tokenType: string
  expiresIn: number
  mustChangePassword: boolean
  user: User
}

export type ChangePasswordResponse = {
  passwordChanged: boolean
  loginAgainRequired: boolean
}
