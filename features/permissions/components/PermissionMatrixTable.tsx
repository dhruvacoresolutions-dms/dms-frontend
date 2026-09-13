"use client"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PermissionModuleResponse } from "../api/permission.types"

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
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[240px]">Module</TableHead>
            <TableHead>Permissions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matrix.map((module) => {
            const codes = getModulePermissionCodes(module)
            return (
              <TableRow key={module.moduleCode} className="align-top">
                <TableCell>
                  <p className="font-medium">{module.moduleName}</p>
                  <Badge variant="outline" className="mt-1 font-mono text-[10px]">
                    {module.moduleCode}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {codes.length} permission(s) · {module.resources.length}{" "}
                    resource(s)
                  </p>
                </TableCell>
                <TableCell>
                  {codes.length === 0 ? (
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
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
