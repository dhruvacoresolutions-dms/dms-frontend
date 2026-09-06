"use client"

import { Combobox as ComboboxPrimitive } from "@base-ui/react"
import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { INDIAN_STATES } from "@/lib/constants/indian-states"

type StateComboboxProps = {
  value: string | null | undefined
  onValueChange: (value: string) => void
  placeholder?: string
  id?: string
  hasError?: boolean
  disabled?: boolean
}

export function StateCombobox({
  value,
  onValueChange,
  placeholder = "Select state — type to search",
  id,
  hasError,
  disabled,
}: StateComboboxProps) {
  return (
    <ComboboxPrimitive.Root
      items={[...INDIAN_STATES]}
      value={value || null}
      onValueChange={(val: string | null) => onValueChange(val ?? "")}
      itemToStringLabel={(item: string | null) => item ?? ""}
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        aria-invalid={!!hasError}
        className={hasError ? "border-destructive focus-visible:ring-destructive/20" : ""}
      />
      <ComboboxContent>
        <ComboboxEmpty>No state found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxPrimitive.Root>
  )
}

