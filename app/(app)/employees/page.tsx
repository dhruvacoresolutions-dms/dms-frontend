"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import {
  Briefcase,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  ToggleLeft,
  ToggleRight,
  Upload,
  KeyRound,
  UserX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { BulkUploadDialog } from "@/features/employees/components/BulkUploadDialog"
import { EmployeeGeographyBulkUploadDialog } from "@/features/employees/components/EmployeeGeographyBulkUploadDialog"
import { EmployeeFilters } from "@/features/employees/components/EmployeeFilters"
import { EmployeeBulkActionDropdown } from "@/features/employees/components/EmployeeBulkActionDropdown"
import { useHasEmployees } from "@/features/employees/hooks/use-has-employees"
import type {
  EmployeeResponse,
  EmployeeStatus,
  EnableEmployeeLoginResponse,
} from "@/features/employees/api/employee.types"
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
import { LoginCredentialsDialog } from "@/components/common/LoginCredentialsDialog"
import { useEmployees } from "@/features/employees/hooks/use-employees"
import { useUpdateEmployeeStatus } from "@/features/employees/hooks/use-update-employee-status"
import { useEnableEmployeeLogin } from "@/features/employees/hooks/use-enable-employee-login"
import { useDisableEmployeeLogin } from "@/features/employees/hooks/use-disable-employee-login"
import { RoleCombobox } from "@/features/roles/components/RoleCombobox"
import { useEmployeeCreationGate } from "@/features/employees/hooks/use-employee-creation-gate"
import { CreationGate } from "@/features/employees/components/CreationGate"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { ExportDropdown } from "@/components/common/ExportDropdown"
import {
  exportEmployees,
  exportEmployeeGeography,
} from "@/features/employees/api/employee.api"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermission } from "@/hooks/use-permission"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"

export default function EmployeesPage() {
  return (
    <RouteGate permission={PERMISSIONS.EMPLOYEE.VIEW}>
      <EmployeesContent />
    </RouteGate>
  )
}

