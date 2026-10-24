"use client"

import { useState } from "react"
import { AlertCircle, ChevronDown, UsersRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { COVERAGE_WEEKDAY_LABELS } from "../lib/coverage-plan.utils"
import type { CoverageWeekday } from "../api/coverage-plan.types"
import { CoverageCustomerPicker } from "./CoverageCustomerPicker"

type CoverageWeekdayEditorProps = {
  companyUuid: string
  employeeUuid: string
  weekday: CoverageWeekday
  included: boolean
  customerUuids: string[]
  onIncludedChange: (included: boolean) => void
  onCustomersChange: (customerUuids: string[]) => void
  primaryTerritoryUuid?: string | null
  primaryGeographyName?: string | null
  disabled?: boolean
  error?: string
}

/**
 * One Monday–Saturday template line. A weekday is only sent when it is
 * included and has at least one customer.
 */
export function CoverageWeekdayEditor({
  companyUuid,
  employeeUuid,
  weekday,
  included,
  customerUuids,
  onIncludedChange,
  onCustomersChange,
  primaryTerritoryUuid,
  primaryGeographyName,
  disabled,
  error,
}: CoverageWeekdayEditorProps) {
  const [open, setOpen] = useState(included && customerUuids.length === 0)
  const count = customerUuids.length

  const toggleIncluded = (next: boolean) => {
    onIncludedChange(next)
    setOpen(next)
  }

  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        included ? "bg-card" : "bg-muted/20",
        error && "border-destructive/60"
      )}
    >
      <div className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
        <Checkbox
          checked={included}
          disabled={disabled}
          onCheckedChange={(checked) => toggleIncluded(checked === true)}
          aria-label={`Include ${COVERAGE_WEEKDAY_LABELS[weekday]} in the coverage template`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "text-sm font-semibold",
                !included && "text-muted-foreground"
              )}
            >
              {COVERAGE_WEEKDAY_LABELS[weekday]}
            </span>
            {included ? (
              <Badge variant={count > 0 ? "secondary" : "outline"}>
                {count > 0
                  ? `${count} customer${count === 1 ? "" : "s"}`
                  : "Needs customers"}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">Not covered</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {included
              ? count > 0
                ? "Customers on this weekday are included in every covered week."
                : "Select at least one customer to include this weekday."
              : "Tick the box to cover this weekday."}
          </p>
        </div>

        {included ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls={`coverage-${weekday}-customers`}
          >
            <UsersRound className="mr-1.5 size-4" />
            {open
              ? "Hide customers"
              : count > 0
                ? "Manage customers"
                : "Add customers"}
            <ChevronDown
              className={cn(
                "ml-1 size-4 transition-transform",
                open && "rotate-180"
              )}
            />
          </Button>
        ) : null}
      </div>

      {included && open ? (
        <div
          id={`coverage-${weekday}-customers`}
          className="border-t bg-muted/10 p-3"
        >
          <CoverageCustomerPicker
            companyUuid={companyUuid}
            employeeUuid={employeeUuid}
            primaryTerritoryUuid={primaryTerritoryUuid}
            primaryGeographyName={primaryGeographyName}
            value={customerUuids}
            onChange={onCustomersChange}
            disabled={disabled}
            invalid={!!error}
            error={error}
          />
        </div>
      ) : null}

      {included && !open && error ? (
        <div className="border-t px-3 py-2">
          <p
            role="alert"
            className="flex items-center gap-1.5 text-sm text-destructive"
          >
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        </div>
      ) : null}
    </div>
  )
}
