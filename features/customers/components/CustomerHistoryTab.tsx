"use client"

import { format } from "date-fns"
import { ArrowRight, History } from "lucide-react"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useCustomerHistory } from "../hooks/use-customer-history"

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return format(d, "dd MMM yyyy, hh:mm a")
}

type Props = {
  companyUuid: string
  customerUuid: string
}

export function CustomerHistoryTab({ companyUuid, customerUuid }: Props) {
  const { data, isLoading, error, refetch } = useCustomerHistory(
    companyUuid,
    customerUuid
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-sm">
        <p className="text-muted-foreground">
          {getApiErrorMessage(error, "Failed to load history")}
        </p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  // Newest first for a reverse-chronological audit trail.
  const entries = [...(data ?? [])].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  )

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No lifecycle history"
        description="Lifecycle transitions will appear here once the customer moves through review."
      />
    )
  }

  return (
    <ol className="relative flex flex-col gap-0 border-l pl-6">
      {entries.map((entry, index) => (
        <li key={entry.uuid} className="relative pb-6 last:pb-0">
          <span
            className="absolute -left-[1.9rem] top-1 flex size-3 items-center justify-center rounded-full border-2 border-background bg-primary"
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={entry.from} />
            <ArrowRight className="size-3.5 text-muted-foreground" />
            <StatusBadge status={entry.to} />
            {index === 0 ? (
              <span className="text-xs font-medium text-muted-foreground">
                Latest
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateTime(entry.at)}
            {entry.actor ? (
              <>
                {" · "}
                <span className="font-mono">{entry.actor.slice(0, 8)}</span>
              </>
            ) : null}
          </p>
          {entry.reason ? (
            <p className="mt-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
              {entry.reason}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
