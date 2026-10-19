"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { X } from "lucide-react"
import { useGeographies } from "../hooks/use-geographies"
import { getGeography } from "../api/geography.api"
import type {
  GeographyResponse,
  GeographyStatus,
  GeographyType,
} from "../api/geography.types"
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
  /**
   * Restrict selectable geographies to these types. A single type is filtered
   * server-side; multiple types are filtered client-side.
   */
  types?: GeographyType[]
  /** Restrict selectable geographies to a status (filtered server-side). */
  status?: GeographyStatus
}

export function GeographyCombobox({
  companyUuid,
  value,
  onValueChange,
  placeholder = "Select geography...",
  disabled,
  size = 100,
  excludeUuids,
  types,
  status,
}: Props) {
  const [inputValue, setInputValue] = React.useState("")

  // debounce input -> query param
  const [debouncedQuery, setDebouncedQuery] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(inputValue.trim()), 300)
    return () => clearTimeout(t)
  }, [inputValue])

  // A single allowed type is filtered by the API; several types are filtered
  // client-side because the endpoint accepts one `type` at a time.
  const serverType = types && types.length === 1 ? types[0] : undefined
  const geographiesQuery = useGeographies(companyUuid, {
    query: debouncedQuery || undefined,
    type: serverType,
    status,
    page: 0,
    size,
  })

  const rawResults = React.useMemo(
    () => geographiesQuery.data?.content ?? [],
    [geographiesQuery.data?.content]
  )
  const typeResults = React.useMemo(() => {
    if (!types || types.length <= 1) return rawResults
    const allowed = new Set<GeographyType>(types)
    return rawResults.filter((g) => allowed.has(g.type))
  }, [rawResults, types])
  const searchResults = React.useMemo(() => {
    if (!excludeUuids || excludeUuids.length === 0) return typeResults
    const excluded = new Set(excludeUuids)
    return typeResults.filter((g) => !excluded.has(g.geographyUuid))
  }, [typeResults, excludeUuids])

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
    if (
      searchResults.some((g) => g.geographyUuid === selectedItem.geographyUuid)
    )
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
