"use client"

import {
  CircleCheckBig,
  Clock3,
  RotateCcw,
  UsersRound,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { CustomerLifecycleStatus } from "../api/customer.types"
import type { CustomerLifecycleCounts } from "../hooks/use-customer-lifecycle-counts"

type Kpi = {
  key: "ALL" | CustomerLifecycleStatus
  label: string
  hint: string
  icon: LucideIcon
  iconClass: string
  value: number
}

type Props = {
  counts: CustomerLifecycleCounts
  isLoading?: boolean
}

export function CustomerKpiCards({ counts, isLoading }: Props) {
  const kpis: Kpi[] = [
    {
      key: "ALL",
      label: "Total customers",
      hint: "All lifecycle states",
      icon: UsersRound,
      iconClass:
        "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
      value: counts.total,
    },
    {
      key: "ACTIVE",
      label: "Active",
      hint: "Serving outlets",
      icon: CircleCheckBig,
      iconClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
      value: counts.active,
    },
    {
      key: "SUBMITTED",
      label: "Awaiting approval",
      hint: "Submitted for approval",
      icon: Clock3,
      iconClass:
        "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
      value: counts.submitted,
    },
    {
      key: "REWORK",
      label: "In rework",
      hint: "Returned to owner",
      icon: RotateCcw,
      iconClass:
        "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
      value: counts.rework,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <Card
          key={kpi.key}
          size="sm"
          title={kpi.hint}
          className="h-full"
          aria-label={`${kpi.label}: ${kpi.value}`}
        >
          <CardContent className="flex items-center gap-2.5">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-md ${kpi.iconClass}`}
            >
              <kpi.icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              {isLoading ? (
                <Skeleton className="h-5 w-10" />
              ) : (
                <p className="text-lg font-semibold leading-none tabular-nums">
                  {kpi.value.toLocaleString()}
                </p>
              )}
              <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                {kpi.label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
