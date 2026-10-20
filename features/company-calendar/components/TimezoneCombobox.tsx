"use client"

import * as React from "react"

import { buttonVariants } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import { cn } from "@/lib/utils"

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

const offsetCache = new Map<string, string>()

/**
 * Returns the timezone's current UTC offset in standard short form,
 * e.g. `GMT+5:30`, `GMT-4`, or `GMT` for UTC.
 */
function getGmtOffset(timeZone: string): string {
  const cached = offsetCache.get(timeZone)
  if (cached) return cached

  let label = "GMT"
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
      hour: "2-digit",
    }).formatToParts(new Date())
    const zoneName = parts.find((part) => part.type === "timeZoneName")?.value
    if (zoneName && zoneName !== "GMT+0" && zoneName !== "GMT-0") {
      label = zoneName
    }
  } catch {
    label = "GMT"
  }

  offsetCache.set(timeZone, label)
  return label
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
 * Searchable IANA timezone picker. The trigger is a labelled button; the
 * search input lives inside the dropdown. Each option shows its current
 * UTC offset, and the current value stays selectable even when the browser's
 * `Intl` list does not include it (e.g. legacy aliases).
 */
export function TimezoneCombobox({
  value,
  onValueChange,
  placeholder = "Select timezone",
  id,
  hasError,
  disabled,
}: TimezoneComboboxProps) {
  const [inputValue, setInputValue] = React.useState("")

  const timezones = React.useMemo(() => {
    const supported = getSupportedTimezones()
    if (!value || supported.includes(value)) return supported
    return [value, ...supported]
  }, [value])

  return (
    <Combobox
      items={timezones}
      value={value || null}
      disabled={disabled}
      inputValue={inputValue}
      onInputValueChange={(nextValue, details) => {
        if (details.reason === "item-press") return
        setInputValue(nextValue)
      }}
      onValueChange={(next: string | null) => {
        onValueChange(next ?? "")
        setInputValue("")
      }}
      itemToStringLabel={(item: string | null) => item ?? ""}
    >
      <ComboboxTrigger
        id={id}
        aria-invalid={!!hasError}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between gap-2 px-3 font-normal",
          hasError && "border-destructive"
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-left",
            !value && "text-muted-foreground"
          )}
        >
          <ComboboxValue placeholder={placeholder} />
        </span>
      </ComboboxTrigger>

      <ComboboxContent>
        <ComboboxInput
          placeholder="Search timezone…"
          disabled={disabled}
          showTrigger={false}
          showSearchIcon
          className="has-[[data-slot=input-group-control]:focus-visible]:ring-0"
        />
        <ComboboxEmpty>No timezone found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <span className="truncate">{item}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {getGmtOffset(item)}
                </span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
