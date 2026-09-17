"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { X } from "lucide-react"
import { useDesignations } from "../hooks/use-designations"
import { getDesignation } from "../api/designation.api"
import type { DesignationResponse } from "../api/designation.types"
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

type Props = {
  companyUuid: string
  value?: string | null
  onValueChange: (
    value: string | null,
    designation?: DesignationResponse | null
  ) => void
  placeholder?: string
  disabled?: boolean
  /** Page size for the options query (use 100 for filter dropdowns) */
  size?: number
}

export function DesignationCombobox({
  companyUuid,
  value,
  onValueChange,
  placeholder = "Search designation...",
  disabled,
  size = 100,
}: Props) {
  const [inputValue, setInputValue] = React.useState("")

  // debounce input -> query param
  const [debouncedQuery, setDebouncedQuery] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(inputValue.trim()), 300)
    return () => clearTimeout(t)
  }, [inputValue])

  const designationsQuery = useDesignations(companyUuid, {
    query: debouncedQuery || undefined,
    page: 0,
    size,
  })

  const searchResults = React.useMemo(
    () => designationsQuery.data?.content ?? [],
    [designationsQuery.data]
  )

  // Fetch selected designation if value not in searchResults (to keep label)
  const selectedInResults = React.useMemo(
    () =>
      searchResults.find((d) => (d.designationUuid ?? d.publicId) === value),
    [searchResults, value]
  )

  const { data: fetchedSelected } = useQuery({
    queryKey: ["companies", companyUuid, "designations", "detail", value],
    queryFn: () => getDesignation(companyUuid, value as string),
    enabled: !!value && !selectedInResults && !!companyUuid,
  })

  const selectedItem: DesignationResponse | null = React.useMemo(() => {
    if (!value) return null
    if (selectedInResults) return selectedInResults
    if (fetchedSelected) return fetchedSelected
    return null
  }, [value, selectedInResults, fetchedSelected])

  const items = React.useMemo(() => {
    if (!selectedItem) return searchResults
    if (
      searchResults.some(
        (d) =>
          (d.designationUuid ?? d.publicId) ===
          (selectedItem.designationUuid ?? selectedItem.publicId)
      )
    )
      return searchResults
    return [...searchResults, selectedItem]
  }, [searchResults, selectedItem])

  // "Searching…" only while the API call is in flight; the empty message
  // additionally stays hidden during the debounce so it never flashes mid-typing.
  const isFetching = designationsQuery.isFetching

  const clearSelection = () => {
    onValueChange(null)
    setInputValue("")
    setDebouncedQuery("")
  }

  // Clear lives inside the trigger (a span, not a nested button) and
  // stops every pointer/keyboard event so the popup never toggles.
  const stopToggle = (e: React.SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }

  return (
    <Combobox
      items={items}
      value={selectedItem}
      disabled={disabled}
      inputValue={inputValue}
      onInputValueChange={(nextValue, details) => {
        // don't touch the search when selecting via item-press (value already set)
        if (details.reason === "item-press") return
        setInputValue(nextValue)
      }}
      onValueChange={(next: DesignationResponse | null) => {
        const uuid = next ? (next.designationUuid ?? next.publicId) : null
        onValueChange(uuid, next)
        // clear search after selection to show full list next time
        setInputValue("")
        setDebouncedQuery("")
      }}
      itemToStringLabel={(item: DesignationResponse | null) => item?.name ?? ""}
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
            selectedItem
              ? "min-w-0 flex-1 truncate text-left"
              : "min-w-0 flex-1 truncate text-left text-muted-foreground"
          }
        >
          <ComboboxValue placeholder={placeholder} />
        </span>
        {selectedItem && !disabled && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear designation"
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
          placeholder="Search designations..."
          disabled={disabled}
          showTrigger={false}
          showSearchIcon
          className="has-[[data-slot=input-group-control]:focus-visible]:ring-0"
        />
        {isFetching ? (
          <div className="flex justify-center px-3 py-2 text-sm text-muted-foreground">
            Searching…
          </div>
        ) : null}
        {!isFetching ? (
          <ComboboxEmpty>No designations found.</ComboboxEmpty>
        ) : null}
        <ComboboxList>
          {(item: DesignationResponse) => (
            <ComboboxItem
              key={item.designationUuid ?? item.publicId}
              value={item}
            >
              <span className="flex flex-col">
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.code}
                </span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
