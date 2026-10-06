"use client"

import type * as React from "react"
import { Controller, type FieldValues } from "react-hook-form"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import type { BaseFieldProps } from "./types"

export function FormPercentageField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  disabled,
  className,
  step = "any",
  min = 0,
  suffix = "%",
}: BaseFieldProps<T> & {
  step?: string
  min?: number
  /** Trailing adornment, defaults to "%" */
  suffix?: React.ReactNode
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className={className}>
          <FieldLabel>{label}</FieldLabel>
          <InputGroup>
            <InputGroupInput
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
            <InputGroupAddon align="inline-end">
              <InputGroupText>{suffix}</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
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
