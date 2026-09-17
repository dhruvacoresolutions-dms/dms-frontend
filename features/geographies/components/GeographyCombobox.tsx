"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { X } from "lucide-react"
import { useGeographies } from "../hooks/use-geographies"
import { getGeography } from "../api/geography.api"
import type { GeographyResponse } from "../api/geography.types"
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
    geography?: GeographyResponse | null
  ) => void
  placeholder?: string
  disabled?: boolean
  /** Page size for the options query */
  size?: number
  /** Geography uuids to hide from options (e.g. already assigned) */
  excludeUuids?: string[]
}

export function GeographyCombobox({
  companyUuid,
  value,
  onValueChange,
  placeholder = "Search geography...",
  disabled,
  size = 100,
  excludeUuids,
}: Props) {
  const [inputValue, setInputValue] = React.useState("")

  // debounce input -> query param
  const [debouncedQuery, setDebouncedQuery] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(inputValue.trim()), 300)
    return () => clearTimeout(t)
  }, [inputValue])

  const geographiesQuery = useGeographies(companyUuid, {
    query: debouncedQuery || undefined,
    page: 0,
    size,
  })

  const rawResults = React.useMemo(
    () => geographiesQuery.data?.content ?? [],
    [geographiesQuery.data]
  )
  const searchResults = React.useMemo(() => {
    if (!excludeUuids || excludeUuids.length === 0) return rawResults
    const excluded = new Set(excludeUuids)
    return rawResults.filter((g) => !excluded.has(g.geographyUuid))
  }, [rawResults, excludeUuids])

  // Fetch selected geography if value not in searchResults (to keep label)
  const selectedInResults = React.useMemo(
    () => searchResults.find((g) => g.geographyUuid === value),
    [searchResults, value]
  )

  const { data: fetchedSelected } = useQuery({
    queryKey: ["companies", companyUuid, "geographies", "detail", value],
    queryFn: () => getGeography(companyUuid, value as string),
    enabled: !!value && !selectedInResults && !!companyUuid,
  })

  const selectedItem: GeographyResponse | null = React.useMemo(() => {
    if (!value) return null
    if (selectedInResults) return selectedInResults
    if (fetchedSelected) return fetchedSelected
    return null
  }, [value, selectedInResults, fetchedSelected])

  const items = React.useMemo(() => {
    if (!selectedItem) return searchResults
    if (searchResults.some((g) => g.geographyUuid === selectedItem.geographyUuid))
      return searchResults
    return [...searchResults, selectedItem]
  }, [searchResults, selectedItem])

  const isFetching = geographiesQuery.isFetching

  const clearSelection = () => {
    onValueChange(null)
    setInputValue("")
    setDebouncedQuery("")
  }

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
        if (details.reason === "item-press") return
        setInputValue(nextValue)
      }}
      onValueChange={(next: GeographyResponse | null) => {
        const uuid = next ? next.geographyUuid : null
        onValueChange(uuid, next)
        setInputValue("")
        setDebouncedQuery("")
      }}
      itemToStringLabel={(item: GeographyResponse | null) => item?.name ?? ""}
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
            aria-label="Clear geography"
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
          placeholder="Search geographies..."
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
          <ComboboxEmpty>No geographies found.</ComboboxEmpty>
        ) : null}
        <ComboboxList>
          {(item: GeographyResponse) => (
            <ComboboxItem key={item.geographyUuid} value={item}>
              <span className="flex flex-col">
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.code} • {item.type}
                </span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
