"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { searchScopedProducts } from "../api/stock-summary.api"
import { stockSummaryKeys } from "../api/inventory-keys"
import type { ScopedProductSearchBy } from "../api/inventory.types"

export function useScopedProducts(
  companyUuid: string,
  distributorUuid: string,
  params: {
    godown?: string
    search?: string
    searchBy?: ScopedProductSearchBy
    page?: number
    size?: number
  },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: stockSummaryKeys.products(companyUuid, distributorUuid, params),
    queryFn: () =>
      searchScopedProducts(companyUuid, distributorUuid, {
        godown: params.godown as string,
        search: params.search,
        searchBy: params.searchBy,
        page: params.page,
        size: params.size,
      }),
    enabled:
      !!companyUuid &&
      !!distributorUuid &&
      !!params.godown &&
      (options?.enabled ?? true),
    staleTime: 30_000,
  })
}

/** Small debounce helper for combobox-driven searches. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
