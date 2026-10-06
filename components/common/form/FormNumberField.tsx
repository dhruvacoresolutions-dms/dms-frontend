"use client"

import type * as React from "react"
import { Controller, type FieldValues } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import type { BaseFieldProps } from "./types"

export function FormNumberField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  disabled,
  className,
  step = "any",
  min,
}: BaseFieldProps<T> & { step?: string; min?: number }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className={className}>
          <FieldLabel>{label}</FieldLabel>
          <Input
            type="number"
            step={step}
            min={min}
            value={field.value ?? ""}
            onChange={(e) =>
              field.onChange(
                e.target.value === "" ? undefined : e.target.value
              )
            }
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
