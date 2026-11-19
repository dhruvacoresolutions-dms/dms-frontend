"use client"

import * as React from "react"
import {
  EntityCombobox,
  type ComboboxOption,
} from "@/components/common/EntityCombobox"
import { useGodowns } from "../hooks/use-godowns"
import { useGodown } from "../hooks/use-godown"
import type { GodownResponse } from "../api/inventory.types"

type Props = {
  companyUuid: string
  distributorUuid: string
  value?: string | null
  onValueChange: (
    value: string | null,
    item?: GodownResponse | null
  ) => void
  /** Forms should only offer ACTIVE godowns; filters usually show all. */
  activeOnly?: boolean
  disabled?: boolean
  placeholder?: string
  size?: number
}

function toOption(item: GodownResponse): ComboboxOption {
  const location = [item.city, item.state].filter(Boolean).join(", ")
  return {
    id: item.uuid,
    label: `${item.godownCode} · ${item.godownName}`,
    sub: [item.branchCode ?? item.distributorBranchCode, location]
      .filter(Boolean)
      .join(" · "),
  }
}

/**
 * Godown picker scoped to a distributor. Used by the list filters and by the
 * stock adjustment/transfer forms (which may only target ACTIVE godowns).
 */
export function GodownCombobox({
  companyUuid,
  distributorUuid,
  value,
  onValueChange,
  activeOnly = false,
  disabled,
  placeholder = "Select godown...",
  size = 100,
}: Props) {
  const [search, setSearch] = React.useState("")

  const listQuery = useGodowns(
    companyUuid,
    distributorUuid,
    {
      q: search || undefined,
      status: activeOnly ? "ACTIVE" : undefined,
      page: 0,
      size,
    },
    { enabled: !!distributorUuid }
  )

  const rows = React.useMemo(
    () => listQuery.data?.content ?? [],
    [listQuery.data?.content]
  )

  const selectedInResults = React.useMemo(
    () => rows.find((item) => item.uuid === value),
    [rows, value]
  )

  const { data: fetchedSelected } = useGodown(
    companyUuid,
    distributorUuid,
    value ?? ""
  )

  const selectedItem = React.useMemo(() => {
    if (!value) return null
    return selectedInResults ?? fetchedSelected ?? null
  }, [value, selectedInResults, fetchedSelected])

  const options = React.useMemo(() => {
    const base = rows.map(toOption)
    if (!selectedItem) return base
    const option = toOption(selectedItem)
    if (base.some((item) => item.id === option.id)) return base
    return [...base, option]
  }, [rows, selectedItem])

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
          rows.find((row) => row.uuid === nextId) ??
          (selectedItem && selectedItem.uuid === nextId ? selectedItem : null)
        onValueChange(nextId, item)
      }}
      disabled={disabled || !distributorUuid}
      options={options}
      selectedOption={selectedItem ? toOption(selectedItem) : null}
      loading={listQuery.isFetching}
      emptyText="No godowns found."
      clearLabel="Clear godown"
      placeholder={placeholder}
      searchPlaceholder="Search godowns..."
      onSearchChange={setSearch}
    />
  )
}
