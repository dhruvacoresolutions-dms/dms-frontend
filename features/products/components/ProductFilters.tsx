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
import { ProductCategoryCombobox } from "@/features/product-categories/components/ProductCategoryCombobox"

export type ProductFiltersValues = {
  search: string
  lifecycleStatus: string
  categoryUuid: string | null
}

type ProductFiltersProps = {
  companyUuid: string
  values: ProductFiltersValues
  onSearchChange: (value: string) => void
  onLifecycleStatusChange: (value: string) => void
  onCategoryChange: (uuid: string | null) => void
  onClear: () => void
  /** Optional trailing element pinned to the right (e.g. export) */
  action?: React.ReactNode
}

export function ProductFilters({
  companyUuid,
  values,
  onSearchChange,
  onLifecycleStatusChange,
  onCategoryChange,
  onClear,
  action,
}: ProductFiltersProps) {
  const [resetKey, setResetKey] = React.useState(0)
  const hasActiveFilters =
    values.search !== "" ||
    values.lifecycleStatus !== "ALL" ||
    values.categoryUuid !== null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        key={resetKey}
        placeholder="Search products..."
        defaultValue={values.search}
        onChange={onSearchChange}
      />
      <div className="w-full sm:w-64">
        <ProductCategoryCombobox
          companyUuid={companyUuid}
          value={values.categoryUuid}
          onValueChange={onCategoryChange}
          placeholder="Filter by category..."
          size={100}
        />
      </div>
      <Select
        value={values.lifecycleStatus}
        onValueChange={(v: string | null) => v && onLifecycleStatusChange(v)}
      >
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent className="p-2">
          <SelectItem value="ALL">All statuses</SelectItem>
          <SelectItem value="DRAFT">Draft</SelectItem>
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
