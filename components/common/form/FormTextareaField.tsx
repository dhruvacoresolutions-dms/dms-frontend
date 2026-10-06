"use client"

import type * as React from "react"
import { Controller, type FieldValues } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import type { BaseFieldProps } from "./types"

export function FormTextareaField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  disabled,
  className,
  rows = 3,
}: BaseFieldProps<T> & { rows?: number }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className={className}>
          <FieldLabel>{label}</FieldLabel>
          <Textarea
            rows={rows}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
            placeholder={placeholder ?? getGenericTextPlaceholder(label)}
            aria-invalid={!!fieldState.error}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

function getGenericTextPlaceholder(label: React.ReactNode): string {
  if (typeof label === "string" && label.trim()) {
    const clean = label.replace(/\s*\*\s*$/, "").trim()
    return `Enter ${clean.toLowerCase()}`
  }
  return "Enter value"
}
