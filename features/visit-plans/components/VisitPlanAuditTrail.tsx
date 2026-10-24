"use client"

import { History } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatReference } from "@/lib/format"
import { formatVisitPlanDateTime } from "../lib/visit-plan.utils"
import type { VisitPlanAuditEvent } from "../api/visit-plan.types"

type VisitPlanAuditTrailProps = {
  events: VisitPlanAuditEvent[]
}

const ACTION_LABELS: Record<VisitPlanAuditEvent["action"], string> = {
  CREATE: "Created",
  EDIT: "Edited",
  RESUBMIT: "Resubmitted",
  WITHDRAW: "Withdrawn",
  APPROVE: "Approved",
  REJECT: "Rejected",
}

/** Oldest-first audit timeline returned by `GET /visit-plans/{uuid}`. */
export function VisitPlanAuditTrail({ events }: VisitPlanAuditTrailProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="size-4 text-muted-foreground" />
          Audit history
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No audit events recorded.
          </p>
        ) : (
          <ol className="flex flex-col gap-4">
            {events.map((event, index) => (
              <li
                key={`${event.action}-${event.at}-${index}`}
                className="flex gap-3"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {ACTION_LABELS[event.action]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatVisitPlanDateTime(event.at)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Actor: <span>{formatReference(event.actor)}</span>
                  </p>
                  {event.reason ? (
                    <p className="mt-1 text-sm">
                      <span className="font-medium">Reason:</span>{" "}
                      {event.reason}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
