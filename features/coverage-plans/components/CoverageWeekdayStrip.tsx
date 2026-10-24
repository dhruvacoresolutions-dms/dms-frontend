"use client"

import { cn } from "@/lib/utils"
import {
  COVERAGE_WEEKDAY_SHORT_LABELS,
  COVERAGE_WEEKDAYS,
  coverageWeekdayCounts,
} from "../lib/coverage-plan.utils"
import type { CoveragePlan } from "../api/coverage-plan.types"

type CoverageWeekdayStripProps = {
  plan: Pick<CoveragePlan, "lines">
  variant?: "compact" | "detailed"
  className?: string
}

/**
 * Six coverage weekdays plus Sunday (never a coverage day). Compact mode is
 * used in table rows; detailed mode is used in the detail summary.
 */
export function CoverageWeekdayStrip({
  plan,
  variant = "compact",
  className,
}: CoverageWeekdayStripProps) {
  const counts = coverageWeekdayCounts(plan)
  const active = COVERAGE_WEEKDAYS.filter((weekday) => counts[weekday] > 0)
  const label = active.length
    ? active
        .map(
          (weekday) =>
            `${COVERAGE_WEEKDAY_SHORT_LABELS[weekday]} ${counts[weekday]}`
        )
        .join(", ")
    : "No coverage weekdays"

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1", className)} title={label}>
        {COVERAGE_WEEKDAYS.map((weekday) => {
          const count = counts[weekday]
          return (
            <span
              key={weekday}
              className={cn(
                "inline-flex size-6 items-center justify-center rounded-md border text-[10px] font-semibold uppercase",
                count > 0
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-muted/40 text-muted-foreground/60"
              )}
              aria-label={`${COVERAGE_WEEKDAY_SHORT_LABELS[weekday]}: ${count} customers`}
            >
              {COVERAGE_WEEKDAY_SHORT_LABELS[weekday].slice(0, 2)}
            </span>
          )
        })}
        <span className="ml-1 text-xs text-muted-foreground">
          {active.length}/6
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn("grid grid-cols-4 gap-2 sm:grid-cols-7", className)}
      aria-label="Weekly coverage"
    >
      {COVERAGE_WEEKDAYS.map((weekday) => {
        const count = counts[weekday]
        return (
          <div
            key={weekday}
            className={cn(
              "rounded-lg border p-2 text-center",
              count > 0
                ? "border-primary/25 bg-primary/5"
                : "border-border bg-muted/20"
            )}
          >
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {COVERAGE_WEEKDAY_SHORT_LABELS[weekday]}
            </p>
            <p
              className={cn(
                "mt-0.5 text-sm font-semibold",
                count === 0 && "text-muted-foreground"
              )}
            >
              {count > 0 ? count : "—"}
            </p>
          </div>
        )
      })}
      <div className="rounded-lg border border-dashed bg-muted/10 p-2 text-center">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Sun
        </p>
        <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
          Off
        </p>
      </div>
    </div>
  )
}
