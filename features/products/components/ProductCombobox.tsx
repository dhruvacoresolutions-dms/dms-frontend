"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  EntityCombobox,
  type ComboboxOption,
} from "@/components/common/EntityCombobox"
import { useProducts } from "../hooks/use-products"
import { getProduct } from "../api/product.api"
import type { ProductResponse } from "../api/product.types"

type Props = {
  companyUuid: string
  value?: string | null
  onValueChange: (value: string | null, item?: ProductResponse | null) => void
  disabled?: boolean
  size?: number
  excludeIds?: string[]
  /** Trigger text shown when nothing is selected */
  placeholder?: string
};

function toOption(item: ProductResponse): ComboboxOption {
  return { id: item.productUuid, label: item.name, sub: item.code }
}

export function ProductCombobox({
  companyUuid,
  value,
  onValueChange,
  disabled,
  size = 100,
  excludeIds,
  placeholder = "Select product...",
}: Props) {
  const [debouncedQuery, setDebouncedQuery] = React.useState("")

  const listQuery = useProducts(companyUuid, {
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
    queryKey: ["companies", companyUuid, "products", "detail", value],
    queryFn: () => getProduct(companyUuid, value as string),
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
      emptyText="No products found."
      clearLabel="Clear product"
      placeholder={placeholder}
      searchPlaceholder="Search products..."
      onSearchChange={setDebouncedQuery}
    />
  )
}
