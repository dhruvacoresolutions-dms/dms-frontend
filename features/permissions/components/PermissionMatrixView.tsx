"use client"

import { Check } from "lucide-react"

import type { PermissionResponse } from "../api/permission.types"
import {
  getPermissionActionLabel,
  groupPermissionsByModule,
  groupPermissionsByResource,
  sortPermissionsByActionOrder,
  formatModuleLabel,
} from "../utils/permission.utils"

/**
 * Read-only permission matrix — same module section + resource row layout
 * as `PermissionMatrixPicker`, but with check marks instead of checkboxes.
 * Used on detail pages (e.g. role detail) to show assigned permissions.
 */
export function PermissionMatrixView({
  permissions,
  unknownCodes = [],
}: {
  permissions: PermissionResponse[]
  /** Assigned codes missing from the catalog — listed under "Other". */
  unknownCodes?: string[]
}) {
  const grouped = groupPermissionsByModule(permissions)

  return (
    <div className="space-y-4">
      {grouped.map(([moduleCode, perms]) => {
        const ordered = sortPermissionsByActionOrder(perms)
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
              ([resourceCode, resourcePerms]) => (
                <div
                  key={resourceCode}
                  className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-3"
                >
                  <span
                    title={resourceCode}
                    className="w-36 shrink-0 truncate text-[13px] font-medium text-muted-foreground"
                  >
                    {formatModuleLabel(resourceCode)}
                  </span>
                  {resourcePerms.map((perm) => (
                    <span
                      key={perm.code}
                      title={perm.code}
                      className="flex items-center gap-1.5 text-sm"
                    >
                      <Check
                        className="size-4 shrink-0 text-primary"
                        aria-hidden
                      />
                      <span className="font-medium">
                        {getPermissionActionLabel(
                          perm.actionCode,
                          perm.code,
                          perm.action
                        )}
                      </span>
                    </span>
                  ))}
                </div>
              )
            )}
          </div>
        </section>
        )
      })}
      {unknownCodes.length > 0 && (
        <section
          aria-label="Other"
          className="overflow-hidden rounded-md border"
        >
          <div className="border-b bg-muted/40 px-4 py-2.5">
            <h3 className="text-sm font-semibold">Other</h3>
          </div>
          <div className="flex flex-col gap-1 px-4 py-2">
            {unknownCodes.map((code) => (
              <span
                key={code}
                className="font-mono text-xs text-muted-foreground"
              >
                {code}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
