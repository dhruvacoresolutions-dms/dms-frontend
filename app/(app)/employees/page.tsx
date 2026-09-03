"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { Briefcase, Plus, Search, MoreHorizontal, Eye, Edit, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { PageHeader } from "@/components/common/PageHeader"
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { useEmployees } from "@/features/employees/hooks/use-employees"
import { useUpdateEmployeeStatus } from "@/features/employees/hooks/use-update-employee-status"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function EmployeesPage() {
  const router = useRouter()
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [statusToggle, setStatusToggle] = useState<{
    employeeUuid: string
    currentStatus: string
  } | null>(null)

  const { data, isLoading, error, refetch } = useEmployees(companyUuid, {
    search: search || undefined,
    page,
    size: 20,
  })

  const updateStatusMutation = useUpdateEmployeeStatus(companyUuid)
  const employees = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Employees"
        description="Manage company employees"
        action={
          <Button nativeButton={false} render={<Link href={`/employees/new`} />}>
            <Plus className="mr-2 size-4" />
            Create Employee
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : error ? (
        <ErrorState onRetry={refetch} />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No employees found"
          description={search ? "Try a different search term." : "Get started by creating an employee."}
        >
          {!search && (
            <Button nativeButton={false} render={<Link href={`/employees/new`} />} className="mt-2">
              <Plus className="mr-2 size-4" />
              Create Employee
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow
                    key={emp.employeeUuid}
                    className="cursor-pointer"
                    onClick={() => router.push(`/employees/${emp.employeeUuid}`)}
                  >
                    <TableCell className="font-mono text-sm">{emp.employeeCode}</TableCell>
                    <TableCell className="font-medium">{emp.firstName} {emp.lastName}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>{emp.designationName ?? "-"}</TableCell>
                    <TableCell><StatusBadge status={emp.status} /></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} className="cursor-pointer">
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/employees/${emp.employeeUuid}`) }}>
                            <Eye className="mr-2 size-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/employees/${emp.employeeUuid}/edit`) }}>
                            <Edit className="mr-2 size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setStatusToggle({ employeeUuid: emp.employeeUuid, currentStatus: emp.status }) }}>
                            {emp.status === "ACTIVE" ? <><ToggleLeft className="mr-2 size-4" /> Deactivate</> : <><ToggleRight className="mr-2 size-4" /> Activate</>}
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
              <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title={statusToggle?.currentStatus === "ACTIVE" ? "Deactivate Employee?" : "Activate Employee?"}
        description={statusToggle?.currentStatus === "ACTIVE" ? "This employee will be deactivated." : "This employee will be reactivated."}
        confirmLabel={statusToggle?.currentStatus === "ACTIVE" ? "Deactivate" : "Activate"}
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            { employeeUuid: statusToggle.employeeUuid, input: { status: statusToggle.currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE" } },
            {
              onSuccess: () => { toast.success("Employee status updated"); setStatusToggle(null) },
              onError: (error) => { toast.error(getApiErrorMessage(error, "Failed to update status")) },
            }
          )
        }}
      />
    </div>
  )
}
