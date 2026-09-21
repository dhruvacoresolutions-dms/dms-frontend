"use client"

import { useRouter } from "next/navigation"
import { Eye, Edit, Key, MoreHorizontal, Trash2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sets.map((set) => {
            const id = getPermissionSetId(set)
            const detailPath = `${basePath}/${id}`
            return (
              <TableRow
                key={id}
                className="cursor-pointer"
                onClick={() => router.push(detailPath)}
              >
                <TableCell className="font-mono text-sm">{set.code}</TableCell>
                <TableCell className="font-medium">{set.name}</TableCell>
                <TableCell>
                  <StatusBadge status={set.status} />
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
