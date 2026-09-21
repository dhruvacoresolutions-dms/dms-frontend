import type { LucideIcon } from "lucide-react"

export type SidebarNavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: SidebarNavItem[]
  /**
   * Single permission code required to see this item (e.g. `USER_VIEW`).
   * Dot form (`USER.VIEW`) also works. Omit for always-visible items.
   */
  permission?: string
  /** Multiple codes; ANY passes unless `requireAll` is true. */
  permissions?: string[]
  requireAll?: boolean
}

export type MainNav = SidebarNavItem[]

export type NavGroup = {
  label: string
  icon?: LucideIcon
  items: SidebarNavItem[]
}
