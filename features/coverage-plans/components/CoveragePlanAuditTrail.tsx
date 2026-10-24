"use client"

import {
  Ban,
  CheckCircle2,
  History,
  Pencil,
  Plus,
  RotateCcw,
  Undo2,
  XCircle,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EMPTY_VALUE, formatReference } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  COVERAGE_AUDIT_ACTION_LABELS,
  formatCoverageDateTime,
} from "../lib/coverage-plan.utils"
import type {
  CoverageAuditAction,
  CoverageAuditEvent,
} from "../api/coverage-plan.types"

const ACTION_ICONS: Record<CoverageAuditAction, typeof Plus> = {
  CREATE: Plus,
  EDIT: Pencil,
  RESUBMIT: RotateCcw,
  WITHDRAW: Undo2,
  APPROVE: CheckCircle2,
  REJECT: XCircle,
  CANCEL: Ban,
}

const ACTION_ICON_CLASSES: Record<CoverageAuditAction, string> = {
  CREATE:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  EDIT: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  RESUBMIT:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300",
  WITHDRAW:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  APPROVE:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  REJECT:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  CANCEL:
    "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300",
}

type CoveragePlanAuditTrailProps = {
  events: CoverageAuditEvent[]
}

/**
 * Human-readable audit history.
 *
 * `oldSummary`/`newSummary` are Java record dumps and are intentionally never
 * rendered: they are large, unlocalized and not meaningful to end users.
 */
export function CoveragePlanAuditTrail({
  events,
}: CoveragePlanAuditTrailProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" />
          Audit history
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No audit entries yet.
          </p>
        ) : (
          <ol className="flex flex-col">
            {events.map((event, index) => {
              const Icon = ACTION_ICONS[event.action] ?? History
              return (
                <li
                  key={`${event.action}-${event.at}-${index}`}
                  className="relative flex gap-3 pb-5 last:pb-0"
                >
                  {index < events.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="absolute top-8 bottom-0 left-4 w-px bg-border"
                    />
                  ) : null}
                  <span
                    className={cn(
                      "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border",
                      ACTION_ICON_CLASSES[event.action]
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium">
                      {COVERAGE_AUDIT_ACTION_LABELS[event.action] ??
                        event.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCoverageDateTime(event.at)}
                      {formatReference(event.actor) !== EMPTY_VALUE ? (
                        <>
                          {" · "}
                          <span>{formatReference(event.actor)}</span>
                        </>
                      ) : null}
                    </p>
                    {event.reason ? (
                      <p className="mt-1.5 rounded-md bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
                        {event.reason}
                      </p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
