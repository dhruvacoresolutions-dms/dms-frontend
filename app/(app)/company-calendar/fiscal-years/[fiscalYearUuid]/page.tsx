"use client"

import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { addDays, format, parseISO } from "date-fns"
import {
  ArrowLeft,
  CalendarClock,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Unlock,
} from "lucide-react"
import { toast } from "sonner"

import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { ErrorState } from "@/components/common/ErrorState"
import { CalendarSectionNav } from "@/features/company-calendar/components/CalendarSectionNav"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { FiscalYearFormDialog } from "@/features/company-calendar/components/FiscalYearFormDialog"
import { AccountingPeriodFormDialog } from "@/features/company-calendar/components/AccountingPeriodFormDialog"
import { ReopenPeriodDialog } from "@/features/company-calendar/components/ReopenPeriodDialog"
import { useFiscalYears } from "@/features/company-calendar/hooks/use-fiscal-years"
import { useAccountingPeriods } from "@/features/company-calendar/hooks/use-accounting-periods"
import { useCloseAccountingPeriod } from "@/features/company-calendar/hooks/use-close-accounting-period"
import {
  formatCalendarDate,
  formatCalendarDateTime,
  getCalendarErrorMessage,
} from "@/features/company-calendar/utils/calendar.utils"
import type { AccountingPeriod } from "@/features/company-calendar/api/company-calendar.types"

export default function FiscalYearDetailPage() {
  return (
    <RouteGate permission={PERMISSIONS.COMPANY_CALENDAR.VIEW}>
      <FiscalYearDetailContent />
    </RouteGate>
  )
}

