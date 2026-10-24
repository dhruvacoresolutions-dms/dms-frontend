"use client"

import { Controller, type FieldValues } from "react-hook-form"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { DatePicker } from "@/components/common/DatePicker"
import type { BaseFieldProps } from "./types"

export function FormDateField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "Pick a date",
  disabled,
  className,
  disableFuture,
  disablePast,
  startMonth,
  endMonth,
}: BaseFieldProps<T> & {
  disableFuture?: boolean
  disablePast?: boolean
  startMonth?: Date
  endMonth?: Date
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className={className}>
          <FieldLabel>{label}</FieldLabel>
          <DatePicker
            value={field.value ? String(field.value) : null}
            onValueChange={(iso) => field.onChange(iso ?? "")}
            placeholder={placeholder}
            disabled={disabled}
            hasError={!!fieldState.error}
            disableFuture={disableFuture}
            disablePast={disablePast}
            startMonth={startMonth}
            endMonth={endMonth}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
