"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/common/EmptyState"
import type { PermissionResponse } from "../api/permission.types"
import {
  getPermissionActionKey,
  getPermissionActionLabel,
  groupPermissionsByModule,
  groupPermissionsByResource,
  sortPermissionsByActionOrder,
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

/**
 * Matrix-style permission picker — one section per module (heading +
 * resource rows), plain checkbox + label options ordered View → Create → …
 * Shared by role and permission-set Manage Permissions pages.
 *
 * Rules enforced here (single place for both pages):
 * - "All" is the first option per resource: checking it selects everything
 *   in that resource, and it auto-checks once the resource is fully
 *   selected.
 * - "View" is a prerequisite per resource: checking any other permission
 *   auto-checks that resource's View; unchecking a View clears that
 *   resource's other selections.
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
      (p.moduleCode ?? "").toLowerCase().includes(query) ||
      (p.actionCode ?? "").toLowerCase().includes(query) ||
      (p.action ?? "").toLowerCase().includes(query)
  )
  const grouped = groupPermissionsByModule(filtered)

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
        <div className="space-y-4">
            {grouped.map(([moduleCode, perms]) => {
              const ordered = sortPermissionsByActionOrder(perms)

            const handleToggle = (
              perm: PermissionResponse,
              resourceCodes: string[]
            ) => {
              const willCheck = !selected.has(perm.code)
              // View is a prerequisite within the same resource.
              const resourceViewCode = ordered.find(
                (p) =>
                  p.resourceCode === perm.resourceCode &&
                  getPermissionActionKey(p) === "VIEW"
              )?.code
              if (willCheck) {
                // Checking any permission pulls its resource's View in
                // automatically.
                if (
                  getPermissionActionKey(perm) !== "VIEW" &&
                  resourceViewCode &&
                  !selected.has(resourceViewCode)
                ) {
                  onToggle(resourceViewCode)
                }
              } else if (getPermissionActionKey(perm) === "VIEW") {
                // Dropping a View drops the rest of that resource's
                // selections.
                onToggleAll(
                  resourceCodes.filter((c) => c !== perm.code),
                  false
                )
              }
              onToggle(perm.code)
            }

            return (
              <section
                key={moduleCode}
                aria-label={formatModuleLabel(moduleCode)}
                className="overflow-hidden rounded-md border"
              >
                <div className="border-b bg-muted/40 px-4 py-2.5">
                  <h3 className="text-sm font-semibold">
                    {formatModuleLabel(moduleCode)}
                  </h3>
                </div>
                <div className="divide-y px-4">
                  {groupPermissionsByResource(ordered).map(
                    ([resourceCode, resourcePerms]) => {
                      const resourceCodes = resourcePerms.map((p) => p.code)
                      const resourceAllSelected =
                        resourceCodes.length > 0 &&
                        resourceCodes.every((c) => selected.has(c))
                      return (
                        <div
                          key={resourceCode}
                          className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-3"
                        >
                          <span
                            title={resourceCode}
                            className="w-48 shrink-0 truncate text-[13px] font-medium text-muted-foreground"
                          >
                            {formatModuleLabel(resourceCode)}
                          </span>
                          <label className="flex cursor-pointer items-center gap-2 text-sm">
                            <Checkbox
                              checked={resourceAllSelected}
                              onCheckedChange={() =>
                                onToggleAll(resourceCodes, !resourceAllSelected)
                              }
                              aria-label={`Select all ${resourceCode} permissions`}
                            />
                            <span className="font-medium">All</span>
                          </label>
                          {resourcePerms.map((perm) => {
                            const checked = selected.has(perm.code)
                            return (
                              <label
                                key={perm.code}
                                title={perm.code}
                                className="flex cursor-pointer items-center gap-2 text-sm"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() =>
                                    handleToggle(perm, resourceCodes)
                                  }
                                  aria-label={perm.code}
                                />
                                <span className="font-medium">
                                  {getPermissionActionLabel(
                                    perm.actionCode,
                                    perm.code,
                                    perm.action
                                  )}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )
                    }
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
