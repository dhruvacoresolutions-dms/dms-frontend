"use client"

import { useMemo, useState } from "react"
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns"
import {
  AlertCircle,
  CalendarCheck,
  CalendarMinus,
  CalendarOff,
  CalendarX,
  RotateCcw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/common/DatePicker"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { GeographyCombobox } from "@/features/geographies/components/GeographyCombobox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
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
  const now = new Date()
  const defaultFrom = format(startOfMonth(now), "yyyy-MM-dd")
  const defaultTo = format(endOfMonth(now), "yyyy-MM-dd")
  const todayIso = format(now, "yyyy-MM-dd")

  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [geographyUuid, setGeographyUuid] = useState<string | null>(null)

  const isDefaultRange = from === defaultFrom && to === defaultTo

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
              <StatusBadge status={period.status} />
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
      iconClassName:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
    },
    {
      label: "Holidays",
      value: summary.holidays,
      icon: CalendarX,
      iconClassName:
        "bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300",
    },
    {
      label: "Weekly offs",
      value: summary.weeklyOffs,
      icon: CalendarOff,
      iconClassName:
        "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
    },
    {
      label: "Alternate Saturdays",
      value: summary.alternateSaturdays,
      icon: CalendarMinus,
      iconClassName:
        "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
        <div className="sm:w-44">
          <label htmlFor="effective-from" className="sr-only">
            From date
          </label>
          <DatePicker
            id="effective-from"
            value={from}
            onValueChange={(value) => setFrom(value ?? "")}
            hasError={!!validationError}
            placeholder="From date"
          />
        </div>
        <div className="sm:w-44">
          <label htmlFor="effective-to" className="sr-only">
            To date
          </label>
          <DatePicker
            id="effective-to"
            value={to}
            onValueChange={(value) => setTo(value ?? "")}
            hasError={!!validationError}
            placeholder="To date"
          />
        </div>
        <div className="col-span-2 sm:w-64">
          <GeographyCombobox
            companyUuid={companyUuid}
            value={geographyUuid}
            onValueChange={(value) => setGeographyUuid(value)}
            placeholder="All geographies"
            status="ACTIVE"
          />
        </div>
        {!isDefaultRange ? (
          <Button
            variant="ghost"
            size="sm"
            className="justify-self-start"
            onClick={() => {
              setFrom(defaultFrom)
              setTo(defaultTo)
            }}
          >
            <RotateCcw className="mr-2 size-4" /> This month
          </Button>
        ) : null}
        {!validationError && from && to ? (
          <p className="col-span-2 text-xs text-muted-foreground sm:ml-auto">
            {inclusiveDayCount(from, to)} day(s), {formatCalendarDate(from)} to{" "}
            {formatCalendarDate(to)}
          </p>
        ) : null}
      </div>

      {validationError ? (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {validationError}
        </p>
      ) : null}

      {!validationError ? (
        <div
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          aria-live="polite"
        >
          {summaryCards.map((card) => (
            <Card key={card.label} size="sm">
              <CardContent className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl leading-none font-semibold tabular-nums">
                    {card.value}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-md",
                    card.iconClassName
                  )}
                >
                  <card.icon className="size-4" aria-hidden="true" />
                </span>
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
        rowClassName={(day) =>
          day.date === todayIso ? "bg-muted/40" : undefined
        }
        empty={{
          icon: CalendarCheck,
          title: "No calendar days",
          description: "Choose a date range to resolve the effective calendar.",
        }}
      />
    </div>
  )
}
