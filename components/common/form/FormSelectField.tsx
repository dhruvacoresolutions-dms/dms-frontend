"use client"

import type * as React from "react"
import { Controller, type FieldValues } from "react-hook-form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import type { BaseFieldProps } from "./types"

export function FormSelectField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  disabled,
  className,
  options,
}: BaseFieldProps<T> & {
  options: readonly { value: string; label: string }[]
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className={className}>
          <FieldLabel>{label}</FieldLabel>
          <Select
            value={field.value ?? ""}
            onValueChange={(v: string | null) => {
              if (v) field.onChange(v)
            }}
            disabled={disabled}
          >
            <SelectTrigger aria-invalid={!!fieldState.error}>
              <SelectValue
                placeholder={placeholder ?? getGenericSelectPlaceholder(label)}
              />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

function getGenericSelectPlaceholder(label: React.ReactNode): string {
  if (typeof label === "string" && label.trim()) {
    const clean = label.replace(/\s*\*\s*$/, "").trim()
    return `Select ${clean.toLowerCase()}`
  }
  return "Select an option"
}
