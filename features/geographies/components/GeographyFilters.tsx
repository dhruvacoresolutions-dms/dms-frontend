"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchInput } from "@/components/common/SearchInput"
import type {
  GeographyStatus,
  GeographyType,
} from "@/features/geographies/api/geography.types"

export const GEOGRAPHY_TYPES: GeographyType[] = [
  "COUNTRY",
  "ZONE",
  "STATE",
  "REGION",
  "TERRITORY",
  "BEAT",
]

export type GeographyFiltersValues = {
  search: string
  type: "ALL" | GeographyType
  status: "ALL" | GeographyStatus
}

type GeographyFiltersProps = {
  values: GeographyFiltersValues
  onSearchChange: (value: string) => void
  onTypeChange: (value: "ALL" | GeographyType) => void
  onStatusChange: (value: "ALL" | GeographyStatus) => void
  onClear: () => void
  /** Optional trailing element pinned to the right (e.g. export) */
  action?: React.ReactNode
}

export function GeographyFilters({
  values,
  onSearchChange,
  onTypeChange,
  onStatusChange,
  onClear,
  action,
}: GeographyFiltersProps) {
  const [resetKey, setResetKey] = React.useState(0)
  const hasActiveFilters =
    values.search !== "" || values.type !== "ALL" || values.status !== "ALL"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        key={resetKey}
        placeholder="Search geographies..."
        defaultValue={values.search}
        onChange={onSearchChange}
      />
      <Select
        value={values.type}
        onValueChange={(v) => onTypeChange(v as "ALL" | GeographyType)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent className="p-2">
          <SelectItem value="ALL">All types</SelectItem>
          {GEOGRAPHY_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={values.status}
        onValueChange={(v) => onStatusChange(v as "ALL" | GeographyStatus)}
      >
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent className="p-2">
          <SelectItem value="ALL">All statuses</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="INACTIVE">Inactive</SelectItem>
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setResetKey((k) => k + 1)
            onClear()
          }}
        >
          <X className="mr-1 size-4" />
          Clear
        </Button>
      )}
      {action && <div className="ml-auto flex items-center">{action}</div>}
    </div>
  )
}
