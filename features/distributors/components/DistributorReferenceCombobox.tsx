"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  EntityCombobox,
  type ComboboxOption,
} from "@/components/common/EntityCombobox"
import { useDistributorReferences } from "../hooks/use-distributor-references"
import { getDistributorReference } from "../api/distributor-reference.api"
import type {
  DistributorReferenceKind,
  DistributorReferenceResponse,
} from "../api/distributor-reference.types"

type Props = {
  kind: DistributorReferenceKind
  entityLabel: string
  companyUuid: string
  value?: string | null
  onValueChange: (
    value: string | null,
    item?: DistributorReferenceResponse | null
  ) => void
  disabled?: boolean
  size?: number
  excludeIds?: string[]
  placeholder?: string
}

function toOption(item: DistributorReferenceResponse): ComboboxOption {
  return { id: item.uuid, label: item.name, sub: item.code }
}

function DistributorReferenceCombobox({
  kind,
  entityLabel,
  companyUuid,
  value,
  onValueChange,
  disabled,
  size = 100,
  excludeIds,
  placeholder,
}: Props) {
  const [debouncedQuery, setDebouncedQuery] = React.useState("")

  const listQuery = useDistributorReferences(companyUuid, kind, {
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
    queryKey: ["companies", companyUuid, "distributor-references", kind, "detail", value],
    queryFn: () => getDistributorReference(companyUuid, kind, value as string),
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
  const lower = entityLabel.toLowerCase()

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
      emptyText={`No ${lower}s found.`}
      clearLabel={`Clear ${lower}`}
      placeholder={placeholder ?? `Select ${lower}...`}
      searchPlaceholder={`Search ${lower}s...`}
      onSearchChange={setDebouncedQuery}
    />
  )
}

type WrapperProps = Omit<Props, "kind" | "entityLabel">

export function DistributorTypeCombobox(props: WrapperProps) {
  return (
    <DistributorReferenceCombobox
      kind="distributor-types"
      entityLabel="Distributor Type"
      {...props}
    />
  )
}

export function BusinessConstitutionCombobox(props: WrapperProps) {
  return (
    <DistributorReferenceCombobox
      kind="business-constitutions"
      entityLabel="Business Constitution"
      {...props}
    />
  )
}

export function PaymentTermCombobox(props: WrapperProps) {
  return (
    <DistributorReferenceCombobox
      kind="payment-terms"
      entityLabel="Payment Term"
      {...props}
    />
  )
}

export function TaxProfileCombobox(props: WrapperProps) {
  return (
    <DistributorReferenceCombobox
      kind="tax-profiles"
      entityLabel="Tax Profile"
      {...props}
    />
  )
}
