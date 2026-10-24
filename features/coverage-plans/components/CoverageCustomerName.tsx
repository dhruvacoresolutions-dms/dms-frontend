"use client"

import { useCustomer } from "@/features/customers/hooks/use-customer"

type CoverageCustomerNameProps = {
  companyUuid: string
  customerUuid: string
  /** Show the customer code under the shop name (default `true`). */
  showCode?: boolean
}

/**
 * Cached customer-name lookup for coverage lines, which the API returns as
 * UUIDs only. Used inside selected chips and expanded weekday rows.
 */
export function CoverageCustomerName({
  companyUuid,
  customerUuid,
  showCode = true,
}: CoverageCustomerNameProps) {
  const { data, isLoading } = useCustomer(companyUuid, customerUuid)

  if (isLoading) {
    return (
      <span className="inline-flex items-center" aria-busy="true">
        <span className="sr-only">Loading customer</span>
        <span className="h-3 w-24 animate-pulse rounded bg-muted" />
      </span>
    )
  }

  if (!data) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  if (!showCode) {
    return <span className="truncate">{data.shopName || "—"}</span>
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
