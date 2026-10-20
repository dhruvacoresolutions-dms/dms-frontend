"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarRange,
  MoreHorizontal,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import { toast } from "sonner"

import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { CalendarSectionNav } from "@/features/company-calendar/components/CalendarSectionNav"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/permissions"
import {
  formatCalendarDate,
  getCalendarErrorMessage,
  sortFiscalYears,
} from "@/features/company-calendar/utils/calendar.utils"
import { FiscalYearFormDialog } from "@/features/company-calendar/components/FiscalYearFormDialog"
import { useFiscalYears } from "@/features/company-calendar/hooks/use-fiscal-years"
import { useUpdateFiscalYearStatus } from "@/features/company-calendar/hooks/use-update-fiscal-year-status"
import type { FiscalYear } from "@/features/company-calendar/api/company-calendar.types"

export default function FiscalYearsPage() {
  return (
    <RouteGate permission={PERMISSIONS.COMPANY_CALENDAR.VIEW}>
      <FiscalYearsContent />
    </RouteGate>
  )
}

function FiscalYearsContent() {
  const router = useRouter()
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  const { data, isLoading, error, refetch } = useFiscalYears(companyUuid)
  const statusMutation = useUpdateFiscalYearStatus(companyUuid)
  const { can } = usePermission()
  const canManage = can("COMPANY_CALENDAR", "MANAGE")

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<FiscalYear | null>(null)
  const [statusTarget, setStatusTarget] = useState<FiscalYear | null>(null)

  const years = useMemo(() => sortFiscalYears(data ?? []), [data])

  const columns = useMemo<DataTableColumn<FiscalYear>[]>(
    () => [
      {
        id: "name",
        header: "Fiscal year",
        cell: ({ row }) => (
          <Link
            href={`/company-calendar/fiscal-years/${row.original.uuid}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "startDate",
        header: "Start date",
        cell: ({ row }) => formatCalendarDate(row.original.startDate),
      },
      {
        id: "endDate",
        header: "End date",
        cell: ({ row }) => formatCalendarDate(row.original.endDate),
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
          const year = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Actions for ${year.name}`}
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-48">
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/company-calendar/fiscal-years/${year.uuid}`)
                  }
                >
                  <CalendarRange className="mr-2 size-4" /> Manage periods
                </DropdownMenuItem>
                <PermissionGate
                  permission={PERMISSIONS.COMPANY_CALENDAR.MANAGE}
                >
                  <DropdownMenuItem onClick={() => setEditing(year)}>
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                {canManage ? <DropdownMenuSeparator /> : null}
                <PermissionGate
                  permission={PERMISSIONS.COMPANY_CALENDAR.MANAGE}
                >
                  <DropdownMenuItem
                    variant={
                      year.status === "ACTIVE" ? "destructive" : "default"
                    }
                    onClick={() => setStatusTarget(year)}
                  >
                    {year.status === "ACTIVE" ? (
                      <>
                        <ToggleLeft className="mr-2 size-4" /> Deactivate
                      </>
                    ) : (
                      <>
                        <ToggleRight className="mr-2 size-4" /> Activate
                      </>
                    )}
                  </DropdownMenuItem>
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [router, canManage]
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Fiscal Years"
        description="Fiscal years and accounting periods; years are inclusive and cannot overlap"
        action={
          <PermissionGate permission={PERMISSIONS.COMPANY_CALENDAR.MANAGE}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" /> Create Fiscal Year
            </Button>
          </PermissionGate>
        }
      />

      <CalendarSectionNav />

      <DataTable
        columns={columns}
        data={years}
        getRowId={(year) => year.uuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: CalendarRange,
          title: "No fiscal years found",
          description: canManage
            ? "Create a fiscal year before adding accounting periods, holidays or effective calendar checks."
            : "No fiscal years have been configured for this company.",
          action: (
            <PermissionGate permission={PERMISSIONS.COMPANY_CALENDAR.MANAGE}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Create Fiscal Year
              </Button>
            </PermissionGate>
          ),
        }}
      />

      <FiscalYearFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <FiscalYearFormDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        companyUuid={companyUuid}
        fiscalYear={editing}
      />

      <ConfirmDialog
        open={!!statusTarget}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={
          statusTarget?.status === "ACTIVE"
            ? "Deactivate fiscal year?"
            : "Activate fiscal year?"
        }
        description={
          statusTarget
            ? `“${statusTarget.name}” will be marked ${
                statusTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
              }. Existing accounting periods are not changed.`
            : undefined
        }
        confirmLabel={
          statusTarget?.status === "ACTIVE" ? "Deactivate" : "Activate"
        }
        variant={statusTarget?.status === "ACTIVE" ? "destructive" : "default"}
        isLoading={statusMutation.isPending}
        onConfirm={() => {
          if (!statusTarget) return
          statusMutation.mutate(
            {
              fiscalYearUuid: statusTarget.uuid,
              status: statusTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
            },
            {
              onSuccess: () => {
                toast.success(
                  statusTarget.status === "ACTIVE"
                    ? "Fiscal year deactivated"
                    : "Fiscal year activated"
                )
                setStatusTarget(null)
              },
              onError: (err) =>
                toast.error(
                  getCalendarErrorMessage(
                    err,
                    "Failed to update fiscal year status"
                  )
                ),
            }
          )
        }}
      />
    </div>
  )
}
