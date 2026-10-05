"use client"

import { Controller, type FieldValues } from "react-hook-form"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import type { BaseFieldProps } from "./types"

export function FormCheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  className,
}: BaseFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className={className}>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={field.value === true}
              disabled={disabled}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              aria-invalid={!!fieldState.error}
            />
            <FieldLabel>{label}</FieldLabel>
          </div>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