function FiscalYearDetailContent() {
  const params = useParams<{ fiscalYearUuid: string }>()
  const fiscalYearUuid = params.fiscalYearUuid
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  const yearsQuery = useFiscalYears(companyUuid)
  const periodsQuery = useAccountingPeriods(companyUuid, fiscalYearUuid)
  const closeMutation = useCloseAccountingPeriod(companyUuid)

  const [createOpen, setCreateOpen] = useState(false)
  const [editingYearOpen, setEditingYearOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<AccountingPeriod | null>(
    null
  )
  const [closingPeriod, setClosingPeriod] = useState<AccountingPeriod | null>(
    null
  )
  const [reopeningPeriod, setReopeningPeriod] =
    useState<AccountingPeriod | null>(null)

  const fiscalYear = yearsQuery.data?.find(
    (year) => year.uuid === fiscalYearUuid
  )
  const periods = useMemo(() => periodsQuery.data ?? [], [periodsQuery.data])

  const { sortedPeriods, suggestedStartDate, canCreatePeriod } = useMemo(() => {
    const sorted = [...periods].sort((a, b) =>
      a.startDate.localeCompare(b.startDate)
    )
    if (!fiscalYear) {
      return {
        sortedPeriods: sorted,
        suggestedStartDate: undefined,
        canCreatePeriod: false,
      }
    }
    const last = sorted[sorted.length - 1]
    const nextStart = last
      ? format(addDays(parseISO(last.endDate), 1), "yyyy-MM-dd")
      : fiscalYear.startDate
    return {
      sortedPeriods: sorted,
      suggestedStartDate: nextStart,
      canCreatePeriod: nextStart <= fiscalYear.endDate,
    }
  }, [periods, fiscalYear])

  const columns = useMemo<DataTableColumn<AccountingPeriod>[]>(
    () => [
      {
        id: "name",
        header: "Period",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
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
        id: "audit",
        header: "Audit",
        cell: ({ row }) => {
          const period = row.original
          if (period.reopenedAt) {
            return (
              <div className="max-w-64 space-y-0.5 text-xs">
                <p>Reopened {formatCalendarDateTime(period.reopenedAt)}</p>
                {period.reopenReason ? (
                  <p
                    className="truncate text-muted-foreground"
                    title={period.reopenReason}
                  >
                    Reason: {period.reopenReason}
                  </p>
                ) : null}
              </div>
            )
          }
          if (period.status === "CLOSED" && period.closedAt) {
            return (
              <span className="text-xs">
                Closed {formatCalendarDateTime(period.closedAt)}
              </span>
            )
          }
          return <span className="text-muted-foreground">—</span>
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const period = row.original
          const isOpen = period.status === "OPEN"
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-44">
                <PermissionGate
                  permission={PERMISSIONS.COMPANY_CALENDAR.MANAGE}
                >
                  {isOpen ? (
                    <DropdownMenuItem onClick={() => setEditingPeriod(period)}>
                      <Pencil className="mr-2 size-4" /> Edit
                    </DropdownMenuItem>
                  ) : null}
                </PermissionGate>
                <DropdownMenuSeparator />
                {isOpen ? (
                  <PermissionGate
                    permission={PERMISSIONS.ACCOUNTING_PERIOD.CLOSE}
                  >
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setClosingPeriod(period)}
                    >
                      <Lock className="mr-2 size-4" /> Close period
                    </DropdownMenuItem>
                  </PermissionGate>
                ) : (
                  <PermissionGate
                    permission={PERMISSIONS.ACCOUNTING_PERIOD.REOPEN}
                  >
                    <DropdownMenuItem
                      onClick={() => setReopeningPeriod(period)}
                    >
                      <Unlock className="mr-2 size-4" /> Reopen period
                    </DropdownMenuItem>
                  </PermissionGate>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    []
  )

  if (yearsQuery.isLoading) return <LoadingState />
  if (yearsQuery.error) {
    return (
      <ErrorState
        message={getCalendarErrorMessage(
          yearsQuery.error,
          "Failed to load the fiscal year"
        )}
        onRetry={() => void yearsQuery.refetch()}
      />
    )
  }
  if (!fiscalYear) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader
          title="Fiscal year not found"
          description="The fiscal year may belong to another company or no longer exists."
          action={
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/company-calendar/fiscal-years" />}
            >
              <ArrowLeft className="mr-2 size-4" /> Back to fiscal years
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title={fiscalYear.name}
        description={`Fiscal year ${formatCalendarDate(
          fiscalYear.startDate
        )} – ${formatCalendarDate(fiscalYear.endDate)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/company-calendar/fiscal-years" />}
            >
              <ArrowLeft className="mr-2 size-4" /> Back
            </Button>
            <PermissionGate permission={PERMISSIONS.COMPANY_CALENDAR.MANAGE}>
              <Button
                variant="outline"
                onClick={() => setEditingYearOpen(true)}
              >
                <Pencil className="mr-2 size-4" /> Edit year
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.COMPANY_CALENDAR.MANAGE}>
              <Button
                onClick={() => setCreateOpen(true)}
                disabled={!canCreatePeriod}
                title={
                  canCreatePeriod
                    ? undefined
                    : "The fiscal year is already fully covered by accounting periods"
                }
              >
                <Plus className="mr-2 size-4" /> Create Period
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <CalendarSectionNav />

      <Card size="sm">
        <CardHeader>
          <CardTitle>Fiscal year details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <StatusBadge status={fiscalYear.status} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Start date</dt>
              <dd className="mt-1 font-medium">
                {formatCalendarDate(fiscalYear.startDate)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">End date</dt>
              <dd className="mt-1 font-medium">
                {formatCalendarDate(fiscalYear.endDate)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Next period start</dt>
              <dd className="mt-1 font-medium">
                {canCreatePeriod
                  ? formatCalendarDate(suggestedStartDate)
                  : "Fully covered"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Accounting periods</h2>
          <p className="text-sm text-muted-foreground">
            Periods must stay inside the fiscal year and be contiguous, with no
            gaps or overlaps.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={sortedPeriods}
        getRowId={(period) => period.uuid}
        isLoading={periodsQuery.isLoading}
        error={periodsQuery.error}
        onRetry={() => void periodsQuery.refetch()}
        empty={{
          icon: CalendarClock,
          title: "No accounting periods yet",
          description: `Create the first period starting on ${formatCalendarDate(
            fiscalYear.startDate
          )}.`,
          action: (
            <PermissionGate permission={PERMISSIONS.COMPANY_CALENDAR.MANAGE}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Create Period
              </Button>
            </PermissionGate>
          ),
        }}
      />

      <FiscalYearFormDialog
        open={editingYearOpen}
        onOpenChange={setEditingYearOpen}
        companyUuid={companyUuid}
        fiscalYear={fiscalYear}
      />

      <AccountingPeriodFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
        fiscalYear={fiscalYear}
        suggestedStartDate={suggestedStartDate}
      />

      <AccountingPeriodFormDialog
        open={!!editingPeriod}
        onOpenChange={(open) => !open && setEditingPeriod(null)}
        companyUuid={companyUuid}
        fiscalYear={fiscalYear}
        period={editingPeriod}
      />

      <ReopenPeriodDialog
        open={!!reopeningPeriod}
        onOpenChange={(open) => !open && setReopeningPeriod(null)}
        companyUuid={companyUuid}
        fiscalYearUuid={fiscalYear.uuid}
        period={reopeningPeriod}
      />

      <ConfirmDialog
        open={!!closingPeriod}
        onOpenChange={(open) => !open && setClosingPeriod(null)}
        title="Close accounting period?"
        description={
          closingPeriod
            ? `“${closingPeriod.name}” will be locked. A closed period cannot be edited until it is reopened with a reason.`
            : undefined
        }
        confirmLabel="Close period"
        variant="destructive"
        isLoading={closeMutation.isPending}
        onConfirm={() => {
          if (!closingPeriod) return
          closeMutation.mutate(
            {
              fiscalYearUuid: fiscalYear.uuid,
              periodUuid: closingPeriod.uuid,
            },
            {
              onSuccess: () => {
                toast.success("Accounting period closed")
                setClosingPeriod(null)
              },
              onError: (error) =>
                toast.error(
                  getCalendarErrorMessage(
                    error,
                    "Failed to close accounting period"
                  )
                ),
            }
          )
        }}
      />
    </div>
  )
}
