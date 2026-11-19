"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStockTypes } from "../hooks/use-stock-types"
import type { StockTypeCode, StockTypeOption } from "../api/inventory.types"

const FALLBACK_TYPES: StockTypeOption[] = [
  { code: "S", name: "SALEABLE", displayName: "Saleable" },
  { code: "O", name: "OFFER", displayName: "Offer" },
  { code: "U", name: "UNSALEABLE", displayName: "Un-Saleable" },
  { code: "P", name: "SAMPLE", displayName: "Sample" },
  { code: "D", name: "DAMAGED_SAMPLE", displayName: "Damaged-Sample" },
]

/**
 * Stock type lookup driven by `GET /stock-types`, with the five v63 types as
 * a fallback so forms never render empty before the lookup settles.
 */
export function useStockTypeOptions(
  companyUuid: string,
  distributorUuid: string
) {
  const query = useStockTypes(companyUuid, distributorUuid)
  const types = query.data?.length ? query.data : FALLBACK_TYPES

  const options = React.useMemo(
    () =>
      types.map((type) => ({
        value: type.code,
        label: type.displayName,
      })),
    [types]
  )

  const labelFor = React.useCallback(
    (code?: string | null) =>
      types.find((type) => type.code === code)?.displayName ?? code ?? "—",
    [types]
  )

  return { types, options, labelFor, isLoading: query.isLoading }
}

type StockTypeSelectProps = {
  companyUuid: string
  distributorUuid: string
  value?: string | null
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  "aria-label"?: string
}

export function StockTypeSelect({
  companyUuid,
  distributorUuid,
  value,
  onValueChange,
  placeholder = "Select stock type",
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
}: StockTypeSelectProps) {
  const { options } = useStockTypeOptions(companyUuid, distributorUuid)

  return (
    <Select
      items={options}
      value={value ?? ""}
      onValueChange={(next: string | null) => next && onValueChange(next)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className={className}
        aria-invalid={!value || undefined}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Compact stock-type chip used in tables and detail views. */
export function StockTypeLabel({
  code,
  label,
}: {
  code?: string | null
  label?: string | null
}) {
  if (!code && !label) return <span className="text-muted-foreground">—</span>
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="font-mono text-xs text-muted-foreground">{code}</span>
      <span>{label ?? code}</span>
    </span>
  )
}

export function stockTypeCode(value: string): StockTypeCode {
  return value as StockTypeCode
}
