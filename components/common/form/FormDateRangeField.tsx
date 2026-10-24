"use client"

import type * as React from "react"
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form"

import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  DateRangePicker,
  type DateRangeValue,
} from "@/components/common/DateRangePicker"

type FormDateRangeFieldProps<T extends FieldValues> = {
  control: Control<T>
  /** Field that stores the range start (ISO `yyyy-MM-dd`). */
  fromName: Path<T>
  /** Field that stores the range end (ISO `yyyy-MM-dd`). */
  toName: Path<T>
  label: React.ReactNode
  placeholder?: string
  disabled?: boolean
  className?: string
  disableFuture?: boolean
  disablePast?: boolean
  /** Earliest month shown. Defaults to January 10 years ago. */
  startMonth?: Date
  /** Latest month shown. Defaults to December 10 years ahead. */
  endMonth?: Date
  /** Earliest selectable date (ISO `yyyy-MM-dd`). */
  minDate?: string
  /** Latest selectable date (ISO `yyyy-MM-dd`). */
  maxDate?: string
  numberOfMonths?: number
}

export function FormDateRangeField<T extends FieldValues>({
  control,
  fromName,
  toName,
  label,
  placeholder,
  disabled,
  className,
  disableFuture,
  disablePast,
  startMonth,
  endMonth,
  minDate,
  maxDate,
  numberOfMonths,
}: FormDateRangeFieldProps<T>) {
  const from = useController({ control, name: fromName })
  const to = useController({ control, name: toName })

  const value: DateRangeValue = {
    from: from.field.value ? String(from.field.value) : undefined,
    to: to.field.value ? String(to.field.value) : undefined,
  }

  return (
    <Field className={className}>
      <FieldLabel>{label}</FieldLabel>
      <DateRangePicker
        value={value}
        onValueChange={(range) => {
          from.field.onChange(range.from ?? "")
          to.field.onChange(range.to ?? "")
        }}
        placeholder={placeholder}
        disabled={disabled}
        hasError={!!(from.fieldState.error || to.fieldState.error)}
        disableFuture={disableFuture}
        disablePast={disablePast}
        startMonth={startMonth}
        endMonth={endMonth}
        minDate={minDate}
        maxDate={maxDate}
        numberOfMonths={numberOfMonths}
      />
      <FieldError errors={[from.fieldState.error, to.fieldState.error]} />
    </Field>
  )
}
