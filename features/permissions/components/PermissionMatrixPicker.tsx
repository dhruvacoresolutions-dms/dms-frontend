"use client"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

/**
 * Matrix-style permission picker — one table row per resource, generic
 * action names (View / Create / Update / Delete / Assign …) in the row.
 * Shared by role and permission-set Manage Permissions pages.
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px]">Module</TableHead>
                <TableHead>Permissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped.map(([resourceCode, perms]) => {
                const codes = perms.map((p) => p.code)
                const selectedCount = codes.filter((c) =>
                  selected.has(c)
                ).length
                const allSelected =
                  selectedCount === codes.length && codes.length > 0
                return (
                  <TableRow key={resourceCode} className="align-top">
                    <TableCell>
                      <label className="flex cursor-pointer items-center gap-2">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() =>
                            onToggleAll(codes, !allSelected)
                          }
                          aria-label={`Select all ${resourceCode} permissions`}
                        />
                        <span className="text-sm font-semibold">
                          {formatModuleLabel(resourceCode)}
                        </span>
                      </label>
                      <p className="mt-1 pl-6 text-xs text-muted-foreground">
                        {selectedCount}/{codes.length} selected
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {perms.map((perm) => {
                          const checked = selected.has(perm.code)
                          return (
                            <label
                              key={perm.code}
                              title={perm.code}
                              className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:bg-muted ${
                                checked
                                  ? "border-primary bg-primary/5"
                                  : ""
                              }`}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => onToggle(perm.code)}
                                aria-label={perm.code}
                              />
                              <span className="font-medium">
                                {getPermissionActionLabel(
                                  perm.actionCode,
                                  perm.code
                                )}
                              </span>
                              {perm.actionCode ? (
                                <Badge
                                  variant="outline"
                                  className="font-mono text-[10px]"
                                >
                                  {perm.actionCode}
                                </Badge>
                              ) : null}
                            </label>
                          )
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
