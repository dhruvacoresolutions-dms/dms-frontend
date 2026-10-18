"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  EntityCombobox,
  type ComboboxOption,
} from "@/components/common/EntityCombobox"
import { useGstTaxCodes } from "../hooks/use-gst-tax-codes"
import { getGstTaxCodeVersions } from "../api/gst-tax-code.api"
import { gstTaxCodeKeys } from "../api/gst-tax-code-keys"
import type { GstTaxCodeResponse } from "../api/gst-tax-code.types"

type Props = {
  companyUuid: string
  /** The selected `taxCode` value (tax codes are referenced by code, not uuid). */
  value?: string | null
  onValueChange: (
    value: string | null,
    item?: GstTaxCodeResponse | null
  ) => void
  disabled?: boolean
  size?: number
  excludeIds?: string[]
  placeholder?: string
}

function rateSub(item: GstTaxCodeResponse): string | undefined {
  if (typeof item.totalRate === "number") return `${item.totalRate}%`
  if (typeof item.igstRate === "number") return `${item.igstRate}% IGST`
  return undefined
}

function toOption(item: GstTaxCodeResponse): ComboboxOption {
  return { id: item.taxCode, label: item.taxCode, sub: rateSub(item) }
}

export function GstTaxCodeCombobox({
  companyUuid,
  value,
  onValueChange,
  disabled,
  size = 100,
  excludeIds,
  placeholder = "Select tax code...",
}: Props) {
  const [debouncedQuery, setDebouncedQuery] = React.useState("")

  const listQuery = useGstTaxCodes(
    companyUuid,
    { query: debouncedQuery || undefined, status: "ACTIVE", page: 0, size },
    { enabled: !!companyUuid }
  )

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

  // Fallback: resolve the newest version when the selected code is not in the
  // current page (e.g. editing an existing mapping).
  const { data: fetchedVersions } = useQuery({
    queryKey: gstTaxCodeKeys.versions(companyUuid, value ?? ""),
    queryFn: () => getGstTaxCodeVersions(companyUuid, value as string),
    enabled: !!value && !selectedInResults && !!companyUuid,
  })

  const selectedItem = React.useMemo(() => {
    if (!value) return null
    if (selectedInResults) return selectedInResults
    return fetchedVersions?.[0] ?? null
  }, [value, selectedInResults, fetchedVersions])

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
      emptyText="No tax codes found."
      clearLabel="Clear tax code"
      placeholder={placeholder}
      searchPlaceholder="Search tax codes..."
      onSearchChange={setDebouncedQuery}
    />
  )
}
