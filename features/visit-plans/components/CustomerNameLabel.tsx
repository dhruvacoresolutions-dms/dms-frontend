"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { useCustomer } from "@/features/customers/hooks/use-customer"

type CustomerNameLabelProps = {
  companyUuid: string
  customerUuid: string
}

/** Cached customer shop-name lookup for plan customers (API returns uuids). */
export function CustomerNameLabel({
  companyUuid,
  customerUuid,
}: CustomerNameLabelProps) {
  const { data, isLoading } = useCustomer(companyUuid, customerUuid)

  if (isLoading) {
    return (
      <span className="inline-flex items-center" aria-busy="true">
        <span className="sr-only">Loading customer</span>
        <Skeleton className="h-4 w-32" />
      </span>
    )
  }
  if (!data) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate font-medium">{data.shopName || "—"}</span>
      {data.customerCode ? (
        <span className="truncate font-mono text-xs text-muted-foreground">
          {data.customerCode}
        </span>
      ) : null}
    </span>
  )
}
