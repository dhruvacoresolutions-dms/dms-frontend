"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { X } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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

export type ComboboxOption = {
  id: string
  label: string
  sub?: string
}

type Props<T> = {
  companyUuid: string
  value?: string | null
  onValueChange: (value: string | null, item?: T | null) => void
  disabled?: boolean
  /** Options currently available (already filtered/searched by the caller) */
  options: ComboboxOption[]
  /** Full item behind the currently selected value (keeps the label) */
  selectedOption?: ComboboxOption | null
  /** True while options are being fetched */
  loading?: boolean
  /** Text shown when the search yields nothing */
  emptyText?: string
  /** Accessible label for the clear button */
  clearLabel?: string
  /** Trigger text shown when nothing is selected */
  placeholder?: string
  /** Called as the user types (parent debounces + refetches) */
  onSearchChange?: (query: string) => void
}

/**
 * Generic single-select combobox for backend-driven dropdowns.
 * Per-feature wrappers (ProductCategoryCombobox, …) own data fetching and
 * map their rows to `{ id, label, sub }`.
 */
export function EntityCombobox<T>({
  value,
  onValueChange,
  disabled,
  options,
  selectedOption,
  loading,
  emptyText = "No results found.",
  clearLabel = "Clear selection",
  placeholder = "Select an option",
  onSearchChange,
}: Props<T>) {
  const [inputValue, setInputValue] = React.useState("")

  React.useEffect(() => {
    onSearchChange?.(inputValue.trim())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue])

  const selected = selectedOption ?? null

  const clearSelection = () => {
    onValueChange(null)
    setInputValue("")
    onSearchChange?.("")
  }

  const stopToggle = (e: React.SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }

  return (
    <Combobox
      items={options}
      value={selected}
      disabled={disabled}
      inputValue={inputValue}
      onInputValueChange={(nextValue, details) => {
        if (details.reason === "item-press") return
        setInputValue(nextValue)
      }}
      onValueChange={(next: ComboboxOption | null) => {
        onValueChange(next ? next.id : null)
        setInputValue("")
        onSearchChange?.("")
      }}
      itemToStringLabel={(item: ComboboxOption | null) => item?.label ?? ""}
      filter={null}
    >
      <ComboboxTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between gap-2 px-3 font-normal"
        )}
      >
        <span
          className={
            selected
              ? "min-w-0 flex-1 truncate text-left"
              : "min-w-0 flex-1 truncate text-left text-muted-foreground"
          }
        >
          <ComboboxValue placeholder={placeholder} />
        </span>
        {selected && !disabled && (
          <span
            role="button"
            tabIndex={0}
            aria-label={clearLabel}
            onClick={(e) => {
              stopToggle(e)
              clearSelection()
            }}
            onMouseDown={stopToggle}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                stopToggle(e)
                clearSelection()
              }
            }}
            className="flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </span>
        )}
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput
          disabled={disabled}
          showTrigger={false}
          showSearchIcon
          className="has-[[data-slot=input-group-control]:focus-visible]:ring-0"
        />
        {loading ? (
          <div className="flex justify-center px-3 py-2 text-sm text-muted-foreground">
            Searching…
          </div>
        ) : null}
        {!loading ? <ComboboxEmpty>{emptyText}</ComboboxEmpty> : null}
        <ComboboxList>
          {(item: ComboboxOption) => (
            <ComboboxItem key={item.id} value={item}>
              <span className="flex flex-col">
                <span className="font-medium">{item.label}</span>
                {item.sub ? (
                  <span className="text-xs text-muted-foreground">
                    {item.sub}
                  </span>
                ) : null}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
