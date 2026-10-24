"use client"

import { CalendarRange, Clock, Hash, Repeat, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmployeeLabel } from "@/features/visit-plans/components/EmployeeLabel"
import {
  COVERAGE_PLAN_SOURCE_LABELS,
  coverageTotalCustomers,
  coverageWeekdayCount,
  formatCoverageDateRange,
  formatCoverageDateTime,
  formatCoverageRepeatRule,
} from "../lib/coverage-plan.utils"
import type { CoveragePlan } from "../api/coverage-plan.types"
import { CoverageWeekdayStrip } from "./CoverageWeekdayStrip"

type CoveragePlanSummaryCardProps = {
  companyUuid: string
  plan: CoveragePlan
}

function Detail({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 space-y-0.5">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="truncate text-sm">{children}</dd>
    </div>
  )
}

/** Read-only coverage template header. */
export function CoveragePlanSummaryCard({
  companyUuid,
  plan,
}: CoveragePlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="size-4 text-muted-foreground" />
          Coverage template
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-0.5">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Status
            </dt>
            <dd className="flex flex-wrap items-center gap-2">
              <StatusBadge status={plan.status} />
              <Badge variant="outline">
                {COVERAGE_PLAN_SOURCE_LABELS[plan.source]}
              </Badge>
            </dd>
          </div>
          <Detail label="Plan for">
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="size-3.5 text-muted-foreground" />
              <EmployeeLabel
                companyUuid={companyUuid}
                employeeUuid={plan.employeeUuid}
              />
            </span>
          </Detail>
          <Detail label="Period">
            {formatCoverageDateRange(plan.startDate, plan.endDate)}
          </Detail>
          <Detail label="Repeat">
            <span className="inline-flex items-center gap-1.5">
              <Repeat className="size-3.5 text-muted-foreground" />
              {formatCoverageRepeatRule(plan.repeatRule, plan.endDate)}
            </span>
          </Detail>
          <Detail label="Weekdays">
            {coverageWeekdayCount(plan)} of 6 covered
          </Detail>
          <Detail label="Customer assignments">
            <span className="inline-flex items-center gap-1.5">
              <Hash className="size-3.5 text-muted-foreground" />
              {coverageTotalCustomers(plan)}
            </span>
          </Detail>
          <Detail label="Created">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" />
              {formatCoverageDateTime(plan.createdAt)}
            </span>
          </Detail>
          <Detail label="Last updated">
            {formatCoverageDateTime(plan.updatedAt)}
          </Detail>
        </dl>

        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Weekly coverage
          </p>
          <CoverageWeekdayStrip plan={plan} variant="detailed" />
          <p className="mt-2 text-xs text-muted-foreground">
            Sunday is never a coverage day. Counts show customer assignments per
            weekday.
          </p>
        </div>

        {plan.rejectReason ? (
          <div
            role="note"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
          >
            <p className="font-medium">Rejection reason</p>
            <p className="mt-0.5">{plan.rejectReason}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
