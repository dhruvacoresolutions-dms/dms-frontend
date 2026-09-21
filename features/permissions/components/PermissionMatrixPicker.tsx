"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/common/EmptyState"
import type { PermissionResponse } from "../api/permission.types"
import {
  getPermissionActionLabel,
  groupPermissionsByResource,
  formatModuleLabel,
} from "../utils/permission.utils"

type PermissionMatrixPickerProps = {
  permissions: PermissionResponse[]
  selected: Set<string>
  onToggle: (code: string) => void
  onToggleAll: (codes: string[], select: boolean) => void
  search: string
  onSearchChange: (value: string) => void
}

/** Canonical display order within a module — missing actions are skipped. */
const ACTION_ORDER = [
  "VIEW",
  "CREATE",
  "UPDATE",
  "DELETE",
  "ASSIGN",
  "ACCESS",
  "LIST",
  "MANAGE",
  "APPROVE",
  "REJECT",
  "EXPORT",
  "IMPORT",
] as const

function getActionKey(perm: PermissionResponse): string {
  const fromCode = perm.code.split(/[._]/).pop()?.trim() ?? ""
  return (perm.actionCode?.trim() || fromCode).toUpperCase()
}

function sortByActionOrder(perms: PermissionResponse[]): PermissionResponse[] {
  return [...perms].sort((a, b) => {
    const orderA = ACTION_ORDER.indexOf(
      getActionKey(a) as (typeof ACTION_ORDER)[number]
    )
    const orderB = ACTION_ORDER.indexOf(
      getActionKey(b) as (typeof ACTION_ORDER)[number]
    )
    const rankA = orderA === -1 ? ACTION_ORDER.length : orderA
    const rankB = orderB === -1 ? ACTION_ORDER.length : orderB
    if (rankA !== rankB) return rankA - rankB
    return getPermissionActionLabel(a.actionCode, a.code).localeCompare(
      getPermissionActionLabel(b.actionCode, b.code)
    )
  })
}

/**
 * Matrix-style permission picker — one table row per resource, plain
 * checkbox + label rows ordered View → Create → … Shared by role and
 * permission-set Manage Permissions pages.
 *
 * Rules enforced here (single place for both pages):
 * - "All" is the first option per module: checking it selects everything,
 *   and it auto-checks once every permission in the module is selected.
 * - "View" is a prerequisite: checking any other permission auto-checks
 *   the module's View; unchecking View clears the module's other
 *   selections.
 */
export function PermissionMatrixPicker({
  permissions,
  selected,
  onToggle,
  onToggleAll,
  search,
  onSearchChange,
}: PermissionMatrixPickerProps) {
  const query = search.trim().toLowerCase()
  const filtered = permissions.filter(
    (p) =>
      !query ||
      p.code.toLowerCase().includes(query) ||
      p.name.toLowerCase().includes(query) ||
      p.resourceCode.toLowerCase().includes(query) ||
      (p.actionCode ?? "").toLowerCase().includes(query)
  )
  const grouped = groupPermissionsByResource(filtered)

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search permissions by action, resource, or code..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />

      {grouped.length === 0 ? (
        <EmptyState
          title="No permissions match"
          description="Try a different search."
        />
      ) : (
        <div className="overflow-hidden rounded-md border">
          <div className="divide-y">
            {grouped.map(([resourceCode, perms]) => {
              const ordered = sortByActionOrder(perms)
              const codes = ordered.map((p) => p.code)
              const allSelected =
                codes.length > 0 && codes.every((c) => selected.has(c))
              const viewCode = ordered.find(
                (p) => getActionKey(p) === "VIEW"
              )?.code

              const handleToggle = (perm: PermissionResponse) => {
                const willCheck = !selected.has(perm.code)
                if (willCheck) {
                  // Checking any permission pulls View in automatically.
                  if (
                    getActionKey(perm) !== "VIEW" &&
                    viewCode &&
                    !selected.has(viewCode)
                  ) {
                    onToggle(viewCode)
                  }
                } else if (getActionKey(perm) === "VIEW") {
                  // View is a prerequisite — dropping it drops the rest
                  // of the module's selections.
                  onToggleAll(
                    codes.filter((c) => c !== perm.code),
                    false
                  )
                }
                onToggle(perm.code)
              }

              return (
                <div
                  key={resourceCode}
                  className="flex flex-wrap items-center px-4 py-2.5"
                >
                  <span className="w-[15%] shrink-0 text-sm font-semibold whitespace-nowrap">
                    {formatModuleLabel(resourceCode)}
                  </span>
                  <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-1">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => onToggleAll(codes, !allSelected)}
                        aria-label={`Select all ${resourceCode} permissions`}
                      />
                      <span className="font-medium">All</span>
                    </label>
                    {ordered.map((perm) => {
                      const checked = selected.has(perm.code)
                      return (
                        <label
                          key={perm.code}
                          title={perm.code}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => handleToggle(perm)}
                            aria-label={perm.code}
                          />
                          <span className="font-medium">
                            {getPermissionActionLabel(
                              perm.actionCode,
                              perm.code
                            )}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
