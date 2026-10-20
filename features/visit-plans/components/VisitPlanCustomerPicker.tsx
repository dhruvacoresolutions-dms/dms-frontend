"use client"

import { useMemo, useState } from "react"
import { AlertCircle, CheckCheck, Loader2, UsersRound, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SearchInput } from "@/components/common/SearchInput"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { requiredLabel } from "@/components/common/form-fields"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { cn } from "@/lib/utils"
import { useUnplannedCustomers } from "../hooks/use-unplanned-customers"
import { useSelectAllUnplannedCustomers } from "../hooks/use-select-all-unplanned-customers"
import {
  MAX_VISIT_PLAN_CUSTOMERS,
  getVisitPlanErrorMessage,
} from "../lib/visit-plan.utils"
import type {
  SelectAllUnplannedCustomersParams,
  UnplannedCustomersParams,
  VisitPlanCandidate,
  VisitPlanType,
} from "../api/visit-plan.types"

type VisitPlanCustomerPickerProps = {
  companyUuid: string
  employeeUuid?: string | null
  /** Plan date. Today or later, enforced by the backend lookup. */
  date?: string
  planType: VisitPlanType
  /** Required for OUTSTATION; an ADDITIONAL geography of the employee. */
  destinationGeographyUuid?: string | null
  /** Editing: pass the plan UUID so its own customers stay selectable. */
  excludePlanUuid?: string
  value: string[]
  onChange: (customerUuids: string[]) => void
  disabled?: boolean
  invalid?: boolean
  error?: string
  label?: string
}

/**
 * Customer multiselect for the plan builder. Options come from
 * `GET /unplanned-customers` (ACTIVE customers in the employee's primary
 * geography, or the OUTSTATION destination geography, not already planned).
 * The backend caps a plan (and a plan day) at 200 customers.
 */
export function VisitPlanCustomerPicker({
  companyUuid,
  employeeUuid,
  date,
  planType,
  destinationGeographyUuid,
  excludePlanUuid,
  value,
  onChange,
  disabled,
  invalid,
  error,
  label = "Customers",
}: VisitPlanCustomerPickerProps) {
  const [query, setQuery] = useState("")
  const [pickedLabels, setPickedLabels] = useState<
    Record<string, VisitPlanCandidate>
  >({})

  const requestParams = useMemo<UnplannedCustomersParams>(
    () => ({
      employeeUuid: employeeUuid || undefined,
      date: date ?? "",
      planType,
      destinationGeographyUuid:
        planType === "OUTSTATION"
          ? destinationGeographyUuid || undefined
          : undefined,
      excludePlanUuid,
      q: query || undefined,
      page: 0,
      size: MAX_VISIT_PLAN_CUSTOMERS,
    }),
    [
      employeeUuid,
      date,
      planType,
      destinationGeographyUuid,
      excludePlanUuid,
      query,
    ]
  )

  const selectAllParams = useMemo<SelectAllUnplannedCustomersParams>(
    () => ({
      employeeUuid: requestParams.employeeUuid,
      date: requestParams.date,
      planType: requestParams.planType,
      destinationGeographyUuid: requestParams.destinationGeographyUuid,
      excludePlanUuid: requestParams.excludePlanUuid,
      q: requestParams.q,
    }),
    [requestParams]
  )

  const customersQuery = useUnplannedCustomers(companyUuid, requestParams)
  const selectAllQuery = useSelectAllUnplannedCustomers(
    companyUuid,
    selectAllParams,
    { enabled: false }
  )

  const candidates = useMemo(
    () => customersQuery.data?.content ?? [],
    [customersQuery.data?.content]
  )

  const candidateById = useMemo(
    () => new Map(candidates.map((candidate) => [candidate.uuid, candidate])),
    [candidates]
  )

  const labelFor = (customerUuid: string) =>
    pickedLabels[customerUuid] ?? candidateById.get(customerUuid)

  const selectedSet = useMemo(() => new Set(value), [value])

  const toggle = (customerUuid: string) => {
    if (disabled) return
    if (selectedSet.has(customerUuid)) {
      onChange(value.filter((uuid) => uuid !== customerUuid))
      return
    }
    if (value.length >= MAX_VISIT_PLAN_CUSTOMERS) {
      toast.error(
        `A plan day can contain at most ${MAX_VISIT_PLAN_CUSTOMERS} customers.`
      )
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

  const handleSelectAll = async () => {
    try {
      const result = await selectAllQuery.refetch()
      if (result.error) {
        toast.error(
          getVisitPlanErrorMessage(
            result.error,
            "Unable to select all customers"
          )
        )
        return
      }
      const ids = result.data ?? []
      onChange(ids.slice(0, MAX_VISIT_PLAN_CUSTOMERS))
      setPickedLabels((previous) => {
        const next = { ...previous }
        for (const candidate of candidates) next[candidate.uuid] = candidate
        return next
      })
      if (ids.length === 0) {
        toast.info("No unplanned customers match the current filters.")
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to select all customers"))
    }
  }

  const canLoad =
    !!date && (planType !== "OUTSTATION" || !!destinationGeographyUuid)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {label ? requiredLabel(label) : null}
          </span>
          <Badge variant="secondary">
            {value.length}/{MAX_VISIT_PLAN_CUSTOMERS}
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
            disabled={disabled || !canLoad || selectAllQuery.isFetching}
            onClick={() => void handleSelectAll()}
          >
            {selectAllQuery.isFetching ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-1.5 size-4" />
            )}
            Select all
          </Button>
        </div>
      </div>

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 rounded-lg border bg-muted/30 p-2">
          {value.map((customerUuid) => {
            const candidate = labelFor(customerUuid)
            return (
              <Badge
                key={customerUuid}
                variant="outline"
                className="h-auto max-w-full gap-1 py-1"
              >
                <span className="truncate">
                  {candidate
                    ? `${candidate.shopName} · ${candidate.customerCode}`
                    : customerUuid.slice(0, 8)}
                </span>
                {!disabled ? (
                  <button
                    type="button"
                    aria-label={`Remove ${candidate?.shopName ?? customerUuid}`}
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
            placeholder="Search unplanned customers..."
            onChange={setQuery}
            className="w-full"
          />
        </div>

        {!canLoad ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            {!date
              ? "Select a date to load unplanned customers."
              : "Select a destination geography to load unplanned customers."}
          </p>
        ) : customersQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading customers…
          </div>
        ) : customersQuery.error ? (
          <ErrorState
            message={getVisitPlanErrorMessage(
              customersQuery.error,
              "Unable to load unplanned customers"
            )}
            onRetry={() => void customersQuery.refetch()}
            className="py-8"
          />
        ) : candidates.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="No unplanned customers"
            description={
              query
                ? "No unplanned customer matches this search."
                : "Every customer in this geography is already planned or unavailable."
            }
            className="py-8"
          />
        ) : (
          <ScrollArea className="h-64">
            <ul className="divide-y">
              {candidates.map((candidate) => {
                const checked = selectedSet.has(candidate.uuid)
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
                        disabled={disabled}
                        onCheckedChange={() => toggle(candidate.uuid)}
                        aria-label={`Select ${candidate.shopName}`}
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">
                          {candidate.shopName}
                        </span>
                        <span className="truncate font-mono text-xs text-muted-foreground">
                          {candidate.customerCode}
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
          {customersQuery.data.totalElements} candidates. Refine the search to
          narrow the list.
        </p>
      ) : null}

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
