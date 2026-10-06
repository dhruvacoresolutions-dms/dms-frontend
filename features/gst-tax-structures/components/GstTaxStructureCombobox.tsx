"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  EntityCombobox,
  type ComboboxOption,
} from "@/components/common/EntityCombobox"
import { useGstTaxStructures } from "../hooks/use-gst-tax-structures"
import { getGstTaxStructure } from "../api/gst-tax-structures.api"
import type { GstTaxStructureResponse } from "../api/gst-tax-structures.types"

type Props = {
  companyUuid: string
  value?: string | null
  onValueChange: (value: string | null, item?: GstTaxStructureResponse | null) => void
  disabled?: boolean
  size?: number
  excludeIds?: string[]
  /** Trigger text shown when nothing is selected */
  placeholder?: string
};

function toOption(item: GstTaxStructureResponse): ComboboxOption {
  return { id: item.taxStructureUuid, label: item.taxCode, sub: item.taxType }
}

export function GstTaxStructureCombobox({
  companyUuid,
  value,
  onValueChange,
  disabled,
  size = 100,
  excludeIds,
  placeholder = "Select tax structure...",
}: Props) {
  const [debouncedQuery, setDebouncedQuery] = React.useState("")

  const listQuery = useGstTaxStructures(companyUuid, {
    query: debouncedQuery || undefined,
    page: 0,
    size,
  })

  const rawResults = React.useMemo(() => listQuery.data?.content ?? [], [listQuery.data?.content])
  const searchResults = React.useMemo(() => {
    if (!excludeIds || excludeIds.length === 0) return rawResults
    const excluded = new Set(excludeIds)
    return rawResults.filter((item) => !excluded.has(toOption(item).id))
  }, [rawResults, excludeIds])

  const selectedInResults = React.useMemo(
    () => searchResults.find((item) => toOption(item).id === value),
    [searchResults, value]
  )

  const { data: fetchedSelected } = useQuery({
    queryKey: ["companies", companyUuid, "gst-tax-structures", "detail", value],
    queryFn: () => getGstTaxStructure(companyUuid, value as string),
    enabled: !!value && !selectedInResults && !!companyUuid,
  })

  const selectedItem = React.useMemo(() => {
    if (!value) return null
    if (selectedInResults) return selectedInResults
    if (fetchedSelected) return fetchedSelected
    return null
  }, [value, selectedInResults, fetchedSelected])

  const options = React.useMemo(() => {
    const base = searchResults.map(toOption)
    if (!selectedItem) return base
    const selectedOption = toOption(selectedItem)
    if (base.some((o) => o.id === selectedOption.id)) return base
    return [...base, selectedOption]
  }, [searchResults, selectedItem])

  const selectedOption = selectedItem ? toOption(selectedItem) : null

  return (
    <EntityCombobox
      companyUuid={companyUuid}
      value={value}
      onValueChange={(nextId) => {
        if (!nextId) {
          onValueChange(null, null)
          return
        }
        const item =
          searchResults.find((row) => toOption(row).id === nextId) ??
          (selectedItem && toOption(selectedItem).id === nextId
            ? selectedItem
            : null)
        onValueChange(nextId, item)
      }}
      disabled={disabled}
      options={options}
      selectedOption={selectedOption}
      loading={listQuery.isFetching}
      emptyText="No tax structures found."
      clearLabel="Clear tax structure"
      placeholder={placeholder}
      searchPlaceholder="Search tax structures..."
      onSearchChange={setDebouncedQuery}
    />
  )
}
