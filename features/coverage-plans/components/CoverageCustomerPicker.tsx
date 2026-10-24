"use client"

import { useMemo, useState } from "react"
import { AlertCircle, CheckCheck, Loader2, UsersRound, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SearchInput } from "@/components/common/SearchInput"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { cn } from "@/lib/utils"
import { useCustomers } from "@/features/customers/hooks/use-customers"
import type { CustomerResponse } from "@/features/customers/api/customer.types"
import {
  MAX_COVERAGE_CUSTOMERS,
  getCoveragePlanErrorMessage,
} from "../lib/coverage-plan.utils"
import { CoverageCustomerName } from "./CoverageCustomerName"

type CoverageCustomerPickerProps = {
  companyUuid: string
  employeeUuid: string
  /** Primary geography UUID when it is a TERRITORY (exact-match filter). */
  primaryTerritoryUuid?: string | null
  primaryGeographyName?: string | null
  value: string[]
  onChange: (customerUuids: string[]) => void
  disabled?: boolean
  invalid?: boolean
  error?: string
  max?: number
}

/**
 * Customer multiselect for one weekday line. Options come from the customer
 * master list filtered to ACTIVE, territory-assigned customers. The backend
 * still validates every UUID against the employee's primary geography.
 */
export function CoverageCustomerPicker({
  companyUuid,
  employeeUuid,
  primaryTerritoryUuid,
  primaryGeographyName,
  value,
  onChange,
  disabled,
  invalid,
  error,
  max = MAX_COVERAGE_CUSTOMERS,
}: CoverageCustomerPickerProps) {
  const [query, setQuery] = useState("")
  const [pickedLabels, setPickedLabels] = useState<
    Record<string, CustomerResponse>
  >({})

  const params = useMemo(
    () => ({
      q: query || undefined,
      lifecycleStatus: "ACTIVE" as const,
      territoryUuid: primaryTerritoryUuid || undefined,
      territoryAssigned: true,
      page: 0,
      size: 100,
    }),
    [primaryTerritoryUuid, query]
  )

  const customersQuery = useCustomers(companyUuid, params, {
    enabled: !!employeeUuid,
  })

  const candidates = useMemo(
    () => customersQuery.data?.content ?? [],
    [customersQuery.data?.content]
  )

  const candidateById = useMemo(
    () => new Map(candidates.map((candidate) => [candidate.uuid, candidate])),
    [candidates]
  )

  const selectedSet = useMemo(() => new Set(value), [value])
  const atLimit = value.length >= max

  const toggle = (customerUuid: string) => {
    if (disabled) return
    if (selectedSet.has(customerUuid)) {
      onChange(value.filter((uuid) => uuid !== customerUuid))
      return
    }
    if (atLimit) {
      toast.error(`A weekday line can contain at most ${max} customers.`)
      return
    }
    const candidate = candidateById.get(customerUuid)
    if (candidate) {
      setPickedLabels((previous) => ({
        ...previous,
        [customerUuid]: candidate,
      }))
    }
    onChange([...value, customerUuid])
  }

  const selectShown = () => {
    if (disabled) return
    const merged = Array.from(
      new Set([...value, ...candidates.map((candidate) => candidate.uuid)])
    )
    if (merged.length > max) {
      toast.info(
        `Only the first ${max} customers were selected. Remove customers or refine the search to choose a different set.`
      )
    }
    setPickedLabels((previous) => {
      const next = { ...previous }
      for (const candidate of candidates) next[candidate.uuid] = candidate
      return next
    })
    onChange(merged.slice(0, max))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Customers</span>
          <Badge variant={atLimit ? "secondary" : "outline"}>
            {value.length}/{max}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {value.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onChange([])}
            >
              <X className="mr-1.5 size-4" /> Clear
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              disabled || !employeeUuid || customersQuery.isFetching || atLimit
            }
            onClick={selectShown}
          >
            {customersQuery.isFetching ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-1.5 size-4" />
            )}
            Select shown
          </Button>
        </div>
      </div>

      {value.length > 0 ? (
        <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-lg border bg-muted/20 p-2">
          {value.map((customerUuid) => {
            const candidate =
              pickedLabels[customerUuid] ?? candidateById.get(customerUuid)
            return (
              <Badge
                key={customerUuid}
                variant="outline"
                className="h-auto max-w-full gap-1 py-1"
              >
                <span className="max-w-52 truncate">
                  {candidate ? (
                    candidate.shopName
                  ) : (
                    <CoverageCustomerName
                      companyUuid={companyUuid}
                      customerUuid={customerUuid}
                      showCode={false}
                    />
                  )}
                </span>
                {!disabled ? (
                  <button
                    type="button"
                    aria-label={
                      candidate?.shopName
                        ? `Remove ${candidate.shopName}`
                        : "Remove customer"
                    }
                    className="rounded-sm text-muted-foreground hover:text-foreground"
                    onClick={() => toggle(customerUuid)}
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
              </Badge>
            )
          })}
        </div>
      ) : null}

      <div
        className={cn(
          "rounded-lg border",
          invalid && "border-destructive ring-3 ring-destructive/20"
        )}
      >
        <div className="border-b p-2">
          <SearchInput
            placeholder="Search active customers..."
            onChange={setQuery}
            className="w-full max-w-none"
          />
        </div>

        {!employeeUuid ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            Select an employee before choosing customers.
          </p>
        ) : customersQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading customers…
          </div>
        ) : customersQuery.error ? (
          <ErrorState
            message={getCoveragePlanErrorMessage(
              customersQuery.error,
              "Unable to load customers"
            )}
            onRetry={() => void customersQuery.refetch()}
            className="py-8"
          />
        ) : candidates.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="No active customers found"
            description={
              query
                ? "No active customer matches this search."
                : primaryTerritoryUuid && primaryGeographyName
                  ? `No active customers are assigned in ${primaryGeographyName}.`
                  : "No active, territory-assigned customers are available."
            }
            className="py-8"
          />
        ) : (
          <ScrollArea className="h-64">
            <ul className="divide-y">
              {candidates.map((candidate) => {
                const checked = selectedSet.has(candidate.uuid)
                const territory = candidate.displayNames?.territory
                return (
                  <li key={candidate.uuid}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50",
                        disabled && "cursor-not-allowed opacity-60"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={disabled || (atLimit && !checked)}
                        onCheckedChange={() => toggle(candidate.uuid)}
                        aria-label={`Select ${candidate.shopName}`}
                      />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">
                          {candidate.shopName}
                        </span>
                        <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                          <span className="font-mono">
                            {candidate.customerCode}
                          </span>
                          {territory ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{territory}</span>
                            </>
                          ) : null}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}
      </div>

      {customersQuery.data &&
      customersQuery.data.totalElements > candidates.length ? (
        <p className="text-xs text-muted-foreground">
          Showing the first {candidates.length} of{" "}
          {customersQuery.data.totalElements} active customers. Refine the
          search to narrow the list.
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Only ACTIVE customers inside the employee&apos;s primary geography are
        accepted. The server validates the final selection.
        {primaryGeographyName ? (
          <>
            {" "}
            Primary geography:{" "}
            <span className="font-medium">{primaryGeographyName}</span>.
          </>
        ) : null}
      </p>

      {error ? (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  )
}
