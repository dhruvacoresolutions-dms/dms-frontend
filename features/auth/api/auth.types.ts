import type {
  LoginValues,
  ChangePasswordValues,
  ForgotPasswordValues,
  ResetPasswordValues,
} from "@/lib/validations/auth"

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

export type UserContext = "PLATFORM" | "COMPANY"

export type SessionMode = "PLATFORM_STATELESS" | "TENANT_MANAGED"

/**
 * Raw payload of `POST /api/v1/auth/login`.
 * `expiresAt` is server-authoritative and must be persisted as-is.
 */
export type LoginResponse = {
  accessToken: string
  tokenType: string
  expiresIn: number
  expiresAt?: string
  channel?: string
  sessionMode?: SessionMode
  mustChangePassword: boolean
  user: User
}

/**
 * Raw payload of `POST /api/v1/auth/session/activity`.
 * ADMIN_WEB only; the returned token replaces the stored one.
 */
export type SessionActivityResponse = {
  accessToken: string
  tokenType: string
  expiresIn: number
  expiresAt?: string
}

export type ChangePasswordResponse = {
  passwordChanged: boolean
  loginAgainRequired: boolean
  /**
   * Present for tenant (COMPANY) sessions: the backend keeps the session and
   * issues a replacement token. `expiresAt` is not returned here, so the JWT
   * `exp` claim is used as the server-issued expiry.
   */
  accessToken?: string
  tokenType?: string
  expiresIn?: number
  mustChangePassword?: boolean
}

/**
 * Raw payload of GET /api/v1/me/access
 * (called just after login with `Authorization: Bearer <token>` and
 * `X-Company-Context: <companyUuid>` headers).
 */
export type MyAccessResponse = {
  userPublicId: string
  companyPublicId: string
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
