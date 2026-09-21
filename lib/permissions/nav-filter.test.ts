import { describe, expect, it } from "vitest"

import {
  createPermissionChecker,
  filterNavGroups,
  filterNavItems,
  type NavRequirement,
} from "@/lib/permissions/nav-filter"

const GRANTED = ["USER_VIEW", "USER_CREATE", "ROLE_VIEW", "DASHBOARD_VIEW"]

const ITEMS = [
  { title: "Dashboard", url: "/dashboard", permission: "DASHBOARD_VIEW" },
  {
    title: "Organization",
    url: "/organization",
    items: [
      { title: "Users", url: "/users", permission: "USER_VIEW" },
      { title: "Employees", url: "/employees", permission: "EMPLOYEE_VIEW" },
    ],
  },
  {
    title: "Access Management",
    url: "/access-management",
    items: [
      { title: "Roles", url: "/roles", permission: "ROLE_VIEW" },
      { title: "Permissions", url: "/permissions", permission: "PERMISSION_VIEW" },
    ],
  },
  { title: "Reports", url: "/reports", permission: "REPORT_VIEW" },
]

describe("filterNavItems", () => {
  it("keeps allowed leaves and drops denied ones", () => {
    const checker = createPermissionChecker(GRANTED)
    const visible = filterNavItems(ITEMS, checker)
    expect(visible.map((i) => i.title)).toEqual([
      "Dashboard",
      "Organization",
      "Access Management",
    ])
  })

  it("prunes children inside kept parents", () => {
    const checker = createPermissionChecker(GRANTED)
    const visible = filterNavItems(ITEMS, checker)
    const org = visible.find((i) => i.title === "Organization")
    expect(org?.items?.map((i) => i.title)).toEqual(["Users"])
    const access = visible.find((i) => i.title === "Access Management")
    expect(access?.items?.map((i) => i.title)).toEqual(["Roles"])
  })

  it("drops parents left with no visible children", () => {
    const checker = createPermissionChecker(["DASHBOARD_VIEW"])
    const visible = filterNavItems(ITEMS, checker)
    expect(visible.map((i) => i.title)).toEqual(["Dashboard"])
  })

  it("keeps everything when nothing is required", () => {
    const checker = createPermissionChecker([])
    const items: NavRequirement[] = [{ title: "Open", url: "/open" } as NavRequirement]
    expect(filterNavItems(items, checker)).toEqual(items)
  })
})

describe("filterNavGroups", () => {
  it("drops groups with zero visible items", () => {
    const checker = createPermissionChecker(GRANTED)
    const groups = [
      { label: "A", items: [{ title: "Users", url: "/users", permission: "USER_VIEW" }] },
      { label: "B", items: [{ title: "Vault", url: "/vault", permission: "VAULT_VIEW" }] },
    ]
    const visible = filterNavGroups(groups, checker)
    expect(visible.map((g) => g.label)).toEqual(["A"])
  })
})
