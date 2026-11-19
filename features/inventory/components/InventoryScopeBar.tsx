"use client"

import { Store, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { DistributorCombobox } from "@/features/distributors/components/DistributorCombobox"
import type { InventoryScope } from "../hooks/use-inventory-scope"

type Props = {
  scope: InventoryScope
  className?: string
}

/**
 * Distributor context for every inventory screen. Company users pick a
 * distributor; distributor administrators are pinned to their own scope.
 */
export function InventoryScopeBar({ scope, className }: Props) {
  if (scope.isDistributorUser) {
    return (
      <div
        className={`flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm ${className ?? ""}`}
      >
        <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-muted-foreground">Distributor scope</span>
        <span className="font-medium">
          {scope.firmName ?? "Your distributor"}
        </span>
        {scope.distributorCode ? (
          <Badge variant="outline" className="font-mono text-xs">
            {scope.distributorCode}
          </Badge>
        ) : null}
        <span className="text-xs text-muted-foreground">
          Pinned to your login — this cannot be changed.
        </span>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border bg-muted/20 px-3 py-2 sm:flex-row sm:items-center ${className ?? ""}`}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Store className="size-4" aria-hidden="true" />
        <span className="font-medium text-foreground">Distributor</span>
      </div>
      <div className="w-full sm:max-w-sm">
        <DistributorCombobox
          companyUuid={scope.companyUuid}
          value={scope.distributorUuid}
          onValueChange={(value) => scope.setDistributorUuid(value)}
          placeholder="Select distributor..."
        />
      </div>
      <p className="text-xs text-muted-foreground sm:ml-auto">
        Inventory data is scoped to the selected distributor.
      </p>
    </div>
  )
}
