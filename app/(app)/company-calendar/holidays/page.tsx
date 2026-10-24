"use client"

import { useCallback, useMemo, useState } from "react"
import {
  AlertCircle,
  CalendarOff,
  MoreHorizontal,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { DateRangePicker } from "@/components/common/DateRangePicker"
import { StatusBadge } from "@/components/common/StatusBadge"
import { StatusFilterSelect } from "@/components/common/StatusFilterSelect"
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
import { GeographyCombobox } from "@/features/geographies/components/GeographyCombobox"
import { usePermission } from "@/hooks/use-permission"
import { PERMISSIONS } from "@/lib/permissions"
import { HolidayFormDialog } from "@/features/company-calendar/components/HolidayFormDialog"
import { GeographyLabel } from "@/features/company-calendar/components/GeographyLabel"
import { useHolidays } from "@/features/company-calendar/hooks/use-holidays"
import { useInactivateHoliday } from "@/features/company-calendar/hooks/use-inactivate-holiday"
import { useUpdateHoliday } from "@/features/company-calendar/hooks/use-update-holiday"
import {
  formatCalendarDate,
  getCalendarErrorMessage,
} from "@/features/company-calendar/utils/calendar.utils"
import type { Holiday } from "@/features/company-calendar/api/company-calendar.types"

export default function HolidaysPage() {
  return (
    <RouteGate permission={PERMISSIONS.COMPANY_CALENDAR.VIEW}>
      <HolidaysContent />
    </RouteGate>
  )
}

function HolidaysContent() {
  const companyUuid =
    useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"

  const [from, setFrom] = useState<string | undefined>(undefined)
  const [to, setTo] = useState<string | undefined>(undefined)
  const [geographyUuid, setGeographyUuid] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Holiday | null>(null)
  const [inactivating, setInactivating] = useState<Holiday | null>(null)

  const { can } = usePermission()
  const canManage = can("COMPANY_CALENDAR", "MANAGE")

  const partialRange = !!from !== !!to
  const reversedRange = !!from && !!to && from > to
  const dateFilterError = partialRange
    ? "Select both the From and To dates to filter by date range."
    : reversedRange
      ? "From date must be on or before the To date."
      : null

  const { data, isLoading, error, refetch } = useHolidays(companyUuid, {
    from: partialRange || reversedRange ? undefined : from,
    to: partialRange || reversedRange ? undefined : to,
    geographyUuid: geographyUuid ?? undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    page,
    size,
  })

  const inactivateMutation = useInactivateHoliday(companyUuid)
  const { mutate: updateHoliday } = useUpdateHoliday(companyUuid)

  const holidays = data?.content ?? []
  const hasFilters = !!from || !!to || !!geographyUuid || statusFilter !== "ALL"

  const handleActivate = useCallback(
    (holiday: Holiday) => {
      updateHoliday(
        {
          holidayUuid: holiday.uuid,
          input: {
            holidayDate: holiday.holidayDate,
            name: holiday.name,
            geographyUuid: holiday.geographyUuid,
            status: "ACTIVE",
          },
        },
        {
          onSuccess: () => toast.success("Holiday activated"),
          onError: (err) =>
            toast.error(
              getCalendarErrorMessage(err, "Failed to activate holiday")
            ),
        }
      )
    },
    [updateHoliday]
  )

  const columns = useMemo<DataTableColumn<Holiday>[]>(() => {
    const base: DataTableColumn<Holiday>[] = [
      {
        id: "holidayDate",
        header: "Date",
        cell: ({ row }) => (
          <span className="font-medium whitespace-nowrap">
            {formatCalendarDate(row.original.holidayDate)}
          </span>
        ),
      },
      {
        id: "name",
        header: "Holiday",
        cell: ({ row }) => row.original.name,
      },
      {
        id: "geography",
        header: "Applies to",
        cell: ({ row }) => (
          <GeographyLabel
            companyUuid={companyUuid}
            geographyUuid={row.original.geographyUuid}
          />
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ]

    if (canManage) {
      base.push({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const holiday = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Actions for ${holiday.name}`}
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-44">
                <DropdownMenuItem onClick={() => setEditing(holiday)}>
                  <Pencil className="mr-2 size-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {holiday.status === "ACTIVE" ? (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setInactivating(holiday)}
                  >
                    <ToggleLeft className="mr-2 size-4" /> Deactivate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleActivate(holiday)}>
                    <ToggleRight className="mr-2 size-4" /> Activate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      })
    }

    return base
  }, [companyUuid, canManage, handleActivate])

  const clearFilters = () => {
    setFrom(undefined)
    setTo(undefined)
    setGeographyUuid(null)
    setStatusFilter("ALL")
    setPage(0)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Holidays"
        description="Company-wide and geography-specific holidays excluded from the effective calendar"
        action={
          <PermissionGate permission={PERMISSIONS.COMPANY_CALENDAR.MANAGE}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" /> Create Holiday
            </Button>
          </PermissionGate>
        }
      />

      <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
        <div className="col-span-2 sm:w-72">
          <label htmlFor="holiday-date-range" className="sr-only">
            Filter by date range
          </label>
          <DateRangePicker
            id="holiday-date-range"
            value={{ from, to }}
            onValueChange={(range) => {
              setFrom(range.from)
              setTo(range.to)
              setPage(0)
            }}
            hasError={!!dateFilterError}
            placeholder="Filter by date range"
          />
        </div>
        <div className="col-span-2 sm:w-64">
          <GeographyCombobox
            companyUuid={companyUuid}
            value={geographyUuid}
            onValueChange={(value) => {
              setGeographyUuid(value)
              setPage(0)
            }}
            placeholder="All geographies"
            status="ACTIVE"
          />
        </div>
        <div className="sm:w-40">
          <StatusFilterSelect
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value as "ALL" | "ACTIVE" | "INACTIVE")
              setPage(0)
            }}
            className="w-full sm:w-40"
            ariaLabel="Filter holidays by status"
          />
        </div>
        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            className="justify-self-start"
            onClick={clearFilters}
          >
            <X className="mr-2 size-4" /> Clear filters
          </Button>
        ) : null}
      </div>

      {dateFilterError ? (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {dateFilterError} Showing all holidays until the dates are valid.
        </p>
      ) : null}

      <DataTable
        columns={columns}
        data={holidays}
        getRowId={(holiday) => holiday.uuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: CalendarOff,
          title: "No holidays found",
          description: hasFilters
            ? "Try a different date range, geography or status."
            : canManage
              ? "Create a holiday to keep it out of the effective calendar."
              : "No holidays have been configured for this company.",
          action: !hasFilters ? (
            <PermissionGate permission={PERMISSIONS.COMPANY_CALENDAR.MANAGE}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" /> Create Holiday
              </Button>
            </PermissionGate>
          ) : (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          ),
        }}
        pagination={{
          page,
          totalPages: data?.totalPages ?? 0,
          totalElements: data?.totalElements,
          pageSize: size,
          onPageChange: setPage,
          onPageSizeChange: (nextSize) => {
            setSize(nextSize)
            setPage(0)
          },
        }}
      />

      <HolidayFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <HolidayFormDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        companyUuid={companyUuid}
        holiday={editing}
      />

      <ConfirmDialog
        open={!!inactivating}
        onOpenChange={(open) => !open && setInactivating(null)}
        title="Deactivate holiday?"
        description={
          inactivating
            ? `“${inactivating.name}” will be marked INACTIVE and excluded from the effective calendar. The record is retained.`
            : undefined
        }
        confirmLabel="Deactivate"
        variant="destructive"
        isLoading={inactivateMutation.isPending}
        onConfirm={() => {
          if (!inactivating) return
          inactivateMutation.mutate(inactivating.uuid, {
            onSuccess: () => {
              toast.success("Holiday deactivated")
              setInactivating(null)
            },
            onError: (err) =>
              toast.error(
                getCalendarErrorMessage(err, "Failed to deactivate holiday")
              ),
          })
        }}
      />
    </div>
  )
}
