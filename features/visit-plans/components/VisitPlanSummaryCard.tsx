"use client"

import { CalendarRange, MapPin, UserRound } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/common/StatusBadge"
import { GeographyLabel } from "@/features/company-calendar/components/GeographyLabel"
import {
  formatVisitPlanDateRange,
  formatVisitPlanDateTime,
} from "../lib/visit-plan.utils"
import type { VisitPlan } from "../api/visit-plan.types"
import { EmployeeLabel } from "./EmployeeLabel"

type VisitPlanSummaryCardProps = {
  companyUuid: string
  plan: VisitPlan
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

/** Read-only plan header: status, employee, dates, destination and reason. */
export function VisitPlanSummaryCard({
  companyUuid,
  plan,
}: VisitPlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarRange className="size-4 text-muted-foreground" />
          Plan details
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-0.5">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Status
            </dt>
            <dd>
              <StatusBadge status={plan.status} />
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
          <Detail label="Plan type">{plan.planType}</Detail>
          <Detail label="Date">
            {formatVisitPlanDateRange(plan.fromDate, plan.toDate)}
          </Detail>
          <Detail label="Destination">
            {plan.planType === "OUTSTATION" ? (
              plan.destinationGeographyUuid ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  <GeographyLabel
                    companyUuid={companyUuid}
                    geographyUuid={plan.destinationGeographyUuid}
                  />
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )
            ) : (
              <span className="text-muted-foreground">Primary geography</span>
            )}
          </Detail>
          <Detail label="Last updated">
            {formatVisitPlanDateTime(plan.updatedAt)}
          </Detail>
        </dl>

        {plan.reason ? (
          <div
            role="note"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
          >
            <p className="font-medium">Rejection reason</p>
            <p>{plan.reason}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
