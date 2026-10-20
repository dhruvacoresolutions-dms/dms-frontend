"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react"

import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

const FALLBACK_TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
]

function getSupportedTimezones(): string[] {
  try {
    const intl = Intl as unknown as {
      supportedValuesOf?: (key: string) => string[]
    }
    const zones = intl.supportedValuesOf?.("timeZone") ?? []
    return zones.length > 0 ? zones : FALLBACK_TIMEZONES
  } catch {
    return FALLBACK_TIMEZONES
  }
}

type TimezoneComboboxProps = {
  value?: string | null
  onValueChange: (value: string) => void
  placeholder?: string
  id?: string
  hasError?: boolean
  disabled?: boolean
}

/**
 * Searchable IANA timezone picker. Keeps the current value selectable even
 * when the browser's `Intl` list does not include it (e.g. legacy aliases).
 */
export function TimezoneCombobox({
  value,
  onValueChange,
  placeholder = "Select timezone…",
  id,
  hasError,
  disabled,
}: TimezoneComboboxProps) {
  const timezones = React.useMemo(() => {
    const supported = getSupportedTimezones()
    if (!value || supported.includes(value)) return supported
    return [value, ...supported]
  }, [value])

  return (
    <ComboboxPrimitive.Root
      items={timezones}
      value={value || null}
      autoHighlight={"always" as unknown as boolean}
      onValueChange={(next: string | null) => onValueChange(next ?? "")}
      itemToStringLabel={(item: string | null) => item ?? ""}
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        aria-invalid={!!hasError}
        className={hasError ? "border-destructive" : ""}
      />
      <ComboboxContent>
        <ComboboxEmpty>No timezone found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item.replaceAll("_", " ")}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxPrimitive.Root>
  )
}
