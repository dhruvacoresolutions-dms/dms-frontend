"use client"

import * as React from "react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavGroups } from "@/components/sidebar/nav-groups"
import { CompaniesNav } from "@/components/sidebar/companies-nav"
import { Sidebar, SidebarContent, useSidebar } from "@/components/ui/sidebar"
import { mainNav, navGroups } from "@/configs/components/sidebar"
import { useFilteredMainNav, useFilteredNavGroups } from "@/hooks/use-filtered-nav"
import { useAuthStore } from "@/stores/auth-store"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isPlatformAdmin = useAuthStore(
    (s) => s.session?.user?.roles.includes("PLATFORM_ADMINISTRATOR") ?? false
  )
  const filteredNav = useFilteredMainNav(mainNav)
  const filteredGroups = useFilteredNavGroups(navGroups)
  const { state, isMobile, setOpen } = useSidebar()

  // Hover-to-expand when collapsed to icon mode (desktop only).
  // Opening waits briefly (hover intent) so grazing the edge doesn't
  // trigger it; collapse has a short grace delay so moving across the
  // edge doesn't flicker. These land on the sidebar container via props.
  const hoverExpanded = React.useRef(false)
  const enterTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(
    () => () => {
      if (enterTimer.current) clearTimeout(enterTimer.current)
      if (leaveTimer.current) clearTimeout(leaveTimer.current)
    },
    []
  )

  const handleMouseEnter = () => {
    if (isMobile || state !== "collapsed") return
    if (hoverExpanded.current || enterTimer.current) return
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current)
      leaveTimer.current = null
    }
    enterTimer.current = setTimeout(() => {
      enterTimer.current = null
      hoverExpanded.current = true
      setOpen(true)
    }, 150)
  }

  const handleMouseLeave = () => {
    if (enterTimer.current) {
      clearTimeout(enterTimer.current)
      enterTimer.current = null
    }
    if (isMobile || !hoverExpanded.current) return
    if (leaveTimer.current) return
    leaveTimer.current = setTimeout(() => {
      leaveTimer.current = null
      hoverExpanded.current = false
      setOpen(false)
    }, 150)
  }

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
      collapsible={"icon"}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarContent>
        {isPlatformAdmin && <CompaniesNav />}
        {!isPlatformAdmin && (
          <>
            <NavMain items={filteredNav} />
            <NavGroups groups={filteredGroups} />
          </>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
