"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Eye, Edit, Key, MoreHorizontal, Trash2 } from "lucide-react"
import {
  DataTable,
  type DataTableColumn,
} from "@/components/common/DataTable"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { PERMISSIONS } from "@/lib/permissions"
import type { RoleListItem } from "../api/role.types"
import { getRoleId } from "../utils/role.utils"

type RoleTableProps = {
  roles: RoleListItem[]
  /** Navigation base, e.g. `/roles` or `/companies/<uuid>/roles`. Kept separate from the API `companyUuid` so company users stay off the guarded `/companies/...` routes. */
  basePath: string
  onDelete: (role: RoleListItem) => void
}

export function RoleTable({ roles, basePath, onDelete }: RoleTableProps) {
  const router = useRouter()

  const columns = useMemo<DataTableColumn<RoleListItem>[]>(
    () => [
      {
        id: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.code}</span>
        ),
      },
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const role = row.original
          const detailPath = `${basePath}/${getRoleId(role)}`
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="cursor-pointer"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(detailPath)
                  }}
                >
                  <Eye className="mr-2 size-4" /> View
                </DropdownMenuItem>
                <PermissionGate permission={PERMISSIONS.ROLE.UPDATE}>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`${detailPath}/edit`)
                    }}
                  >
                    <Edit className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.ROLE.PERMISSION_ASSIGN}>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`${detailPath}/permissions`)
                    }}
                  >
                    <Key className="mr-2 size-4" /> Manage Permissions
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.ROLE.DELETE}>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(role)
                    }}
                  >
                    <Trash2 className="mr-2 size-4 text-destructive" />{" "}
                    Delete
                  </DropdownMenuItem>
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [basePath, onDelete, router]
  )

  return (
    <DataTable
      columns={columns}
      data={roles}
      getRowId={(role) => getRoleId(role)}
      onRowClick={(role) => router.push(`${basePath}/${getRoleId(role)}`)}
    />
  )
}
