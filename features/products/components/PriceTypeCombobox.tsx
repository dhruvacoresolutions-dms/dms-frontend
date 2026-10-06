"use client"

import * as React from "react"
import {
  EntityCombobox,
  type ComboboxOption,
} from "@/components/common/EntityCombobox"
import { usePriceTypes } from "../hooks/use-product-prices"
import type { PriceTypeResponse } from "../api/product.types"

type Props = {
  companyUuid: string
  value?: string | null
  onValueChange: (
    value: string | null,
    item?: PriceTypeResponse | null
  ) => void
  disabled?: boolean
  /** Trigger text shown when nothing is selected */
  placeholder?: string
}

export function PriceTypeCombobox({
  companyUuid,
  value,
  onValueChange,
  disabled,
  placeholder = "Select price type...",
}: Props) {
  const { data, isFetching } = usePriceTypes(companyUuid)
  const rows = React.useMemo(() => data?.content ?? [], [data?.content])

  const options = React.useMemo<ComboboxOption[]>(
    () =>
      rows.map((pt) => ({
        id: pt.code,
        label: pt.name,
        sub: pt.code,
      })),
    [rows]
  )
  const selectedOption = React.useMemo<ComboboxOption | null>(() => {
    const found = rows.find((pt) => pt.code === value)
    if (!found) return null
    return { id: found.code, label: found.name, sub: found.code }
  }, [rows, value])

  return (
    <EntityCombobox
      companyUuid={companyUuid}
      value={value}
      onValueChange={(nextId) => {
        if (!nextId) {
          onValueChange(null, null)
          return
        }
        onValueChange(
          nextId,
          rows.find((pt) => pt.code === nextId) ?? null
        )
      }}
      disabled={disabled}
      options={options}
      selectedOption={selectedOption}
      loading={isFetching}
      emptyText="No price types found."
      clearLabel="Clear price type"
      placeholder={placeholder}
      searchPlaceholder="Search price types..."
    />
  )
}
