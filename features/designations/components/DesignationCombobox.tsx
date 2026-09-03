"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Combobox as ComboboxPrimitive } from "@base-ui/react"
import { useDesignations } from "../hooks/use-designations"
import { getDesignation } from "../api/designation.api"
import type { DesignationResponse } from "../api/designation.types"
import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

type Props = {
  companyUuid: string
  value?: string | null
  onValueChange: (value: string | null, designation?: DesignationResponse | null) => void
  placeholder?: string
  disabled?: boolean
}

export function DesignationCombobox({
  companyUuid,
  value,
  onValueChange,
  placeholder = "Search designation...",
  disabled,
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
    size: 20,
  })

  const searchResults = designationsQuery.data?.content ?? []

  // Fetch selected designation if value not in searchResults (to keep label)
  const selectedInResults = React.useMemo(
    () => searchResults.find((d) => (d.designationUuid ?? d.publicId) === value),
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
    if (searchResults.some((d) => (d.designationUuid ?? d.publicId) === (selectedItem.designationUuid ?? selectedItem.publicId)))
      return searchResults
    return [...searchResults, selectedItem]
  }, [searchResults, selectedItem])

  const isPending = designationsQuery.isFetching

  return (
    <ComboboxPrimitive.Root
      items={items}
      value={selectedItem}
      onValueChange={(next: DesignationResponse | null) => {
        const uuid = next ? (next.designationUuid ?? next.publicId) : null
        onValueChange(uuid, next)
        // clear input after selection to show full list next time
        setInputValue("")
        setDebouncedQuery("")
      }}
      itemToStringLabel={(item: DesignationResponse | null) => item?.name ?? ""}
      filter={null}
      onInputValueChange={(nextValue, details) => {
        // don't trigger search when selecting via item-press (value already set)
        if (details.reason === "item-press") return
        setInputValue(nextValue)
      }}
    >
      <ComboboxInput
        placeholder={placeholder}
        disabled={disabled}
        showClear={!!selectedItem}
      />
      <ComboboxContent>
        {isPending ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
        ) : null}
        <ComboboxEmpty>No designations found.</ComboboxEmpty>
        <ComboboxList>
          {(item: DesignationResponse) => (
            <ComboboxItem key={item.designationUuid ?? item.publicId} value={item}>
              <span className="flex flex-col">
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-muted-foreground">{item.code}</span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxPrimitive.Root>
  )
}
