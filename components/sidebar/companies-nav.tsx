"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { CollapsibleNavGroup } from "@/components/sidebar/collapsible-nav-group"
import { companiesNav } from "@/configs/components/sidebar"

export function CompaniesNav() {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <CollapsibleNavGroup label="Platform">
      <SidebarMenu>
        {companiesNav.map((item) => {
          const isActive =
            pathname === item.url || pathname.startsWith(`${item.url}/`)
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isActive}
                render={<Link href={item.url} />}
                onClick={closeMobileSidebar}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </CollapsibleNavGroup>
  )
}
