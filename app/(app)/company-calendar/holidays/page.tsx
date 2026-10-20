"use client"

import { useMemo, useState } from "react"
import {
  CalendarOff,
  MoreHorizontal,
  Pencil,
  Plus,
  ToggleLeft,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { useAuthStore } from "@/stores/auth-store"
import { PageHeader } from "@/components/common/PageHeader"
import { CalendarSectionNav } from "@/features/company-calendar/components/CalendarSectionNav"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { DatePicker } from "@/components/common/DatePicker"
import { StatusBadge } from "@/components/common/StatusBadge"
import { StatusFilterSelect } from "@/components/common/StatusFilterSelect"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
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
import { PERMISSIONS } from "@/lib/permissions"
import { HolidayFormDialog } from "@/features/company-calendar/components/HolidayFormDialog"
import { GeographyLabel } from "@/features/company-calendar/components/GeographyLabel"
import { useHolidays } from "@/features/company-calendar/hooks/use-holidays"
import { useInactivateHoliday } from "@/features/company-calendar/hooks/use-inactivate-holiday"
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
  const [size, setSize] = useState(20)

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Holiday | null>(null)
  const [inactivating, setInactivating] = useState<Holiday | null>(null)

  const partialRange = !!from !== !!to
  const reversedRange = !!from && !!to && from > to

  const { data, isLoading, error, refetch } = useHolidays(companyUuid, {
    from: partialRange || reversedRange ? undefined : from,
    to: partialRange || reversedRange ? undefined : to,
    geographyUuid: geographyUuid ?? undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    page,
    size,
  })

  const inactivateMutation = useInactivateHoliday(companyUuid)

  const holidays = data?.content ?? []
  const hasFilters = !!from || !!to || !!geographyUuid || statusFilter !== "ALL"

  const columns = useMemo<DataTableColumn<Holiday>[]>(
    () => [
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
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const holiday = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-44">
                <PermissionGate
                  permission={PERMISSIONS.COMPANY_CALENDAR.MANAGE}
                >
                  <DropdownMenuItem onClick={() => setEditing(holiday)}>
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                {holiday.status === "ACTIVE" ? (
                  <>
                    <DropdownMenuSeparator />
                    <PermissionGate
                      permission={PERMISSIONS.COMPANY_CALENDAR.MANAGE}
                    >
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setInactivating(holiday)}
                      >
                        <ToggleLeft className="mr-2 size-4" /> Inactivate
                      </DropdownMenuItem>
                    </PermissionGate>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [companyUuid]
  )

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
        description="Company-wide and geography-specific holidays used by the effective calendar."
        action={
          <PermissionGate permission={PERMISSIONS.COMPANY_CALENDAR.MANAGE}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" /> Create Holiday
            </Button>
          </PermissionGate>
        }
      />

      <CalendarSectionNav />

      <div className="flex flex-wrap items-end gap-3">
        <Field className="w-full sm:w-48">
          <FieldLabel>From</FieldLabel>
          <DatePicker
            value={from}
            onValueChange={(value) => {
              setFrom(value)
              setPage(0)
            }}
            placeholder="Any date"
          />
        </Field>
        <Field className="w-full sm:w-48">
          <FieldLabel>To</FieldLabel>
          <DatePicker
            value={to}
            onValueChange={(value) => {
              setTo(value)
              setPage(0)
            }}
            placeholder="Any date"
          />
        </Field>
        <Field className="w-full sm:w-64">
          <FieldLabel>Geography</FieldLabel>
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
        </Field>
        <StatusFilterSelect
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value as "ALL" | "ACTIVE" | "INACTIVE")
            setPage(0)
          }}
          className="sm:w-44"
        />
        {hasFilters ? (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="mr-2 size-4" /> Clear filters
          </Button>
        ) : null}
      </div>

      {partialRange ? (
        <p className="text-sm text-destructive">
          Select both the From and To dates, or clear both.
        </p>
      ) : null}
      {reversedRange ? (
        <p className="text-sm text-destructive">
          From date must be on or before the To date.
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
            : "Create a holiday to keep it out of the effective calendar.",
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
        title="Inactivate holiday?"
        description={
          inactivating
            ? `“${inactivating.name}” will be marked INACTIVE and removed from the effective calendar. The record is retained.`
            : undefined
        }
        confirmLabel="Inactivate"
        variant="destructive"
        isLoading={inactivateMutation.isPending}
        onConfirm={() => {
          if (!inactivating) return
          inactivateMutation.mutate(inactivating.uuid, {
            onSuccess: () => {
              toast.success("Holiday inactivated")
              setInactivating(null)
            },
            onError: (err) =>
              toast.error(
                getCalendarErrorMessage(err, "Failed to inactivate holiday")
              ),
          })
        }}
      />
    </div>
  )
}
