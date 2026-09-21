import { describe, expect, it } from "vitest"

import {
  buildPermissionCode,
  normalizePermissionCode,
  PERMISSIONS,
  resolveActionVerb,
} from "@/lib/permissions/permissions"
import { createPermissionChecker } from "@/lib/permissions/checker"

const GRANTED = [
  "USER_VIEW",
  "USER_CREATE",
  "USER_UPDATE",
  "EMPLOYEE_VIEW",
  "PERMISSION_VIEW",
  "DASHBOARD_VIEW",
]

describe("normalizePermissionCode", () => {
  it("treats separators and case as equivalent", () => {
    expect(normalizePermissionCode("USER.VIEW")).toBe("USER_VIEW")
    expect(normalizePermissionCode("user-view")).toBe("USER_VIEW")
    expect(normalizePermissionCode("user:view")).toBe("USER_VIEW")
    expect(normalizePermissionCode("  USER_VIEW  ")).toBe("USER_VIEW")
  })
})

describe("resolveActionVerb", () => {
  it("maps EDIT to the backend UPDATE verb", () => {
    expect(resolveActionVerb("EDIT")).toBe("UPDATE")
    expect(resolveActionVerb("edit")).toBe("UPDATE")
    expect(resolveActionVerb("VIEW")).toBe("VIEW")
  })

  it("passes unknown verbs through uppercased", () => {
    expect(resolveActionVerb("custom")).toBe("CUSTOM")
  })
})

describe("buildPermissionCode", () => {
  it("joins module + action into backend form", () => {
    expect(buildPermissionCode("USER", "EDIT")).toBe("USER_UPDATE")
    expect(buildPermissionCode("user", "view")).toBe("USER_VIEW")
  })
})

describe("PERMISSIONS catalog", () => {
  it("matches confirmed backend codes", () => {
    expect(PERMISSIONS.USER.VIEW).toBe("USER_VIEW")
    expect(PERMISSIONS.USER.STATUS).toBe("USER_STATUS")
    expect(PERMISSIONS.EMPLOYEE.LOGIN_MANAGE).toBe("EMPLOYEE_LOGIN_MANAGE")
    expect(PERMISSIONS.PERMISSION.VIEW).toBe("PERMISSION_VIEW")
    expect(PERMISSIONS.FILE.IMPORT_DOWNLOAD).toBe("IMPORT_FILE_DOWNLOAD")
  })
})

describe("createPermissionChecker", () => {
  it("grants exact codes regardless of spelling", () => {
    const checker = createPermissionChecker(GRANTED)
    expect(checker.has("USER_VIEW")).toBe(true)
    expect(checker.has("USER.VIEW")).toBe(true)
    expect(checker.has("user_view")).toBe(true)
    expect(checker.has("USER_DELETE")).toBe(false)
  })

  it("supports module/action checks with EDIT alias", () => {
    const checker = createPermissionChecker(GRANTED)
    expect(checker.can("USER", "VIEW")).toBe(true)
    expect(checker.can("USER", "EDIT")).toBe(true) // USER_UPDATE granted
    expect(checker.can("USER", "DELETE")).toBe(false)
  })

  it("supports module-only checks (any action under the module)", () => {
    const checker = createPermissionChecker(GRANTED)
    expect(checker.can("USER")).toBe(true)
    expect(checker.can("ROLE")).toBe(false)
  })

  it("supports any/all multi-permission checks", () => {
    const checker = createPermissionChecker(GRANTED)
    expect(checker.canAny(["USER.DELETE", "USER.VIEW"])).toBe(true)
    expect(checker.canAny(["USER.DELETE", "ROLE.VIEW"])).toBe(false)
    expect(checker.canAll(["USER.VIEW", "USER.CREATE"])).toBe(true)
    expect(checker.canAll(["USER.VIEW", "USER.DELETE"])).toBe(false)
  })

  it("accepts module/action refs", () => {
    const checker = createPermissionChecker(GRANTED)
    expect(checker.canAny([{ module: "USER", action: "EDIT" }])).toBe(true)
    expect(checker.canAll([{ module: "USER", action: "DELETE" }])).toBe(false)
  })

  it("denies everything when empty, null, or undefined", () => {
    for (const granted of [[], null, undefined]) {
      const checker = createPermissionChecker(granted)
      expect(checker.has("USER_VIEW")).toBe(false)
      expect(checker.can("USER", "VIEW")).toBe(false)
      expect(checker.can("USER")).toBe(false)
      expect(checker.canAny(["USER_VIEW"])).toBe(false)
      expect(checker.canAll(["USER_VIEW"])).toBe(false)
    }
  })

  it("denies empty requirement lists", () => {
    const checker = createPermissionChecker(GRANTED)
    expect(checker.canAny([])).toBe(false)
    expect(checker.canAll([])).toBe(false)
  })
})
