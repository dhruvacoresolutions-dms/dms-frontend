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
import { cn } from "@/lib/utils"
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
  activeKey: "ALL" | CustomerLifecycleStatus
  onSelect: (key: "ALL" | CustomerLifecycleStatus) => void
}

export function CustomerKpiCards({
  counts,
  isLoading,
  activeKey,
  onSelect,
}: Props) {
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
      label: "Awaiting verification",
      hint: "Submitted, not verified",
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const isActive = activeKey === kpi.key
        return (
          <button
            key={kpi.key}
            type="button"
            onClick={() => onSelect(kpi.key)}
            className="cursor-pointer text-left"
            aria-pressed={isActive}
          >
            <Card
              className={cn(
                "h-full transition-colors hover:border-foreground/25",
                isActive && "border-primary/60 ring-1 ring-primary/30"
              )}
            >
              <CardContent className="flex items-center gap-3 py-4">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    kpi.iconClass
                  )}
                >
                  <kpi.icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  {isLoading ? (
                    <Skeleton className="h-7 w-12" />
                  ) : (
                    <p className="text-2xl font-semibold leading-none tabular-nums">
                      {kpi.value.toLocaleString()}
                    </p>
                  )}
                  <p className="mt-1 truncate text-sm font-medium">
                    {kpi.label}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {kpi.hint}
                  </p>
                </div>
              </CardContent>
            </Card>
          </button>
        )
      })}
    </div>
  )
}
