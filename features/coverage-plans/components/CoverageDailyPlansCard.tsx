"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, CalendarDays } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/common/EmptyState"
import { StatusBadge } from "@/components/common/StatusBadge"
import { usePermission } from "@/hooks/use-permission"
import { formatCoverageDate } from "../lib/coverage-plan.utils"
import type { CoverageDailyPlan } from "../api/coverage-plan.types"

type CoverageDailyPlansCardProps = {
  dailyPlans: CoverageDailyPlan[]
}

const PAGE_SIZE = 12

/**
 * Visit plans generated from the template. The coverage service returns the
 * full set in the detail payload ordered by date.
 */
export function CoverageDailyPlansCard({
  dailyPlans,
}: CoverageDailyPlansCardProps) {
  const { can } = usePermission()
  const canViewVisitPlans = can("VISIT_PLAN", "VIEW")
  const [visible, setVisible] = useState(PAGE_SIZE)
  const ordered = useMemo(
    () => [...dailyPlans].sort((a, b) => a.date.localeCompare(b.date)),
    [dailyPlans]
  )
  const shown = ordered.slice(0, visible)
  const remaining = ordered.length - shown.length

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            Generated visit plans
          </CardTitle>
          <Badge variant="outline">{dailyPlans.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {dailyPlans.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No visit plans generated yet"
            description="Visit plans appear here after the coverage plan is approved. Holidays, weekly offs and dates with a manual plan are skipped."
            className="py-8"
          />
        ) : (
          <ul className="divide-y">
            {shown.map((daily) => (
              <li
                key={daily.uuid}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {formatCoverageDate(daily.date)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Generated visit plan
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={daily.status} />
                  {daily.started ? (
                    <Badge variant="secondary">Execution started</Badge>
                  ) : null}
                  {daily.manuallyModified ? (
                    <Badge variant="outline">Manually modified</Badge>
                  ) : null}
                  {canViewVisitPlans ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/visit-plans/${daily.uuid}`} />}
                    >
                      Open
                      <ArrowUpRight className="ml-1 size-3.5" />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        {ordered.length > PAGE_SIZE ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Showing {shown.length} of {ordered.length} generated day
              {ordered.length === 1 ? "" : "s"}.
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
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground">
          When a coverage plan is cancelled, future generated plans that have
          not started are removed. Past or started plans are kept.
        </p>
      </CardContent>
    </Card>
  )
}
