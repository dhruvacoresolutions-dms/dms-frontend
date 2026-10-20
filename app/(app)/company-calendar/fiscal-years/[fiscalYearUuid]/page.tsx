"use client"

import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { addDays, format, parseISO } from "date-fns"
import {
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
import { usePermission } from "@/hooks/use-permission"
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
  inclusiveDayCount,
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
  const { can } = usePermission()
  const canManageCalendar = can("COMPANY_CALENDAR", "MANAGE")
  const canClosePeriod = can("ACCOUNTING_PERIOD", "CLOSE")
  const canReopenPeriod = can("ACCOUNTING_PERIOD", "REOPEN")

  const coverage = useMemo(() => {
    if (!fiscalYear) return { periodCount: 0, percent: 0 }
    const totalDays = inclusiveDayCount(
      fiscalYear.startDate,
      fiscalYear.endDate
    )
    const coveredDays = periods.reduce(
      (total, period) =>
        total + inclusiveDayCount(period.startDate, period.endDate),
      0
    )
    return {
      periodCount: periods.length,
      percent:
        totalDays > 0
          ? Math.min(100, Math.round((coveredDays / totalDays) * 100))
          : 0,
    }
  }, [periods, fiscalYear])

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

  const columns = useMemo<DataTableColumn<AccountingPeriod>[]>(() => {
    const base: DataTableColumn<AccountingPeriod>[] = [
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
          if (period.status === "CLOSED" && period.closedAt) {
            return (
              <span className="text-xs">
                Closed {formatCalendarDateTime(period.closedAt)}
              </span>
            )
          }
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
          return <span className="text-muted-foreground">—</span>
        },
      },
    ]

    if (canManageCalendar || canClosePeriod || canReopenPeriod) {
      base.push({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const period = row.original
          const isOpen = period.status === "OPEN"
          const showEdit = canManageCalendar && isOpen
          const showClose = canClosePeriod && isOpen
          const showReopen = canReopenPeriod && !isOpen
          const showSeparator = showEdit && (showClose || showReopen)

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Actions for ${period.name}`}
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-44">
                {showEdit ? (
                  <DropdownMenuItem onClick={() => setEditingPeriod(period)}>
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                ) : null}
                {showSeparator ? <DropdownMenuSeparator /> : null}
                {showClose ? (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setClosingPeriod(period)}
                  >
                    <Lock className="mr-2 size-4" /> Close period
                  </DropdownMenuItem>
                ) : null}
                {showReopen ? (
                  <DropdownMenuItem onClick={() => setReopeningPeriod(period)}>
                    <Unlock className="mr-2 size-4" /> Reopen period
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      })
    }

    return base
  }, [canManageCalendar, canClosePeriod, canReopenPeriod])

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
          description="The fiscal year may belong to another company or no longer exists"
          backHref="/company-calendar/fiscal-years"
          backLabel="Back to fiscal years"
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
        backHref="/company-calendar/fiscal-years"
        backLabel="Back to fiscal years"
        action={
          <div className="flex flex-wrap items-center gap-2">
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
              <dt className="text-muted-foreground">Accounting periods</dt>
              <dd className="mt-1 font-medium tabular-nums">
                {coverage.periodCount}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Coverage</dt>
              <dd className="mt-1">
                <span className="font-medium tabular-nums">
                  {coverage.percent}%
                </span>
                <div
                  role="progressbar"
                  aria-label="Fiscal year covered by accounting periods"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={coverage.percent}
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300"
                    style={{ width: `${coverage.percent}%` }}
                  />
                </div>
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

      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Accounting periods</h2>
        <p className="text-sm text-muted-foreground">
          Periods must stay inside the fiscal year and be contiguous, with no
          gaps or overlaps.
        </p>
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
          description: canManageCalendar
            ? `Create the first period starting on ${formatCalendarDate(
                fiscalYear.startDate
              )}.`
            : "No accounting periods have been added to this fiscal year yet.",
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
