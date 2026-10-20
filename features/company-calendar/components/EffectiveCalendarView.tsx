"use client"

import { useMemo, useState } from "react"
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns"
import { CalendarCheck, CalendarOff, CalendarX, Sun } from "lucide-react"

import { DatePicker } from "@/components/common/DatePicker"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { GeographyCombobox } from "@/features/geographies/components/GeographyCombobox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { EFFECTIVE_REASON_LABELS } from "../configs/calendar.constants"
import { useEffectiveCalendar } from "../hooks/use-effective-calendar"
import type { EffectiveDay } from "../api/company-calendar.types"
import {
  formatCalendarDate,
  inclusiveDayCount,
  isEffectiveRangeValid,
} from "../utils/calendar.utils"

const REASON_STYLES: Record<string, string> = {
  HOLIDAY:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  WEEKLY_OFF:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  ALTERNATE_SATURDAY:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300",
}

function ReasonBadge({ day }: { day: EffectiveDay }) {
  if (day.isWorkingDay) {
    return (
      <Badge
        variant="outline"
        className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
      >
        Working day
      </Badge>
    )
  }

  const reason = day.reason ?? "WEEKLY_OFF"
  return (
    <Badge variant="outline" className={cn(REASON_STYLES[reason])}>
      {EFFECTIVE_REASON_LABELS[reason] ?? reason}
    </Badge>
  )
}

type EffectiveCalendarViewProps = {
  companyUuid: string
}

export function EffectiveCalendarView({
  companyUuid,
}: EffectiveCalendarViewProps) {
  const today = new Date()
  const [from, setFrom] = useState(format(startOfMonth(today), "yyyy-MM-dd"))
  const [to, setTo] = useState(format(endOfMonth(today), "yyyy-MM-dd"))
  const [geographyUuid, setGeographyUuid] = useState<string | null>(null)

  const validationError = useMemo(() => {
    if (!from || !to) return "Select both the From and To dates."
    const parsedFrom = parseISO(from)
    const parsedTo = parseISO(to)
    if (
      Number.isNaN(parsedFrom.getTime()) ||
      Number.isNaN(parsedTo.getTime())
    ) {
      return "Enter valid From and To dates."
    }
    if (parsedTo < parsedFrom)
      return "To date must be on or after the From date."
    if (!isEffectiveRangeValid(from, to)) {
      return "The range may cover at most 400 days (inclusive)."
    }
    return null
  }, [from, to])

  const { data, isLoading, error, refetch } = useEffectiveCalendar(
    companyUuid,
    { from, to, geographyUuid: geographyUuid || undefined },
    { enabled: !validationError }
  )

  const days = useMemo(() => data ?? [], [data])

  const summary = useMemo(() => {
    return days.reduce(
      (acc, day) => {
        if (day.isWorkingDay) acc.working += 1
        else if (day.reason === "HOLIDAY") acc.holidays += 1
        else if (day.reason === "WEEKLY_OFF") acc.weeklyOffs += 1
        else if (day.reason === "ALTERNATE_SATURDAY")
          acc.alternateSaturdays += 1
        return acc
      },
      { working: 0, holidays: 0, weeklyOffs: 0, alternateSaturdays: 0 }
    )
  }, [days])

  const columns = useMemo<DataTableColumn<EffectiveDay>[]>(
    () => [
      {
        id: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="font-medium">
            {format(parseISO(row.original.date), "EEE, dd MMM yyyy")}
          </span>
        ),
      },
      {
        id: "workingDay",
        header: "Status",
        cell: ({ row }) => <ReasonBadge day={row.original} />,
      },
      {
        id: "holidayName",
        header: "Holiday",
        cell: ({ row }) => row.original.holidayName ?? "—",
      },
      {
        id: "period",
        header: "Accounting period",
        cell: ({ row }) => {
          const period = row.original.period
          if (!period) {
            return <span className="text-muted-foreground">—</span>
          }
          return (
            <span className="flex flex-wrap items-center gap-2">
              <span>{period.name}</span>
              <Badge variant="outline" className="capitalize">
                {period.status.toLowerCase()}
              </Badge>
            </span>
          )
        },
      },
    ],
    []
  )

  const summaryCards = [
    {
      label: "Working days",
      value: summary.working,
      icon: CalendarCheck,
      className: "text-green-600 dark:text-green-400",
    },
    {
      label: "Holidays",
      value: summary.holidays,
      icon: CalendarX,
      className: "text-red-600 dark:text-red-400",
    },
    {
      label: "Weekly offs",
      value: summary.weeklyOffs,
      icon: CalendarOff,
      className: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Alternate Saturdays",
      value: summary.alternateSaturdays,
      icon: Sun,
      className: "text-violet-600 dark:text-violet-400",
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field className="w-full sm:w-52">
          <FieldLabel>From</FieldLabel>
          <DatePicker
            value={from}
            onValueChange={(value) => setFrom(value ?? "")}
            hasError={!!validationError && !from}
            placeholder="Select start date"
          />
        </Field>
        <Field className="w-full sm:w-52">
          <FieldLabel>To</FieldLabel>
          <DatePicker
            value={to}
            onValueChange={(value) => setTo(value ?? "")}
            hasError={!!validationError && !to}
            placeholder="Select end date"
          />
        </Field>
        <Field className="w-full sm:w-64">
          <FieldLabel>Geography (optional)</FieldLabel>
          <GeographyCombobox
            companyUuid={companyUuid}
            value={geographyUuid}
            onValueChange={(value) => setGeographyUuid(value)}
            placeholder="All geographies"
            status="ACTIVE"
          />
        </Field>
        {!validationError && from && to ? (
          <p className="pb-2 text-xs text-muted-foreground">
            {inclusiveDayCount(from, to)} day(s), {formatCalendarDate(from)} to{" "}
            {formatCalendarDate(to)}
          </p>
        ) : null}
      </div>

      {validationError ? (
        <p className="text-sm text-destructive">{validationError}</p>
      ) : null}

      {!validationError ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.label} size="sm">
              <CardContent className="flex items-center gap-3">
                <card.icon className={cn("size-5", card.className)} />
                <div className="min-w-0">
                  <p className="text-2xl leading-none font-semibold">
                    {card.value}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {card.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={validationError ? [] : days}
        getRowId={(day) => day.date}
        isLoading={!validationError && isLoading}
        error={validationError ? undefined : error}
        onRetry={() => void refetch()}
        empty={{
          icon: CalendarCheck,
          title: "No calendar days",
          description: "Choose a date range to resolve the effective calendar.",
        }}
      />
    </div>
  )
}
