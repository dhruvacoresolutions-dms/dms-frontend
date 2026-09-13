"use client"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { PermissionResponse } from "@/features/permissions/api/permission.types"

type RolePermissionGroupProps = {
  resourceCode: string
  permissions: PermissionResponse[]
  selected: Set<string>
  onToggle: (code: string) => void
  onToggleAll: (codes: string[], select: boolean) => void
}

export function RolePermissionGroup({
  resourceCode,
  permissions,
  selected,
  onToggle,
  onToggleAll,
}: RolePermissionGroupProps) {
  const codes = permissions.map((p) => p.code)
  const selectedCount = codes.filter((c) => selected.has(c)).length
  const allSelected = selectedCount === codes.length && codes.length > 0

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={() => onToggleAll(codes, !allSelected)}
            aria-label={`Select all ${resourceCode} permissions`}
          />
          <span className="text-sm font-semibold">{resourceCode}</span>
        </label>
        <Badge variant="secondary">
          {selectedCount}/{codes.length}
        </Badge>
      </div>
      <div className="space-y-1">
        {permissions.map((perm) => (
          <label
            key={perm.code}
            className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
          >
            <Checkbox
              checked={selected.has(perm.code)}
              onCheckedChange={() => onToggle(perm.code)}
              aria-label={perm.code}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono text-xs">
                {perm.code}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {perm.name}
              </span>
            </span>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {perm.actionCode}
            </Badge>
          </label>
        ))}
      </div>
    </div>
  )
}
