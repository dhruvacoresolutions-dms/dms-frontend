"use client"

import { useState } from "react"
import { ChevronDown, UsersRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  COVERAGE_WEEKDAYS,
  COVERAGE_WEEKDAY_LABELS,
  coverageLineCustomers,
} from "../lib/coverage-plan.utils"
import type { CoveragePlan, CoverageWeekday } from "../api/coverage-plan.types"
import { CoverageCustomerName } from "./CoverageCustomerName"

type CoverageWeekTemplateCardProps = {
  companyUuid: string
  plan: CoveragePlan
}

const PAGE_SIZE = 20

function WeekdayRow({
  companyUuid,
  weekday,
  customerUuids,
}: {
  companyUuid: string
  weekday: CoverageWeekday
  customerUuids: string[]
}) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const count = customerUuids.length
  const shown = customerUuids.slice(0, visible)
  const remaining = count - shown.length

  return (
    <div
      className={cn(
        "rounded-xl border",
        count === 0 && "border-dashed bg-muted/10"
      )}
    >
      <div className="flex flex-wrap items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">
              {COVERAGE_WEEKDAY_LABELS[weekday]}
            </span>
            {count > 0 ? (
              <Badge variant="secondary">
                {count} customer{count === 1 ? "" : "s"}
              </Badge>
            ) : (
              <Badge variant="outline">Not covered</Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {count > 0
              ? "Covered every week on this weekday unless the date is skipped."
              : "No customers are assigned to this weekday."}
          </p>
        </div>

        {count > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls={`coverage-detail-${weekday}`}
          >
            {open ? "Hide customers" : "Show customers"}
            <ChevronDown
              className={cn(
                "ml-1 size-4 transition-transform",
                open && "rotate-180"
              )}
            />
          </Button>
        ) : null}
      </div>

      {count > 0 && open ? (
        <div
          id={`coverage-detail-${weekday}`}
          className="max-h-80 overflow-y-auto border-t bg-muted/10"
        >
          <ul className="divide-y">
            {shown.map((customerUuid) => (
              <li key={customerUuid} className="px-3 py-2">
                <CoverageCustomerName
                  companyUuid={companyUuid}
                  customerUuid={customerUuid}
                />
              </li>
            ))}
          </ul>
          {remaining > 0 ? (
            <div className="border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setVisible((current) => current + PAGE_SIZE)}
              >
                Show {Math.min(remaining, PAGE_SIZE)} more of {count}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** Expandable Monday–Saturday customer template. */
export function CoverageWeekTemplateCard({
  companyUuid,
  plan,
}: CoverageWeekTemplateCardProps) {
  const total = plan.lines.reduce(
    (sum, line) => sum + line.customerUuids.length,
    0
  )

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="size-4 text-muted-foreground" />
            Weekly template
          </CardTitle>
          <Badge variant="outline">
            {total} assignment{total === 1 ? "" : "s"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {COVERAGE_WEEKDAYS.map((weekday) => (
          <WeekdayRow
            key={weekday}
            companyUuid={companyUuid}
            weekday={weekday}
            customerUuids={coverageLineCustomers(plan, weekday)}
          />
        ))}
      </CardContent>
    </Card>
  )
}
