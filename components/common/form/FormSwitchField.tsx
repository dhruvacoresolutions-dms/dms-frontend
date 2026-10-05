"use client"

import type { ReactNode } from "react"
import { Controller, type FieldValues } from "react-hook-form"
import { Switch } from "@/components/ui/switch"
import { Field, FieldLabel } from "@/components/ui/field"
import type { BaseFieldProps } from "./types"

export function FormSwitchField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  disabled,
  className,
}: BaseFieldProps<T> & { hint?: ReactNode }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field className={className}>
          <FieldLabel>{label}</FieldLabel>
          <div className="flex items-center gap-2 pt-2">
            <Switch
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
            {hint ? (
              <span className="text-sm text-muted-foreground">{hint}</span>
            ) : null}
          </div>
        </Field>
      )}
    />
  )
}
