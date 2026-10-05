"use client"

import * as React from "react"
import { Controller, type FieldValues } from "react-hook-form"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import type { BaseFieldProps, BackendComboboxProps } from "./types"

export function FormComboboxField<T extends FieldValues>({
  control,
  name,
  label,
  companyUuid,
  disabled,
  className,
  Combobox,
  comboboxProps,
}: BaseFieldProps<T> & {
  companyUuid: string
  Combobox: React.ComponentType<BackendComboboxProps>
  comboboxProps?: Record<string, unknown>
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className={className}>
          <FieldLabel>{label}</FieldLabel>
          <Combobox
            companyUuid={companyUuid}
            value={field.value ? String(field.value) : null}
            disabled={disabled}
            onValueChange={(v) => field.onChange(v ?? "")}
            {...comboboxProps}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
