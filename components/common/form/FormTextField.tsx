"use client"

import type * as React from "react"
import { Controller, type FieldValues } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import type { BaseFieldProps } from "./types"

export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  disabled,
  className,
  type = "text",
  autoComplete = "off",
  maxLength,
}: BaseFieldProps<T> & {
  type?: string
  autoComplete?: string
  maxLength?: number
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className={className}>
          <FieldLabel>{label}</FieldLabel>
          <Input
            type={type}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
            autoComplete={autoComplete}
            maxLength={maxLength}
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
