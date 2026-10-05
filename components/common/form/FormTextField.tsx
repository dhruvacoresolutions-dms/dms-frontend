"use client"

import { Controller, type FieldValues } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import type { BaseFieldProps } from "./types"

export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  className,
  type = "text",
  autoComplete = "off",
}: BaseFieldProps<T> & { type?: string; autoComplete?: string }) {
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
            aria-invalid={!!fieldState.error}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
