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
          {roles.map((role) => {
            const id = getRoleId(role)
            const detailPath = `${basePath}/${id}`
            return (
              <TableRow
                key={id}
                className="cursor-pointer"
                onClick={() => router.push(detailPath)}
              >
                <TableCell className="font-mono text-sm">{role.code}</TableCell>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell>
                  <StatusBadge status={role.status} />
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
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`${detailPath}/edit`)
                        }}
                      >
                        <Edit className="mr-2 size-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`${detailPath}/permissions`)
                        }}
                      >
                        <Key className="mr-2 size-4" /> Manage Permissions
                      </DropdownMenuItem>
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
