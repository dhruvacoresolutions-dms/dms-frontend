"use client"

import * as React from "react"
import {
  EntityCombobox,
  type ComboboxOption,
} from "@/components/common/EntityCombobox"
import {
  useDebouncedValue,
  useScopedProducts,
} from "../hooks/use-scoped-products"
import type { ScopedProduct } from "../api/inventory.types"

type Props = {
  companyUuid: string
  distributorUuid: string
  /** Required by `GET /stock-summary/products`. */
  godownUuid?: string | null
  value?: string | null
  onValueChange: (
    value: string | null,
    item?: ScopedProduct | null
  ) => void
  disabled?: boolean
  placeholder?: string
  size?: number
}

function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(value)) return null
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

function toOption(item: ScopedProduct): ComboboxOption {
  const code = item.distributorProductCode || item.code
  const mrp = formatCurrency(item.mrp)
  return {
    id: item.productUuid,
    label: item.name,
    sub: [code, mrp ? `MRP ${mrp}` : null].filter(Boolean).join(" · "),
  }
}

/**
 * Product picker limited to products that can hold stock in the selected
 * godown. A godown must be chosen first (the backend requires it).
 */
export function ScopedProductCombobox({
  companyUuid,
  distributorUuid,
  godownUuid,
  value,
  onValueChange,
  disabled,
  placeholder = "Select product...",
  size = 20,
}: Props) {
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [selectedItem, setSelectedItem] = React.useState<ScopedProduct | null>(
    null
  )

  const listQuery = useScopedProducts(
    companyUuid,
    distributorUuid,
    {
      godown: godownUuid ?? undefined,
      search: debouncedSearch || undefined,
      searchBy: "ALL",
      page: 0,
      size,
    },
    { enabled: !!godownUuid }
  )

  const rows = React.useMemo(
    () => listQuery.data?.content ?? [],
    [listQuery.data?.content]
  )

  const resolvedSelected = React.useMemo(() => {
    if (!value) return null
    return (
      rows.find((row) => row.productUuid === value) ??
      (selectedItem?.productUuid === value ? selectedItem : null)
    )
  }, [rows, selectedItem, value])

  const options = React.useMemo(() => {
    const base = rows.map(toOption)
    if (!resolvedSelected) return base
    const option = toOption(resolvedSelected)
    if (base.some((item) => item.id === option.id)) return base
    return [...base, option]
  }, [rows, resolvedSelected])

  return (
    <EntityCombobox
      companyUuid={companyUuid}
      value={value}
      onValueChange={(nextId) => {
        if (!nextId) {
          setSelectedItem(null)
          onValueChange(null, null)
          return
        }
        const item = rows.find((row) => row.productUuid === nextId) ?? null
        setSelectedItem(item)
        onValueChange(nextId, item)
      }}
      disabled={disabled || !godownUuid}
      options={options}
      selectedOption={resolvedSelected ? toOption(resolvedSelected) : null}
      loading={listQuery.isFetching}
      emptyText={
        godownUuid ? "No products found." : "Select a godown first."
      }
      clearLabel="Clear product"
      placeholder={godownUuid ? placeholder : "Select a godown first"}
      searchPlaceholder="Search by name or code..."
      onSearchChange={setSearch}
    />
  )
}
