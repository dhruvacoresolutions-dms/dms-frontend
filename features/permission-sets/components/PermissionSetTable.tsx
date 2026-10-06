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
import type { PermissionSetListItem } from "../api/permission-set.types"
import { getPermissionSetId } from "../utils/permission-set.utils"

type PermissionSetTableProps = {
  sets: PermissionSetListItem[]
  /** Navigation base, e.g. `/permission-sets` or `/companies/<uuid>/permission-sets`. Kept separate from the API `companyUuid` so company users stay off the guarded `/companies/...` routes. */
  basePath: string
  onDelete: (set: PermissionSetListItem) => void
}

export function PermissionSetTable({
  sets,
  basePath,
  onDelete,
}: PermissionSetTableProps) {
  const router = useRouter()

  const columns = useMemo<DataTableColumn<PermissionSetListItem>[]>(
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
          const set = row.original
          const detailPath = `${basePath}/${getPermissionSetId(set)}`
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
                <PermissionGate permission={PERMISSIONS.PERMISSION_SET.UPDATE}>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`${detailPath}/edit`)
                    }}
                  >
                    <Edit className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.PERMISSION_SET.UPDATE}>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`${detailPath}/permissions`)
                    }}
                  >
                    <Key className="mr-2 size-4" /> Manage Permissions
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.PERMISSION_SET.DELETE}>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(set)
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
      data={sets}
      getRowId={(set) => getPermissionSetId(set)}
      onRowClick={(set) => router.push(`${basePath}/${getPermissionSetId(set)}`)}
    />
  )
}
