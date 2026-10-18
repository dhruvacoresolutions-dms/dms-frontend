"use client"

import * as React from "react"
import {
  EntityCombobox,
  type ComboboxOption,
} from "@/components/common/EntityCombobox"
import { useDistributorBranches } from "../hooks/use-distributor-branches"
import type { DistributorBranchResponse } from "../api/distributor.types"

type Props = {
  companyUuid: string
  /** Injected via `comboboxProps` by FormComboboxField */
  distributorUuid?: string
  value?: string | null
  onValueChange: (
    value: string | null,
    item?: DistributorBranchResponse | null
  ) => void
  disabled?: boolean
  placeholder?: string
}

function toOption(item: DistributorBranchResponse): ComboboxOption {
  return { id: item.branchUuid, label: item.branchName, sub: item.branchCode }
}

export function DistributorBranchCombobox({
  companyUuid,
  distributorUuid,
  value,
  onValueChange,
  disabled,
  placeholder = "Select branch...",
}: Props) {
  const listQuery = useDistributorBranches(companyUuid, distributorUuid ?? "", {
    status: "ACTIVE",
    page: 0,
    size: 100,
  })

  const results = React.useMemo(
    () => listQuery.data?.content ?? [],
    [listQuery.data?.content]
  )

  const selectedItem = React.useMemo(
    () => results.find((item) => item.branchUuid === value) ?? null,
    [results, value]
  )

  const options = React.useMemo(() => {
    const base = results.map(toOption)
    if (!selectedItem) return base
    const selectedOption = toOption(selectedItem)
    if (base.some((o) => o.id === selectedOption.id)) return base
    return [...base, selectedOption]
  }, [results, selectedItem])

  return (
    <EntityCombobox
      companyUuid={companyUuid}
      value={value}
      onValueChange={(nextId) => {
        if (!nextId) {
          onValueChange(null, null)
          return
        }
        const item = results.find((row) => row.branchUuid === nextId) ?? null
        onValueChange(nextId, item)
      }}
      disabled={disabled}
      options={options}
      selectedOption={selectedItem ? toOption(selectedItem) : null}
      loading={listQuery.isFetching}
      emptyText="No branches found."
      clearLabel="Clear branch"
      placeholder={placeholder}
      searchPlaceholder="Search branches..."
    />
  )
}
