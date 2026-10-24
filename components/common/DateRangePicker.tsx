"use client"

import * as React from "react"
import {
  endOfYear,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfYear,
} from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange, Matcher } from "react-day-picker"

import { cn } from "@/lib/utils"
import { getDefaultMonthRange } from "@/lib/date-picker-range"
import { Button, buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/** ISO date strings (`yyyy-MM-dd`). Both ends are optional so the range can be cleared. */
export type DateRangeValue = {
  from?: string
  to?: string
}

type DateRangePickerProps = {
  id?: string
  value?: DateRangeValue
  onValueChange?: (value: DateRangeValue) => void
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  /** Disallow selecting future dates. */
  disableFuture?: boolean
  /** Disallow selecting past dates. */
  disablePast?: boolean
  /** Earliest month shown. Defaults to January 10 years ago. */
  startMonth?: Date
  /** Latest month shown. Defaults to December 10 years ahead. */
  endMonth?: Date
  /** Earliest selectable date (ISO `yyyy-MM-dd`). */
  minDate?: string
  /** Latest selectable date (ISO `yyyy-MM-dd`). */
  maxDate?: string
  /** Number of months shown side by side. Defaults to 2. */
  numberOfMonths?: number
  align?: React.ComponentProps<typeof PopoverContent>["align"]
  className?: string
  contentClassName?: string
  "aria-label"?: string
}

function toDate(iso: string | null | undefined): Date | undefined {
  if (!iso) return undefined
  const parsed = parseISO(iso)
  return isValid(parsed) ? parsed : undefined
}

export function DateRangePicker({
  id,
  value,
  onValueChange,
  placeholder = "Pick a date range",
  disabled,
  hasError,
  disableFuture,
  disablePast,
  startMonth,
  endMonth,
  minDate,
  maxDate,
  numberOfMonths = 2,
  align = "start",
  className,
  contentClassName,
  "aria-label": ariaLabel,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const today = startOfDay(new Date())
  const defaultRange = getDefaultMonthRange(today)
  const min = toDate(minDate)
  const max = toDate(maxDate)

  // Keep the visible months independent of the disabled-date rules, but always
  // include any explicit selection limits.
  const visibleStartMonth =
    startMonth ??
    (min && min < defaultRange.startMonth
      ? startOfYear(min)
      : defaultRange.startMonth)
  const visibleEndMonth =
    endMonth ??
    (max && max > defaultRange.endMonth
      ? endOfYear(max)
      : defaultRange.endMonth)

  const selected = React.useMemo<DateRange | undefined>(() => {
    const from = toDate(value?.from)
    const to = toDate(value?.to)
    return from ? { from, to } : undefined
  }, [value?.from, value?.to])

  const [draft, setDraft] = React.useState<DateRange | undefined>(selected)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    // Start every session from the committed value so a cancelled half-range
    // never leaks into the next open.
    if (next) setDraft(selected)
  }

  const disabledMatchers = React.useMemo<Matcher[]>(() => {
    const matchers: Matcher[] = []
    const today = startOfDay(new Date())
    if (disableFuture) matchers.push({ after: today })
    if (disablePast) matchers.push({ before: today })
    const min = toDate(minDate)
    const max = toDate(maxDate)
    if (min) matchers.push({ before: min })
    if (max) matchers.push({ after: max })
    return matchers
  }, [disableFuture, disablePast, minDate, maxDate])

  const handleSelect = (range: DateRange | undefined) => {
    setDraft(range)
    // Only commit a complete range so consumers never receive a half-selected
    // range that would clear their current filter.
    if (range?.from && range.to) {
      onValueChange?.({
        from: format(range.from, "yyyy-MM-dd"),
        to: format(range.to, "yyyy-MM-dd"),
      })
      setOpen(false)
    }
  }

  const handleClear = () => {
    setDraft(undefined)
    onValueChange?.({})
    setOpen(false)
  }

  const hasValue = !!selected?.from
  const displayValue = selected?.from
    ? selected.to
      ? `${format(selected.from, "dd MMM yyyy")} – ${format(selected.to, "dd MMM yyyy")}`
      : format(selected.from, "dd MMM yyyy")
    : placeholder

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={!!hasError}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-start gap-2 bg-transparent px-3 font-normal hover:border-ring/60 hover:bg-transparent aria-expanded:bg-transparent dark:bg-transparent dark:hover:bg-transparent",
          !hasValue && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">
          {displayValue}
        </span>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn(
          "w-auto max-w-[calc(100vw-2rem)] gap-0 overflow-x-auto p-0",
          contentClassName
        )}
      >
        <Calendar
          mode="range"
          defaultMonth={draft?.from ?? selected?.from}
          selected={draft}
          onSelect={handleSelect}
          numberOfMonths={numberOfMonths}
          captionLayout="dropdown"
          startMonth={visibleStartMonth}
          endMonth={visibleEndMonth}
          // Start a fresh range on the first click (instead of extending the
          // previously committed range), so users can pick both endpoints in
          // two clicks without committing a one-day range.
          resetOnSelect
          disabled={disabledMatchers.length ? disabledMatchers : undefined}
        />
        <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {draft?.from && !draft?.to
              ? "Select an end date"
              : "Select a start and end date"}
          </p>
          {hasValue || draft?.from ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
