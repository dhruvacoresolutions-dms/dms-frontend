/**
 * Permission catalog for the frontend gate system.
 *
 * Backend (`GET /api/v1/me/access`) is the source of truth and issues codes
 * shaped `RESOURCE_ACTION` (e.g. `USER_VIEW`, `PERMISSION_VIEW`). Codes are
 * treated as opaque strings here — this module only gives developers typed,
 * discoverable constants plus a normalizer so equivalent spellings
 * (`USER_VIEW`, `USER.VIEW`, `user-view`) compare equal.
 *
 * Frontend gates are UX-only (visibility / access guidance). Hiding or
 * disabling UI never replaces backend authorization.
 */

/** Developer-facing action verbs. Aliases resolve to the backend verb. */
export const ACTION_ALIASES = {
  VIEW: "VIEW",
  LIST: "LIST",
  CREATE: "CREATE",
  EDIT: "UPDATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  STATUS: "STATUS",
  ASSIGN: "ASSIGN",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  EXPORT: "EXPORT",
  IMPORT: "IMPORT",
  DOWNLOAD: "DOWNLOAD",
  SUBMIT: "SUBMIT",
  MANAGE: "MANAGE",
  ACCESS: "ACCESS",
} as const

export type PermissionAction = keyof typeof ACTION_ALIASES

/**
 * Normalize any permission spelling to the canonical backend form.
 * `USER.VIEW`, `user-view`, `USER:VIEW` → `USER_VIEW`.
 */
export function normalizePermissionCode(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/[\s.:/\-]+/g, "_")
}

/** Resolve a developer-facing action to the backend verb (`EDIT` → `UPDATE`). */
export function resolveActionVerb(action: string): string {
  const key = action.trim().toUpperCase()
  return (ACTION_ALIASES as Record<string, string>)[key] ?? key
}

/** Build a canonical code from module + action: `("USER", "EDIT")` → `USER_UPDATE`. */
export function buildPermissionCode(module: string, action: string): string {
  return normalizePermissionCode(`${module}_${resolveActionVerb(action)}`)
}

export type ModuleActionRef = { module: string; action: string }

/** Accept a raw code string or a module/action ref; return the canonical code. */
export function resolveRequiredCode(input: string | ModuleActionRef): string {
  if (typeof input === "string") return normalizePermissionCode(input)
  return buildPermissionCode(input.module, input.action)
}

/**
 * Per-module permission tables. Values are the exact backend codes
 * (confirmed from `GET /api/v1/me/access`), written in code form.
 */
