"use client"

import type * as React from "react"
import type { Control, FieldValues, Path } from "react-hook-form"

export type BaseFieldProps<T extends FieldValues> = {
  control: Control<T>
  name: Path<T>
  label: React.ReactNode
  /** Generic placeholder text — never an example value (e.g. "Enter name", "Select status"). */
  placeholder?: string
  disabled?: boolean
  className?: string
}

/** Props every `*Combobox` component satisfies (second callback arg varies). */
export type BackendComboboxProps = {
  companyUuid: string
  value?: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onValueChange: (value: string | null, item?: any) => void
  disabled?: boolean
}
