import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { useAccessStore } from "@/stores/access-store"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/users",
}))

const BASE_ACCESS = {
  userPublicId: "user-1",
  companyPublicId: "company-1",
  companyCode: "TEST",
  roles: [],
  permissionSets: [],
  scopes: [],
  enabledFeatures: [],
}

function grant(permissions: string[]) {
  useAccessStore.getState().setAccess({ ...BASE_ACCESS, permissions })
}

beforeEach(() => {
  useAccessStore.getState().clearAccess()
})

describe("PermissionGate", () => {
  it("renders children when allowed", () => {
    grant(["USER_VIEW"])
    render(
      <PermissionGate permission="USER.VIEW">
        <button>Create</button>
      </PermissionGate>
    )
    expect(screen.getByRole("button", { name: "Create" })).toBeDefined()
  })

  it("hides children when denied (default hidden mode)", () => {
    grant(["USER_VIEW"])
    render(
      <PermissionGate permission="USER.DELETE">
        <button>Delete</button>
      </PermissionGate>
    )
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull()
  })

  it("renders fallback when denied", () => {
    grant(["USER_VIEW"])
    render(
      <PermissionGate permission="USER.DELETE" fallback={<span>Locked</span>}>
        <button>Delete</button>
      </PermissionGate>
    )
    expect(screen.getByText("Locked")).toBeDefined()
  })

  it("supports module/action form with EDIT alias", () => {
    grant(["USER_UPDATE"])
    render(
      <PermissionGate module="USER" action="EDIT">
        <button>Edit</button>
      </PermissionGate>
    )
    expect(screen.getByRole("button", { name: "Edit" })).toBeDefined()
  })

  it("renders loadingFallback (not content) while access is loading", () => {
    useAccessStore.getState().setAccessLoading()
    render(
      <PermissionGate permission="USER.VIEW" loadingFallback={<span>Hold on</span>}>
        <button>Create</button>
      </PermissionGate>
    )
    expect(screen.getByText("Hold on")).toBeDefined()
    expect(screen.queryByRole("button", { name: "Create" })).toBeNull()
  })

  it("fails open when the access fetch errored", () => {
    useAccessStore.getState().setAccessError()
    render(
      <PermissionGate permission="USER.DELETE">
        <button>Delete</button>
      </PermissionGate>
    )
    expect(screen.getByRole("button", { name: "Delete" })).toBeDefined()
  })

  it("disabled mode renders the child disabled with a reason", () => {
    grant(["USER_VIEW"])
    render(
      <PermissionGate permission="USER.EXPORT" mode="disabled" disabledReason="No export right">
        <button>Export</button>
      </PermissionGate>
    )
    const button = screen.getByRole("button", { name: "Export" })
    expect((button as HTMLButtonElement).disabled).toBe(true)
    expect(button.getAttribute("title")).toBe("No export right")
  })

  it("supports render-prop children", () => {
    grant(["USER_VIEW"])
    render(
      <PermissionGate permission="USER.VIEW">
        {(allowed) => <span>{allowed ? "yes" : "no"}</span>}
      </PermissionGate>
    )
    expect(screen.getByText("yes")).toBeDefined()
  })

  it("denies when no requirement is specified", () => {
    grant(["USER_VIEW"])
    render(<PermissionGate>{<button>Nope</button>}</PermissionGate>)
    expect(screen.queryByRole("button", { name: "Nope" })).toBeNull()
  })
})

describe("RouteGate", () => {
  it("renders children when allowed", () => {
    grant(["USER_VIEW"])
    render(
      <RouteGate permission="USER.VIEW">
        <h1>Users</h1>
      </RouteGate>
    )
    expect(screen.getByText("Users")).toBeDefined()
  })

  it("renders forbidden state when denied", () => {
    grant(["USER_VIEW"])
    render(
      <RouteGate permission="ROLE.VIEW">
        <h1>Roles</h1>
      </RouteGate>
    )
    expect(screen.queryByText("Roles")).toBeNull()
    expect(screen.getByText("Access denied")).toBeDefined()
  })

  it("shows loading UI (not forbidden) while access resolves", () => {
    useAccessStore.getState().setAccessLoading()
    render(
      <RouteGate permission="USER.VIEW">
        <h1>Users</h1>
      </RouteGate>
    )
    expect(screen.queryByText("Users")).toBeNull()
    expect(screen.queryByText("Access denied")).toBeNull()
  })
})
