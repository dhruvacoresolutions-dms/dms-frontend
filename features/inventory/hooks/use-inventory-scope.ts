"use client"

import { useCallback, useEffect, useState } from "react"

import { useAuthStore } from "@/stores/auth-store"

const storageKey = (companyUuid: string) =>
  `dms.inventory.distributor.${companyUuid}`

/**
 * Resolves which distributor the inventory screens operate on.
 *
 * - `DISTRIBUTOR_USER`: pinned to `session.user.distributorUuid`; no selector.
 * - `COMPANY_USER`: a searchable distributor selector, persisted per company.
 *
 * The distributor UUID is always part of the backend path, so it must never be
 * blank when a data hook fires.
 */
export function useInventoryScope() {
  const session = useAuthStore((state) => state.session)
  const companyUuid = session?.user?.companyUuid ?? ""
  const isDistributorUser =
    session?.user?.actorType === "DISTRIBUTOR_USER"
  const pinnedDistributorUuid = session?.user?.distributorUuid ?? null

  const [selectedDistributorUuid, setSelectedDistributorUuid] = useState<
    string | null
  >(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (isDistributorUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHydrated(true)
      return
    }
    if (!companyUuid) return
    try {
      setSelectedDistributorUuid(localStorage.getItem(storageKey(companyUuid)))
    } catch {
      // localStorage can be unavailable in private mode — fall back to null.
    }
    setHydrated(true)
  }, [companyUuid, isDistributorUser])

  const setDistributorUuid = useCallback(
    (uuid: string | null) => {
      setSelectedDistributorUuid(uuid)
      if (isDistributorUser || !companyUuid) return
      try {
        if (uuid) localStorage.setItem(storageKey(companyUuid), uuid)
        else localStorage.removeItem(storageKey(companyUuid))
      } catch {
        // Persisting the choice is a convenience, never a blocker.
      }
    },
    [companyUuid, isDistributorUser]
  )

  const distributorUuid = isDistributorUser
    ? pinnedDistributorUuid
    : selectedDistributorUuid

  return {
    companyUuid,
    distributorUuid,
    setDistributorUuid,
    isDistributorUser,
    hydrated,
    distributorCode: session?.user?.distributorCode ?? null,
    firmName: session?.user?.firmName ?? null,
  }
}

export type InventoryScope = ReturnType<typeof useInventoryScope>
