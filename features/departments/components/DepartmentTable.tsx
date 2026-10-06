"use client"

import { useMemo } from "react"
import { MoreHorizontal, Pencil } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { PERMISSIONS } from "@/lib/permissions"
import type { DepartmentResponse } from "../api/department.types"
import { DEPARTMENT_TEXTS } from "../configs/department.config"

type DepartmentTableProps = {
  departments: DepartmentResponse[]
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  pageSize: number
  onPageSizeChange: (size: number) => void
  onEdit: (department: DepartmentResponse) => void
  isLoading?: boolean
  error?: unknown
  onRetry?: () => void
  search?: string
}

export function DepartmentTable({
  departments,
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  onEdit,
  isLoading = false,
  error,
  onRetry,
  search = "",
}: DepartmentTableProps) {
  const columns = useMemo<DataTableColumn<DepartmentResponse>[]>(
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
          const d = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <PermissionGate permission={PERMISSIONS.DEPARTMENT.UPDATE}>
                  <DropdownMenuItem onClick={() => onEdit(d)}>
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [onEdit]
  )

  return (
    <DataTable
      columns={columns}
      data={departments}
      getRowId={(d) => d.departmentUuid}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      empty={{
        title: DEPARTMENT_TEXTS.emptyTitle,
        description: search
          ? DEPARTMENT_TEXTS.emptySearchHint
          : DEPARTMENT_TEXTS.emptyCreateHint,
      }}
      pagination={{
        page,
        totalPages,
        onPageChange,
        pageSize,
        onPageSizeChange,
      }}
    />
  )
}
