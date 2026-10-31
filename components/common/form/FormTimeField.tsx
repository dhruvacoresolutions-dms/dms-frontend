"use client"

import { Controller, type FieldValues } from "react-hook-form"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { TimePicker } from "@/components/common/TimePicker"
import type { BaseFieldProps } from "./types"

export function FormTimeField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "HH:MM",
  disabled,
  className,
  allowClear = false,
  clearLabel = "Clear time",
}: BaseFieldProps<T> & {
  allowClear?: boolean
  clearLabel?: string
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className={className}>
          <FieldLabel>{label}</FieldLabel>
          <div className="flex items-center gap-1">
            <TimePicker
              value={field.value ? String(field.value) : null}
              onValueChange={(iso) => field.onChange(iso ?? "")}
              placeholder={placeholder}
              disabled={disabled}
              hasError={!!fieldState.error}
              className="flex-1"
            />
            {allowClear && field.value ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={clearLabel}
                title={clearLabel}
                disabled={disabled}
                onClick={() => field.onChange("")}
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}