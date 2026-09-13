"use client"

import { MoreHorizontal, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/common/StatusBadge"
import type { DepartmentResponse } from "../api/department.types"

type DepartmentTableProps = {
  departments: DepartmentResponse[]
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onEdit: (department: DepartmentResponse) => void
}

export function DepartmentTable({
  departments,
  page,
  totalPages,
  onPageChange,
  onEdit,
}: DepartmentTableProps) {
  return (
    <>
      <div className="rounded-md border overflow-hidden">
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
            {departments.map((d) => (
              <TableRow key={d.departmentUuid}>
                <TableCell className="font-mono text-sm">{d.code}</TableCell>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>
                  <StatusBadge status={d.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="cursor-pointer">
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(d)}>
                        <Pencil className="mr-2 size-4" /> Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
