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
import { DesignationCombobox } from "@/features/designations/components/DesignationCombobox"
import type { EmployeeStatus } from "@/features/employees/api/employee.types"

export type EmployeeFiltersValues = {
  search: string
  status: "ALL" | EmployeeStatus
  designationUuid: string | null
}

type EmployeeFiltersProps = {
  companyUuid: string
  values: EmployeeFiltersValues
  onSearchChange: (value: string) => void
  onStatusChange: (value: "ALL" | EmployeeStatus) => void
  onDesignationChange: (uuid: string | null) => void
  onClear: () => void
  /** Optional trailing element pinned to the right (e.g. bulk actions) */
  action?: React.ReactNode
}

export function EmployeeFilters({
  companyUuid,
  values,
  onSearchChange,
  onStatusChange,
  onDesignationChange,
  onClear,
  action,
}: EmployeeFiltersProps) {
  const [resetKey, setResetKey] = React.useState(0)
  const hasActiveFilters =
    values.search !== "" ||
    values.status !== "ALL" ||
    values.designationUuid !== null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        key={resetKey}
        placeholder="Search employees..."
        defaultValue={values.search}
        onChange={onSearchChange}
      />
      <div className="w-full sm:w-64">
        <DesignationCombobox
          companyUuid={companyUuid}
          value={values.designationUuid}
          onValueChange={onDesignationChange}
          placeholder="Filter by designation..."
          size={100}
        />
      </div>
      <Select
        value={values.status}
        onValueChange={(v) => onStatusChange(v as "ALL" | EmployeeStatus)}
      >
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
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
