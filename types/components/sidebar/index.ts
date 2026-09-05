import type { LucideIcon } from "lucide-react"

export type SidebarNavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: SidebarNavItem[]
}

export type MainNav = SidebarNavItem[]

export type NavGroup = {
  label: string
  icon?: LucideIcon
  items: SidebarNavItem[]
}
