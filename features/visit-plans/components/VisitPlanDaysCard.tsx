"use client"

import { UsersRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  formatVisitPlanDate,
  VISIT_PLAN_STATUS_LABELS,
} from "../lib/visit-plan.utils"
import type { VisitPlanDetail } from "../api/visit-plan.types"
import { CustomerNameLabel } from "./CustomerNameLabel"

type VisitPlanDaysCardProps = {
  companyUuid: string
  detail: VisitPlanDetail
}

/** Day-wise customer list with overlap warnings and approver removals. */
export function VisitPlanDaysCard({
  companyUuid,
  detail,
}: VisitPlanDaysCardProps) {
  const days = detail.days?.length
    ? detail.days
    : [
        {
          date: detail.plan.date,
          customers: detail.customers,
        },
      ]

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <UsersRound className="size-4 text-muted-foreground" />
          Planned customers
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {days.map((day) => {
          const active = day.customers.filter(
            (customer) => !customer.removedByApprover
          ).length
          return (
            <div key={day.date} className="rounded-lg border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
                <span className="text-sm font-medium">
                  {formatVisitPlanDate(day.date)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {active} active · {day.customers.length - active} removed
                </span>
              </div>
              {day.customers.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">
                  No customers on this day.
                </p>
              ) : (
                <ul className="divide-y">
                  {day.customers.map((customer) => (
                    <li
                      key={`${day.date}-${customer.customerUuid}`}
                      className="flex flex-wrap items-start justify-between gap-2 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <CustomerNameLabel
                          companyUuid={companyUuid}
                          customerUuid={customer.customerUuid}
                        />
                        {customer.removedByApprover ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Removed by approver
                            {customer.removedNote
                              ? ` — ${customer.removedNote}`
                              : ""}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        {customer.removedByApprover ? (
                          <Badge variant="destructive">Removed</Badge>
                        ) : null}
                        {customer.otherPlans.length > 0 ? (
                          <Badge
                            variant="outline"
                            className="border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300"
                            title={customer.otherPlans
                              .map(
                                (other) =>
                                  `${VISIT_PLAN_STATUS_LABELS[other.status]} · employee ${other.employeeUuid.slice(0, 8)}`
                              )
                              .join("\n")}
                          >
                            {customer.otherPlans.length} overlapping plan
                            {customer.otherPlans.length > 1 ? "s" : ""}
                          </Badge>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
