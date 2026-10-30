"use client"

import * as React from "react"
import {
  EntityCombobox,
  type ComboboxOption,
} from "@/components/common/EntityCombobox"
import { useCustomerMasters } from "../hooks/use-customer-masters"
import { useCustomerLookups } from "../hooks/use-customer-lookups"
import type {
  CustomerLookupType,
  CustomerMasterKind,
  CustomerMasterResponse,
} from "../api/customer.types"

const toOption = (row: CustomerMasterResponse): ComboboxOption => ({
  id: row.uuid,
  label: row.name,
})

type MasterProps = {
  companyUuid: string
  value?: string | null
  onValueChange: (
    value: string | null,
    item?: CustomerMasterResponse | null
  ) => void
  disabled?: boolean
  placeholder?: string
  /** Restrict to active rows (default true — the customer form needs active). */
  activeOnly?: boolean
  /** Only sub-types of this customer type. */
  customerTypeUuid?: string | null
  excludeIds?: string[]
  /**
   * Pre-filtered candidate rows (e.g. from `allowed-options`). When supplied
   * the component skips its own list query.
   */
  optionsOverride?: CustomerMasterResponse[]
}

function CustomerMasterCombobox({
  companyUuid,
  kind,
  entityLabel,
  value,
  onValueChange,
  disabled,
  placeholder,
  activeOnly = true,
  customerTypeUuid,
  excludeIds,
  optionsOverride,
}: MasterProps & { kind: CustomerMasterKind; entityLabel: string }) {
  const [debouncedQuery, setDebouncedQuery] = React.useState("")
  const hasOverride = !!optionsOverride

  const listQuery = useCustomerMasters(
    companyUuid,
    kind,
    {
      search: debouncedQuery || undefined,
      activeOnly: activeOnly || undefined,
      sort: "displayOrder,asc",
      page: 0,
      size: 100,
    },
    { enabled: !!companyUuid && !hasOverride }
  )

  const rows = React.useMemo(() => {
    const content = optionsOverride ?? listQuery.data?.content ?? []
    if (!customerTypeUuid) return content
    return content.filter(
      (row) => !row.customerTypeUuid || row.customerTypeUuid === customerTypeUuid
    )
  }, [optionsOverride, listQuery.data?.content, customerTypeUuid])

  // `optionsOverride` rows come from `allowed-options` (unpaged), so the server
  // never sees the search term — filter them locally so typing still narrows.
  const visibleRows = React.useMemo(() => {
    if (!hasOverride) return rows
    const needle = debouncedQuery.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(
      (row) =>
        row.name?.toLowerCase().includes(needle) ||
        row.code?.toLowerCase().includes(needle)
    )
  }, [hasOverride, rows, debouncedQuery])

  const searchResults = React.useMemo(() => {
    if (!excludeIds?.length) return visibleRows
    const excluded = new Set(excludeIds)
    return visibleRows.filter((row) => !excluded.has(row.uuid))
  }, [visibleRows, excludeIds])

  const selected = React.useMemo(
    () => rows.find((row) => row.uuid === value) ?? null,
    [rows, value]
  )

  const options = React.useMemo(() => {
    const base = searchResults.map(toOption)
    if (!selected) return base
    const selectedOption = toOption(selected)
    if (base.some((o) => o.id === selectedOption.id)) return base
    return [...base, selectedOption]
  }, [searchResults, selected])

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
        onValueChange(
          nextId,
          rows.find((row) => row.uuid === nextId) ?? null
        )
      }}
      disabled={disabled}
      options={options}
      selectedOption={selected ? toOption(selected) : null}
      loading={listQuery.isFetching}
      emptyText={`No ${lower}s found.`}
      clearLabel={`Clear ${lower}`}
      placeholder={placeholder ?? `Select ${lower}...`}
      searchPlaceholder={`Search ${lower}s...`}
      onSearchChange={setDebouncedQuery}
    />
  )
}

type WrapperProps = Omit<MasterProps, "kind" | "entityLabel">

/** Generic combobox for any classification master kind. */
export function CustomerMasterKindCombobox({
  kind,
  entityLabel,
  ...props
}: WrapperProps & { kind: CustomerMasterKind; entityLabel: string }) {
  return (
    <CustomerMasterCombobox kind={kind} entityLabel={entityLabel} {...props} />
  )
}

export function CustomerSubTypeCombobox(props: WrapperProps) {
  return (
    <CustomerMasterCombobox
      kind="customer-sub-types"
      entityLabel="Sub type"
      {...props}
    />
  )
}

export function CustomerChannelCombobox(props: WrapperProps) {
  return (
    <CustomerMasterCombobox
      kind="customer-channels"
      entityLabel="Channel"
      {...props}
    />
  )
}

export function CustomerSegmentCombobox(props: WrapperProps) {
  return (
    <CustomerMasterCombobox
      kind="customer-segments"
      entityLabel="Segment"
      {...props}
    />
  )
}

export function CustomerCategoryCombobox(props: WrapperProps) {
  return (
    <CustomerMasterCombobox
      kind="customer-categories"
      entityLabel="Category"
      {...props}
    />
  )
}

export function CustomerClassCombobox(props: WrapperProps) {
  return (
    <CustomerMasterCombobox
      kind="customer-classes"
      entityLabel="Class"
      {...props}
    />
  )
}

export function CustomerGroupCombobox(props: WrapperProps) {
  return (
    <CustomerMasterCombobox
      kind="customer-groups"
      entityLabel="Group"
      {...props}
    />
  )
}

// ── Lookups (value = code, not uuid) ─────────────────────────────────────────

type LookupProps = {
  companyUuid: string
  lookupType: CustomerLookupType
  value?: string | null
  onValueChange: (value: string | null, item?: CustomerMasterResponse | null) => void
  disabled?: boolean
  placeholder?: string
}

/**
 * Lookup values are stored on the customer as **codes** (`businessTypeCode`,
 * `shopSizeCode`, …), so the combobox id is the code while the label is the
 * human name.
 */
export function CustomerLookupCombobox({
  companyUuid,
  lookupType,
  value,
  onValueChange,
  disabled,
  placeholder,
}: LookupProps) {
  const { data, isFetching } = useCustomerLookups(companyUuid, lookupType)
  const rows = React.useMemo(() => data?.content ?? [], [data?.content])
  const [query, setQuery] = React.useState("")

  // `EntityCombobox` renders options as-is (`filter={null}`), so narrow the
  // fixed lookup list locally while the user types.
  const visibleRows = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(
      (row) =>
        row.name?.toLowerCase().includes(needle) ||
        row.code?.toLowerCase().includes(needle)
    )
  }, [rows, query])

  const options = React.useMemo(
    () =>
      visibleRows.map((row) => ({
        id: row.code,
        label: row.name,
      })),
    [visibleRows]
  )
  const selected = React.useMemo(() => {
    const match = rows.find((row) => row.code === value)
    return match ? { id: match.code, label: match.name } : null
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
          rows.find((row) => row.code === nextId) ?? null
        )
      }}
      disabled={disabled}
      options={options}
      selectedOption={selected}
      loading={isFetching}
      emptyText="No lookup values found. Load the customer defaults first."
      clearLabel="Clear selection"
      placeholder={placeholder ?? "Select value..."}
      searchPlaceholder="Search values..."
      onSearchChange={setQuery}
    />
  )
}
