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
  /** Present for company users linked to an employee record. */
  employeeUuid?: string | null
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

/**
 * Raw payload of GET /api/v1/me/access
 * (called just after login with `Authorization: Bearer <token>` and
 * `X-Company-Context: <companyUuid>` headers).
 */
export type MyAccessResponse = {
  userUuid: string
  companyUuid: string
  companyCode: string
  roles: string[]
  permissionSets: string[]
  permissions: string[]
  scopes: Array<{ type: string; publicId: string }>
  enabledFeatures: string[]
}

/**
 * @deprecated The employee access endpoint is no longer used.
 * Kept for backward compat — use {@link MyAccessResponse} instead.
 */
export type EmployeeAccessResponse = {
  employeeUuid: string
  loginEnabled: boolean
  roles: string[]
  permissionSets: string[]
  effectivePermissions: string[]
}