function EmployeesContent() {
  const router = useRouter()
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<"ALL" | EmployeeStatus>(
    "ALL"
  )
  const [designationFilter, setDesignationFilter] = useState<string | null>(
    null
  )
  const [statusToggle, setStatusToggle] = useState<{
    employeeUuid: string
    currentStatus: string
  } | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [geoBulkOpen, setGeoBulkOpen] = useState(false)
  const [loginEnable, setLoginEnable] = useState<EmployeeResponse | null>(null)
  const [loginDisable, setLoginDisable] = useState<EmployeeResponse | null>(
    null
  )
  const [enableRoleUuid, setEnableRoleUuid] = useState<string | null>(null)
  const [loginCredentials, setLoginCredentials] = useState<
    (EnableEmployeeLoginResponse & { employeeLabel: string }) | null
  >(null)
  const [selected, setSelected] = useState<EmployeeResponse[]>([])
  const { hasEmployees } = useHasEmployees(companyUuid)

  const { data, isLoading, error, refetch } = useEmployees(companyUuid, {
    search: search || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    designationUuid: designationFilter ?? undefined,
    page,
    size: 20,
  })

  const hasActiveFilters =
    search !== "" || statusFilter !== "ALL" || designationFilter !== null

  const updateStatusMutation = useUpdateEmployeeStatus(companyUuid)
  const enableLoginMutation = useEnableEmployeeLogin(companyUuid)
  const disableLoginMutation = useDisableEmployeeLogin(companyUuid)
  const creationGate = useEmployeeCreationGate(companyUuid)
  const { canAny } = usePermission()
  // Bulk selection is only useful when a bulk action is permitted.
  const canBulkAction = canAny([
    PERMISSIONS.EMPLOYEE.LOGIN_MANAGE,
    PERMISSIONS.PERMISSION_SET.ASSIGN,
  ])
  const employees = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const employeeId = (emp: EmployeeResponse) => emp.employeeUuid ?? emp.publicId
  const selectedIds = selected.map(employeeId)
  const allPageSelected =
    employees.length > 0 &&
    employees.every((emp) => selectedIds.includes(employeeId(emp)))
  const somePageSelected =
    !allPageSelected &&
    employees.some((emp) => selectedIds.includes(employeeId(emp)))

  const toggleOne = (emp: EmployeeResponse) =>
    setSelected((prev) =>
      prev.some((e) => employeeId(e) === employeeId(emp))
        ? prev.filter((e) => employeeId(e) !== employeeId(emp))
        : [...prev, emp]
    )

  const toggleAllOnPage = () =>
    setSelected((prev) => {
      const prevIds = prev.map(employeeId)
      const allSelected = employees.every((emp) =>
        prevIds.includes(employeeId(emp))
      )
      if (allSelected) {
        const pageIds = new Set(employees.map(employeeId))
        return prev.filter((e) => !pageIds.has(employeeId(e)))
      }
      return [
        ...prev,
        ...employees.filter((emp) => !prevIds.includes(employeeId(emp))),
      ]
    })

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Employees"
        description="Manage company employees"
        action={
          <div className="flex items-center gap-2">
            <PermissionGate permission={PERMISSIONS.EMPLOYEE.IMPORT}>
              <CreationGate message={creationGate.message}>
                <Button
                  variant="outline"
                  disabled={creationGate.disabled}
                  onClick={() => setBulkOpen(true)}
                >
                  <Upload className="mr-2 size-4" />
                  Bulk Upload
                </Button>
              </CreationGate>
            </PermissionGate>
            {hasEmployees && (
              <PermissionGate
                permission={PERMISSIONS.EMPLOYEE.GEOGRAPHY_IMPORT}
              >
                <Button variant="outline" onClick={() => setGeoBulkOpen(true)}>
                  <Upload className="mr-2 size-4" />
                  Geography Upload
                </Button>
              </PermissionGate>
            )}
            <PermissionGate permission={PERMISSIONS.EMPLOYEE.CREATE}>
              <CreationGate message={creationGate.message}>
                <Button
                  nativeButton={false}
                  render={<Link href={`/employees/new`} />}
                  disabled={creationGate.disabled}
                >
                  <Plus className="mr-2 size-4" />
                  Create Employee
                </Button>
              </CreationGate>
            </PermissionGate>
          </div>
        }
      />

      <EmployeeFilters
        companyUuid={companyUuid}
        values={{
          search,
          status: statusFilter,
          designationUuid: designationFilter,
        }}
        onSearchChange={(v) => {
          setSearch(v)
          setPage(0)
        }}
        onStatusChange={(v) => {
          setStatusFilter(v)
          setPage(0)
        }}
        onDesignationChange={(uuid) => {
          setDesignationFilter(uuid)
          setPage(0)
        }}
        onClear={() => {
          setSearch("")
          setStatusFilter("ALL")
          setDesignationFilter(null)
          setPage(0)
        }}
        action={
          <div className="flex items-center gap-2">
            <EmployeeBulkActionDropdown
              companyUuid={companyUuid}
              selected={selected}
              onComplete={() => {
                refetch()
                setSelected([])
              }}
            />
            <ExportDropdown
              permission={PERMISSIONS.EMPLOYEE.EXPORT}
              baseFileName="employee-geography-export"
              label="Geography Export"
              onExport={(format) =>
                exportEmployeeGeography(companyUuid, format)
              }
            />{" "}
            <ExportDropdown
              permission={PERMISSIONS.EMPLOYEE.EXPORT}
              baseFileName="employees-export"
              onExport={(format) =>
                exportEmployees(companyUuid, format, {
                  search: search || undefined,
                  status:
                    statusFilter === "ALL" ? undefined : statusFilter,
                  designationUuid: designationFilter ?? undefined,
                })
              }
            />
          </div>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No employees found"
          description={
            hasActiveFilters
              ? "Try a different search or clear filters."
              : "Get started by creating an employee."
          }
        >
          {!hasActiveFilters && (
            <PermissionGate permission={PERMISSIONS.EMPLOYEE.CREATE}>
              <CreationGate message={creationGate.message}>
                <Button
                  nativeButton={false}
                  render={<Link href={`/employees/new`} />}
                  className="mt-2"
                  disabled={creationGate.disabled}
                >
                  <Plus className="mr-2 size-4" />
                  Create Employee
                </Button>
              </CreationGate>
            </PermissionGate>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {canBulkAction && (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allPageSelected}
                        indeterminate={somePageSelected}
                        onCheckedChange={() => toggleAllOnPage()}
                        aria-label="Select all employees on this page"
                      />
                    </TableHead>
                  )}
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Reporting Manager</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.employeeUuid}>
                    {canBulkAction && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(employeeId(emp))}
                          onCheckedChange={() => toggleOne(emp)}
                          aria-label={`Select ${emp.firstName} ${emp.lastName}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-mono text-sm">
                      {emp.employeeCode}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          {emp.firstName} {emp.lastName}
                          {emp.loginStatus === "ACTIVE" && (
                            <span title="Login enabled">
                              <KeyRound
                                className="size-3.5 text-green-600 dark:text-green-400"
                                aria-label="Login enabled"
                              />
                            </span>
                          )}
                        </span>
                        {emp.email && (
                          <span className="text-xs text-muted-foreground">
                            {emp.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{emp.designationName ?? "-"}</TableCell>
                    <TableCell>{emp.reportsToEmployeeName ?? "-"}</TableCell>
                    <TableCell>{emp.mobile ?? "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={emp.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="cursor-pointer">
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-auto min-w-40"
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              router.push(`/employees/${emp.employeeUuid}`)
                            }}
                          >
                            <Eye className="mr-2 size-4" /> View
                          </DropdownMenuItem>
                          <PermissionGate
                            permission={PERMISSIONS.EMPLOYEE.UPDATE}
                          >
                            <DropdownMenuItem
                              onClick={() => {
                                router.push(
                                  `/employees/${emp.employeeUuid}/edit`
                                )
                              }}
                            >
                              <Edit className="mr-2 size-4" /> Edit
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate
                            permission={PERMISSIONS.EMPLOYEE.LOGIN_MANAGE}
                          >
                            <DropdownMenuSeparator />
                            {emp.loginStatus === "ACTIVE" ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setLoginDisable(emp)
                                }}
                              >
                                <UserX className="mr-2 size-4" /> Disable Login
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setEnableRoleUuid(null)
                                  setLoginEnable(emp)
                                }}
                              >
                                <KeyRound className="mr-2 size-4" /> Enable
                                Login
                              </DropdownMenuItem>
                            )}
                          </PermissionGate>
                          <PermissionGate
                            permission={PERMISSIONS.EMPLOYEE.UPDATE}
                          >
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant={
                                emp.status === "ACTIVE"
                                  ? "destructive"
                                  : "default"
                              }
                              onClick={() => {
                                setStatusToggle({
                                  employeeUuid: emp.employeeUuid,
                                  currentStatus: emp.status,
                                })
                              }}
                            >
                              {emp.status === "ACTIVE" ? (
                                <>
                                  <ToggleLeft className="mr-2 size-4" />{" "}
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="mr-2 size-4" />{" "}
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </PermissionGate>
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
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title={
          statusToggle?.currentStatus === "ACTIVE"
            ? "Deactivate Employee?"
            : "Activate Employee?"
        }
        description={
          statusToggle?.currentStatus === "ACTIVE"
            ? "This employee will be deactivated."
            : "This employee will be reactivated."
        }
        confirmLabel={
          statusToggle?.currentStatus === "ACTIVE" ? "Deactivate" : "Activate"
        }
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            {
              employeeUuid: statusToggle.employeeUuid,
              input: {
                status:
                  statusToggle.currentStatus === "ACTIVE"
                    ? "INACTIVE"
                    : "ACTIVE",
              },
            },
            {
              onSuccess: () => {
                toast.success("Employee status updated")
                setStatusToggle(null)
                refetch()
              },
              onError: (error) => {
                toast.error(
                  getApiErrorMessage(error, "Failed to update status")
                )
              },
            }
          )
        }}
      />

      <Dialog
        open={!!loginEnable}
        onOpenChange={(open) => {
          if (!open) {
            setLoginEnable(null)
            setEnableRoleUuid(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Login</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Select a role for {loginEnable?.firstName} {loginEnable?.lastName} (
            {loginEnable?.employeeCode}). Login credentials will be generated.
          </p>
          <Field>
            <FieldLabel>Role</FieldLabel>
            <RoleCombobox
              companyUuid={companyUuid}
              value={enableRoleUuid}
              onValueChange={(v) => setEnableRoleUuid(v)}
              placeholder="Select role..."
              status="ACTIVE"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setLoginEnable(null)
                setEnableRoleUuid(null)
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!enableRoleUuid || enableLoginMutation.isPending}
              onClick={() => {
                if (!loginEnable || !enableRoleUuid) return
                enableLoginMutation.mutate(
                  {
                    employeeUuid: loginEnable.employeeUuid,
                    input: { roleUuid: enableRoleUuid },
                  },
                  {
                    onSuccess: (data) => {
                      toast.success(
                        `Login enabled${data.username ? ` — ${data.username}` : ""}`
                      )
                      const label =
                        `${loginEnable.firstName} ${loginEnable.lastName}`.trim()
                      setLoginCredentials({
                        ...data,
                        employeeLabel: label
                          ? `${label} (${loginEnable.employeeCode})`
                          : loginEnable.employeeCode,
                      })
                      setLoginEnable(null)
                      setEnableRoleUuid(null)
                      refetch()
                    },
                    onError: (error) => {
                      toast.error(
                        getApiErrorMessage(error, "Failed to enable login")
                      )
                    },
                  }
                )
              }}
            >
              {enableLoginMutation.isPending ? "Enabling..." : "Enable Login"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <LoginCredentialsDialog
        data={loginCredentials}
        title="Login Enabled"
        description={
          loginCredentials
            ? `Login is enabled for ${loginCredentials.employeeLabel}. Save the credentials below — the temporary password will not be shown again.`
            : undefined
        }
        onClose={() => setLoginCredentials(null)}
      />

      <ConfirmDialog
        open={!!loginDisable}
        onOpenChange={(open) => !open && setLoginDisable(null)}
        title="Disable Login?"
        description={`This will disable login for ${loginDisable?.firstName} ${loginDisable?.lastName} (${loginDisable?.employeeCode}).`}
        confirmLabel="Disable"
        variant="destructive"
        isLoading={disableLoginMutation.isPending}
        onConfirm={() => {
          if (!loginDisable) return
          disableLoginMutation.mutate(loginDisable.employeeUuid, {
            onSuccess: () => {
              toast.success("Login disabled")
              setLoginDisable(null)
              refetch()
            },
            onError: (error) => {
              toast.error(getApiErrorMessage(error, "Failed to disable login"))
            },
          })
        }}
      />

      <BulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => refetch()}
      />
      <EmployeeGeographyBulkUploadDialog
        open={geoBulkOpen}
        onOpenChange={setGeoBulkOpen}
        companyUuid={companyUuid}
        onUploadComplete={() => refetch()}
      />
    </div>
  )
}
