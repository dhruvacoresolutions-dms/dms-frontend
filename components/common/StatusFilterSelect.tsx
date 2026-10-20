"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type StatusFilterSelectProps = {
  value: "ALL" | string
  onChange: (value: "ALL" | string) => void
  className?: string
  /** Accessible name for the trigger (the trigger itself has no visible label). */
  ariaLabel?: string
}

/**
 * Shared ACTIVE/INACTIVE status filter used by master list pages.
 * Mirrors the `status` query param found in the Postman collection.
 */
export function StatusFilterSelect({
  value,
  onChange,
  className,
  ariaLabel = "Filter by status",
}: StatusFilterSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(v: string | null) => v && onChange(v)}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn("w-full sm:w-36", className)}
      >
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent className="p-2">
        <SelectItem value="ALL">All statuses</SelectItem>
        <SelectItem value="ACTIVE">Active</SelectItem>
        <SelectItem value="INACTIVE">Inactive</SelectItem>
      </SelectContent>
    </Select>
  )
}
