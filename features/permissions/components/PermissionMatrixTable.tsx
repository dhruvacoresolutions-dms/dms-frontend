"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import type { PermissionModuleResponse } from "../api/permission.types"
import { formatModuleLabel } from "../utils/permission.utils"

type PermissionMatrixTableProps = {
  matrix: PermissionModuleResponse[]
}

/** Flatten a module's resources/actions into permission codes. */
function getModulePermissionCodes(
  module: PermissionModuleResponse
): string[] {
  return module.resources.flatMap((resource) =>
    resource.actions.map((action) => action.permissionCode)
  )
}

/**
 * One table row per module — all of the module's permissions render
 * inside that row's Permissions cell.
 */
export function PermissionMatrixTable({ matrix }: PermissionMatrixTableProps) {
  const columns = React.useMemo<DataTableColumn<PermissionModuleResponse>[]>(
    () => [
      {
        id: "module",
        header: "Module",
        cell: ({ row }) => {
          const module = row.original
          const codes = getModulePermissionCodes(module)
          return (
            <div>
              <p className="font-medium">{module.moduleName}</p>
              <Badge variant="outline" className="mt-1 text-[10px]">
                {formatModuleLabel(module.moduleCode)}
              </Badge>
              <p className="mt-1 text-xs text-muted-foreground">
                {codes.length} permission(s) · {module.resources.length}{" "}
                resource(s)
              </p>
            </div>
          )
        },
      },
      {
        id: "permissions",
        header: "Permissions",
        cell: ({ row }) => {
          const codes = getModulePermissionCodes(row.original)
          return codes.length === 0 ? (
            <span className="text-sm text-muted-foreground">—</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {codes.map((code) => (
                <Badge
                  key={code}
                  variant="secondary"
                  className="font-mono text-xs"
                >
                  {code}
                </Badge>
              ))}
            </div>
          )
        },
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={matrix}
      getRowId={(m) => m.moduleCode}
    />
  )
}
