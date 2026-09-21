/**
 * Pure sidebar/nav filtering by permission. No React here — the hook lives in
 * `hooks/use-filtered-nav.ts`.
 *
 * Rules:
 * - Items without any requirement are always kept (current behavior).
 * - Leaf items with unmet requirements are dropped (hidden, not disabled).
 * - Parent items are kept only while at least one visible child remains
 *   (parents use dummy urls like `/organization`, not real pages).
 * - Groups with zero visible items are dropped by `filterNavGroups`.
 */
import {
  createPermissionChecker,
  type PermissionChecker,
  type RequiredPermission,
} from "./checker"

export type NavRequirement = {
  permission?: string
  permissions?: readonly RequiredPermission[]
  requireAll?: boolean
}

export function isNavItemAllowed<T extends NavRequirement>(
  item: T,
  checker: PermissionChecker
): boolean {
  if (item.permission) return checker.has(item.permission)
  if (item.permissions && item.permissions.length > 0) {
    return item.requireAll
      ? checker.canAll(item.permissions)
      : checker.canAny(item.permissions)
  }
  return true
}

export function filterNavItems<T extends NavRequirement>(
  items: readonly T[],
  checker: PermissionChecker
): T[] {
  const visible: T[] = []
  for (const item of items) {
    const children = (item as { items?: readonly T[] }).items
    if (children && children.length > 0) {
      const kept = filterNavItems(children, checker)
      if (kept.length > 0) {
        visible.push({ ...item, items: kept })
      }
    } else if (isNavItemAllowed(item, checker)) {
      visible.push(item)
    }
  }
  return visible
}

export function filterNavGroups<G extends { items: readonly unknown[] }>(
  groups: readonly G[],
  checker: PermissionChecker
): G[] {
  const visible: G[] = []
  for (const group of groups) {
    const items = filterNavItems(
      group.items as unknown as NavRequirement[],
      checker
    )
    if (items.length > 0) {
      visible.push({ ...group, items } as G)
    }
  }
  return visible
}

export { createPermissionChecker }
