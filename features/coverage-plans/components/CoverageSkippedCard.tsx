"use client"

import { useMemo, useState } from "react"
import { AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/common/EmptyState"
import { cn } from "@/lib/utils"
import {
  COVERAGE_SKIP_REASON_LABELS,
  formatCoverageDate,
} from "../lib/coverage-plan.utils"
import type {
  CoverageSkipReason,
  CoverageSkipped,
} from "../api/coverage-plan.types"
import { CoverageCustomerName } from "./CoverageCustomerName"

const SKIP_REASON_CLASSES: Record<CoverageSkipReason, string> = {
  HOLIDAY:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  WEEKLY_OFF:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  MANUAL_PLAN_EXISTS:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  CUSTOMER_INACTIVE:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  NOT_IN_PRIMARY:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300",
}

const SKIP_REASONS = Object.keys(
  COVERAGE_SKIP_REASON_LABELS
) as CoverageSkipReason[]

type CoverageSkippedCardProps = {
  companyUuid: string
  skipped: CoverageSkipped[]
}

const PAGE_SIZE = 50

/** Customers skipped during generation, grouped by date in the API payload. */
export function CoverageSkippedCard({
  companyUuid,
  skipped,
}: CoverageSkippedCardProps) {
  const [reason, setReason] = useState<"ALL" | CoverageSkipReason>("ALL")
  const [visible, setVisible] = useState(PAGE_SIZE)

  const counts = useMemo(() => {
    const next = {} as Record<CoverageSkipReason, number>
    for (const item of skipped) {
      next[item.reason] = (next[item.reason] ?? 0) + 1
    }
    return next
  }, [skipped])

  const filtered = useMemo(
    () =>
      reason === "ALL"
        ? skipped
        : skipped.filter((item) => item.reason === reason),
    [reason, skipped]
  )

  const shown = filtered.slice(0, visible)
  const remaining = filtered.length - shown.length

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-muted-foreground" />
            Skipped during generation
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{skipped.length}</Badge>
            {skipped.length > 0 ? (
              <div className="w-52">
                <Select
                  items={[
                    { value: "ALL", label: "All skip reasons" },
                    ...SKIP_REASONS.map((item) => ({
                      value: item,
                      label: COVERAGE_SKIP_REASON_LABELS[item],
                    })),
                  ]}
                  value={reason}
                  onValueChange={(value: string | null) => {
                    if (!value) return
                    setReason(value as "ALL" | CoverageSkipReason)
                    setVisible(PAGE_SIZE)
                  }}
                >
                  <SelectTrigger aria-label="Filter skipped customers by reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="p-2">
                    <SelectItem value="ALL">All skip reasons</SelectItem>
                    {SKIP_REASONS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {COVERAGE_SKIP_REASON_LABELS[item]} ({counts[item] ?? 0}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {skipped.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Nothing was skipped"
            description="Every covered weekday and customer produced a visit plan, or the plan has not been approved yet."
            className="py-8"
          />
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No customers were skipped for this reason.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <ul className="divide-y">
              {shown.map((item) => (
                <li
                  key={`${item.date}-${item.customerUuid}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {formatCoverageDate(item.date)}
                    </p>
                    <CoverageCustomerName
                      companyUuid={companyUuid}
                      customerUuid={item.customerUuid}
                    />
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(SKIP_REASON_CLASSES[item.reason])}
                  >
                    {COVERAGE_SKIP_REASON_LABELS[item.reason]}
                  </Badge>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Showing {shown.length} of {filtered.length} skipped customer
                {filtered.length === 1 ? "" : "s"}
                {reason === "ALL" ? "" : " for this reason"}.
              </p>
              {remaining > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVisible((current) => current + PAGE_SIZE)}
                >
                  Show {Math.min(remaining, PAGE_SIZE)} more
                </Button>
              ) : null}
            </div>
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          Skipped entries are re-evaluated when an approved plan is edited or
          regenerated. They do not create visits.
        </p>
      </CardContent>
    </Card>
  )
}