export const PERMISSIONS = {
  DASHBOARD: {
    VIEW: "DASHBOARD_VIEW",
  },
  USER: {
    VIEW: "USER_VIEW",
    CREATE: "USER_CREATE",
    UPDATE: "USER_UPDATE",
    DELETE: "USER_DELETE",
    STATUS: "USER_STATUS",
  },
  EMPLOYEE: {
    VIEW: "EMPLOYEE_VIEW",
    CREATE: "EMPLOYEE_CREATE",
    UPDATE: "EMPLOYEE_UPDATE",
    EXPORT: "EMPLOYEE_EXPORT",
    IMPORT: "EMPLOYEE_IMPORT",
    GEOGRAPHY_IMPORT: "EMPLOYEE_GEOGRAPHY_IMPORT",
    LOGIN_MANAGE: "EMPLOYEE_LOGIN_MANAGE",
  },
  ROLE: {
    VIEW: "ROLE_VIEW",
    CREATE: "ROLE_CREATE",
    UPDATE: "ROLE_UPDATE",
    DELETE: "ROLE_DELETE",
    ASSIGN: "ROLE_ASSIGN",
    PERMISSION_ASSIGN: "ROLE_PERMISSION_ASSIGN",
  },
  PERMISSION_SET: {
    VIEW: "PERMISSION_SET_VIEW",
    CREATE: "PERMISSION_SET_CREATE",
    UPDATE: "PERMISSION_SET_UPDATE",
    DELETE: "PERMISSION_SET_DELETE",
    ASSIGN: "PERMISSION_SET_ASSIGN",
  },
  PERMISSION: {
    VIEW: "PERMISSION_VIEW",
  },
  ACCESS_ASSIGNMENT: {
    VIEW: "ACCESS_ASSIGNMENT_VIEW",
    CREATE: "ACCESS_ASSIGNMENT_CREATE",
    DELETE: "ACCESS_ASSIGNMENT_DELETE",
  },
  COMPANY: {
    PROFILE_VIEW: "COMPANY_PROFILE_VIEW",
    PROFILE_UPDATE: "COMPANY_PROFILE_UPDATE",
    EXPORT: "COMPANY_EXPORT",
  },
  DEPARTMENT: {
    VIEW: "DEPARTMENT_VIEW",
    CREATE: "DEPARTMENT_CREATE",
    UPDATE: "DEPARTMENT_UPDATE",
    EXPORT: "DEPARTMENT_EXPORT",
    IMPORT: "DEPARTMENT_IMPORT",
  },
  DESIGNATION: {
    VIEW: "DESIGNATION_VIEW",
    CREATE: "DESIGNATION_CREATE",
    UPDATE: "DESIGNATION_UPDATE",
    EXPORT: "DESIGNATION_EXPORT",
    IMPORT: "DESIGNATION_IMPORT",
  },
  GEOGRAPHY: {
    VIEW: "GEOGRAPHY_VIEW",
    CREATE: "GEOGRAPHY_CREATE",
    UPDATE: "GEOGRAPHY_UPDATE",
    DELETE: "GEOGRAPHY_DELETE",
    ASSIGN: "GEOGRAPHY_ASSIGN",
    EXPORT: "GEOGRAPHY_EXPORT",
    IMPORT: "GEOGRAPHY_IMPORT",
  },
  PRODUCT: {
    VIEW: "PRODUCT_VIEW",
    CREATE: "PRODUCT_CREATE",
    UPDATE: "PRODUCT_UPDATE",
    EXPORT: "PRODUCT_EXPORT",
    IMPORT: "PRODUCT_IMPORT",
    SUPPORTING_MASTER_VIEW: "PRODUCT_SUPPORTING_MASTER_VIEW",
    SUPPORTING_MASTER_CREATE: "PRODUCT_SUPPORTING_MASTER_CREATE",
    SUPPORTING_MASTER_UPDATE: "PRODUCT_SUPPORTING_MASTER_UPDATE",
    SUPPORTING_MASTER_IMPORT: "PRODUCT_SUPPORTING_MASTER_IMPORT",
    SUPPORTING_MASTER_STATUS: "PRODUCT_SUPPORTING_MASTER_STATUS",
  },
  /**
   * Customer module (`CUSTOMER_MASTER`). The backend exposes exactly two
   * codes — read and manage — so every mutating action below resolves to
   * `CUSTOMER_MASTER_MANAGE` while export resolves to the read code.
   */
  CUSTOMER: {
    VIEW: "CUSTOMER_MASTER_VIEW",
    MANAGE: "CUSTOMER_MASTER_MANAGE",
    CREATE: "CUSTOMER_MASTER_MANAGE",
    UPDATE: "CUSTOMER_MASTER_MANAGE",
    STATUS: "CUSTOMER_MASTER_MANAGE",
    IMPORT: "CUSTOMER_MASTER_MANAGE",
    BOOTSTRAP: "CUSTOMER_MASTER_MANAGE",
    EXPORT: "CUSTOMER_MASTER_VIEW",
  },
  SUPPLIER: {
    VIEW: "SUPPLIER_VIEW",
    CREATE: "SUPPLIER_CREATE",
    UPDATE: "SUPPLIER_UPDATE",
    STATUS: "SUPPLIER_STATUS",
    EXPORT: "SUPPLIER_EXPORT",
    IMPORT: "SUPPLIER_IMPORT",
  },
  DISTRIBUTOR: {
    VIEW: "DISTRIBUTOR_VIEW",
    CREATE: "DISTRIBUTOR_CREATE",
    UPDATE: "DISTRIBUTOR_UPDATE",
    STATUS: "DISTRIBUTOR_STATUS",
    EXPORT: "DISTRIBUTOR_EXPORT",
    IMPORT: "DISTRIBUTOR_IMPORT",
    MASTER_VIEW: "DISTRIBUTOR_MASTER_VIEW",
    MASTER_CREATE: "DISTRIBUTOR_MASTER_CREATE",
    MASTER_UPDATE: "DISTRIBUTOR_MASTER_UPDATE",
    MASTER_STATUS: "DISTRIBUTOR_MASTER_STATUS",
    BANK_VIEW: "DISTRIBUTOR_BANK_VIEW",
    BANK_UPDATE: "DISTRIBUTOR_BANK_UPDATE",
    LOGIN_MANAGE: "DISTRIBUTOR_LOGIN_MANAGE",
  },
  COMPANY_CALENDAR: {
    VIEW: "COMPANY_CALENDAR_VIEW",
    MANAGE: "COMPANY_CALENDAR_MANAGE",
    IMPORT: "COMPANY_CALENDAR_IMPORT",
  },
  ACCOUNTING_PERIOD: {
    CLOSE: "ACCOUNTING_PERIOD_CLOSE",
    REOPEN: "ACCOUNTING_PERIOD_REOPEN",
  },
  VISIT_RADIUS: {
    VIEW: "VISIT_RADIUS_VIEW",
    MANAGE: "VISIT_RADIUS_MANAGE",
  },
  CLAIM_POLICY: {
    VIEW: "CLAIM_POLICY_VIEW",
    MANAGE: "CLAIM_POLICY_MANAGE",
  },
  INTEGRATION: {
    VIEW: "INTEGRATION_VIEW",
    MANAGE: "INTEGRATION_MANAGE",
  },
  FILE: {
    IMPORT_DOWNLOAD: "IMPORT_FILE_DOWNLOAD",
  },
} as const

export type PermissionModule = keyof typeof PERMISSIONS
