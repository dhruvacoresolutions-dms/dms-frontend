"use client"

import { Controller, type FieldValues } from "react-hook-form"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { PhoneInput } from "@/components/common/PhoneInput"
import type { BaseFieldProps } from "./types"

export function FormPhoneField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "Enter mobile number",
  disabled,
  className,
}: BaseFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className={className}>
          <FieldLabel>{label}</FieldLabel>
          <PhoneInput
            value={field.value ?? ""}
            onValueChange={(v) => field.onChange(v)}
            onBlur={field.onBlur}
            disabled={disabled}
            placeholder={placeholder}
            hasError={!!fieldState.error}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
