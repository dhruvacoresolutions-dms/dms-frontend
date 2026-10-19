"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  EntityCombobox,
  type ComboboxOption,
} from "@/components/common/EntityCombobox"
import { useDistributors } from "../hooks/use-distributors"
import { getDistributor } from "../api/distributor.api"
import type { DistributorResponse } from "../api/distributor.types"

type Props = {
  companyUuid: string
  value?: string | null
  onValueChange: (
    value: string | null,
    item?: DistributorResponse | null
  ) => void
  disabled?: boolean
  size?: number
  /** Distributors to hide (e.g. the one being edited). */
  excludeIds?: string[]
  placeholder?: string
}

function toOption(item: DistributorResponse): ComboboxOption {
  return {
    id: item.distributorUuid,
    label: item.distributorName,
    sub: item.distributorCode,
  }
}

/**
 * Parent-distributor picker. Only active distributors are selectable — the
 * backend rejects a parent that is not active (`DistributorService`).
 */
export function DistributorCombobox({
  companyUuid,
  value,
  onValueChange,
  disabled,
  size = 100,
  excludeIds,
  placeholder = "Select distributor...",
}: Props) {
  const [debouncedQuery, setDebouncedQuery] = React.useState("")

  const listQuery = useDistributors(companyUuid, {
    search: debouncedQuery || undefined,
    status: "ACTIVE",
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
    queryKey: ["companies", companyUuid, "distributors", "detail", value],
    queryFn: () => getDistributor(companyUuid, value as string),
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
      emptyText="No distributors found."
      clearLabel="Clear distributor"
      placeholder={placeholder}
      searchPlaceholder="Search distributors..."
      onSearchChange={setDebouncedQuery}
    />
  )
}
