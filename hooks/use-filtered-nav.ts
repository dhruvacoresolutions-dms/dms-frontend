"use client"

import { useMemo } from "react"

import { useAccessStore } from "@/stores/access-store"
import {
  createPermissionChecker,
  filterNavGroups,
  filterNavItems,
} from "@/lib/permissions/nav-filter"
import type { MainNav, NavGroup } from "@/types/components/sidebar"

/**
 * Permission-filtered navigation. Inaccessible items are hidden (never
 * disabled placeholders); emptied parents/groups are pruned.
 *
 * - While access is loading: returns `[]` (AppBootstrap holds the shell
 *   behind a loader, so this is transient and flicker-free).
 * - When the access fetch failed: returns the input unfiltered (fail open;
 *   backend APIs still enforce authorization).
 *
 * Inputs are module-level static configs (stable refs) — memo is cheap.
 */
export function useFilteredMainNav(items: MainNav): MainNav {
  const permissionsSet = useAccessStore((state) => state.permissionsSet)
  const accessStatus = useAccessStore((state) => state.accessStatus)

  return useMemo(() => {
    if (accessStatus === "error") return items
    if (accessStatus !== "loaded") return []
    return filterNavItems(items, createPermissionChecker(permissionsSet))
  }, [items, permissionsSet, accessStatus])
}

export function useFilteredNavGroups(groups: NavGroup[]): NavGroup[] {
  const permissionsSet = useAccessStore((state) => state.permissionsSet)
  const accessStatus = useAccessStore((state) => state.accessStatus)

  return useMemo(() => {
    if (accessStatus === "error") return groups
    if (accessStatus !== "loaded") return []
    return filterNavGroups(groups, createPermissionChecker(permissionsSet))
  }, [groups, permissionsSet, accessStatus])
}
