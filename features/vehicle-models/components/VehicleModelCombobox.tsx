"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  EntityCombobox,
  type ComboboxOption,
} from "@/components/common/EntityCombobox"
import { useVehicleModels } from "../hooks/use-vehicle-models"
import { getVehicleModel } from "../api/vehicle-model.api"
import type { VehicleModelResponse } from "../api/vehicle-model.types"

type Props = {
  companyUuid: string
  value?: string | null
  onValueChange: (value: string | null, item?: VehicleModelResponse | null) => void
  disabled?: boolean
  size?: number
  excludeIds?: string[]
  /** Restrict models to a make */
  makeUuid?: string
  placeholder?: string
};

function toOption(item: VehicleModelResponse): ComboboxOption {
  return { id: item.modelUuid, label: item.name, sub: item.code }
}

export function VehicleModelCombobox({
  companyUuid,
  value,
  onValueChange,
  disabled,
  size = 100,
  excludeIds,
  makeUuid,
  placeholder = "Select model...",
}: Props) {
  const [debouncedQuery, setDebouncedQuery] = React.useState("")

  const listQuery = useVehicleModels(companyUuid, {
    query: debouncedQuery || undefined,
    makeUuid,
    page: 0,
    size,
  })

  const rawResults = listQuery.data?.content ?? []
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
    queryKey: ["companies", companyUuid, "vehicle-models", "detail", value],
    queryFn: () => getVehicleModel(companyUuid, value as string),
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
      emptyText="No models found."
      clearLabel="Clear model"
      placeholder={placeholder}
      searchPlaceholder="Search models..."
      onSearchChange={setDebouncedQuery}
    />
  )
}
