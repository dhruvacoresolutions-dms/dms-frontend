"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  EntityCombobox,
  type ComboboxOption,
} from "@/components/common/EntityCombobox"
import { useSuppliers } from "../hooks/use-suppliers"
import { getSupplier } from "../api/supplier.api"
import type { SupplierResponse } from "../api/supplier.types"

type Props = {
  companyUuid: string
  value?: string | null
  onValueChange: (value: string | null, item?: SupplierResponse | null) => void
  disabled?: boolean
  size?: number
  excludeIds?: string[]
  placeholder?: string
}

function toOption(item: SupplierResponse): ComboboxOption {
  return { id: item.supplierUuid, label: item.supplierName, sub: item.supplierCode }
}

export function SupplierCombobox({
  companyUuid,
  value,
  onValueChange,
  disabled,
  size = 100,
  excludeIds,
  placeholder = "Select supplier...",
}: Props) {
  const [debouncedQuery, setDebouncedQuery] = React.useState("")

  const listQuery = useSuppliers(companyUuid, {
    search: debouncedQuery || undefined,
    page: 0,
    size,
  })

  const rawResults = React.useMemo(
    () => listQuery.data?.content ?? [],
    [listQuery.data?.content]
  )
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
    queryKey: ["companies", companyUuid, "suppliers", "detail", value],
    queryFn: () => getSupplier(companyUuid, value as string),
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
      emptyText="No suppliers found."
      clearLabel="Clear supplier"
      placeholder={placeholder}
      searchPlaceholder="Search suppliers..."
      onSearchChange={setDebouncedQuery}
    />
  )
}
