"use client"

import * as React from "react"
import { format, isValid, parseISO, startOfDay } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { getDefaultMonthRange } from "@/lib/date-picker-range"
import { buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type DatePickerProps = {
  id?: string
  /** ISO date string (yyyy-MM-dd) */
  value?: string | null
  onValueChange?: (iso: string | undefined) => void
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  /** Disallow selecting future dates */
  disableFuture?: boolean
  /** Disallow selecting past dates */
  disablePast?: boolean
  /** Earliest month shown. Defaults to January 10 years ago. */
  startMonth?: Date
  /** Latest month shown. Defaults to December 10 years ahead. */
  endMonth?: Date
  className?: string
}

function toDate(iso: string | null | undefined): Date | undefined {
  if (!iso) return undefined
  const parsed = parseISO(iso)
  return isValid(parsed) ? parsed : undefined
}

export function DatePicker({
  id,
  value,
  onValueChange,
  placeholder = "Pick a date",
  disabled,
  hasError,
  disableFuture,
  disablePast,
  startMonth,
  endMonth,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = toDate(value)
  const today = startOfDay(new Date())
  const defaultRange = getDefaultMonthRange(today)

  // Month bounds are independent of the disabled-date rules. Callers that need
  // a wider range (e.g. date of birth) pass startMonth/endMonth explicitly.
  const visibleStartMonth = startMonth ?? defaultRange.startMonth
  const visibleEndMonth = endMonth ?? defaultRange.endMonth

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        aria-invalid={!!hasError}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-start gap-2 bg-transparent px-3 font-normal hover:border-ring/60 hover:bg-transparent aria-expanded:bg-transparent dark:bg-transparent dark:hover:bg-transparent",
          !selected && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">
          {selected ? format(selected, "dd MMM yyyy") : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onValueChange?.(date ? format(date, "yyyy-MM-dd") : undefined)
            setOpen(false)
          }}
          captionLayout="dropdown"
          startMonth={visibleStartMonth}
          endMonth={visibleEndMonth}
          disabled={
            disableFuture
              ? { after: today }
              : disablePast
                ? { before: today }
                : undefined
          }
        />
      </PopoverContent>
    </Popover>
  )
}
