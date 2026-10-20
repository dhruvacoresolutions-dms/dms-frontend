"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const STATUS_ITEMS = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
] as const

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
      items={STATUS_ITEMS}
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
        {STATUS_ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
