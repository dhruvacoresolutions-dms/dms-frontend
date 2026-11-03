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
  sanitize,
  format,
  inputMode,
}: BaseFieldProps<T> & {
  type?: string
  autoComplete?: string
  maxLength?: number
  /**
   * Normalizes the raw input before it is stored (for example, stripping
   * separators or non-digits). The stored value stays canonical.
   */
  sanitize?: (value: string) => string
  /**
   * Renders the stored value for display without changing what is stored
   * (for example, `1234-5678-9012` for a raw Aadhaar number).
   */
  format?: (value: string) => string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const stored = field.value == null ? "" : String(field.value)

        return (
          <Field className={className}>
            <FieldLabel>{label}</FieldLabel>
            <Input
              type={type}
              value={format ? format(stored) : stored}
              onChange={(event) => {
                const next = event.target.value
                field.onChange(sanitize ? sanitize(next) : next)
              }}
              onBlur={field.onBlur}
              disabled={disabled}
              autoComplete={autoComplete}
              maxLength={maxLength}
              inputMode={inputMode}
              placeholder={placeholder ?? getGenericTextPlaceholder(label)}
              aria-invalid={!!fieldState.error}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )
      }}
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
