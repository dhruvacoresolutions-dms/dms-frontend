"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { PERMISSIONS } from "@/lib/permissions"
import { usePermission } from "@/hooks/use-permission"

const CALENDAR_SECTIONS = [
  {
    title: "Fiscal Years",
    href: "/company-calendar/fiscal-years",
    permissions: [PERMISSIONS.COMPANY_CALENDAR.VIEW],
  },
  {
    title: "Holidays",
    href: "/company-calendar/holidays",
    permissions: [PERMISSIONS.COMPANY_CALENDAR.VIEW],
  },
  {
    title: "Weekly Off",
    href: "/company-calendar/weekly-off",
    permissions: [PERMISSIONS.COMPANY_CALENDAR.VIEW],
  },
  {
    title: "Effective Calendar",
    href: "/company-calendar/effective",
    permissions: [PERMISSIONS.COMPANY_CALENDAR.VIEW],
  },
  {
    title: "Settings",
    href: "/company-calendar/settings",
    permissions: [PERMISSIONS.VISIT_RADIUS.VIEW, PERMISSIONS.CLAIM_POLICY.VIEW],
  },
] as const

/**
 * Route-based sub-navigation shared by every company-calendar page.
 * Sections the user cannot access are hidden (never disabled placeholders).
 */
export function CalendarSectionNav() {
  const pathname = usePathname()
  const { canAny, isLoaded } = usePermission()

  const sections = CALENDAR_SECTIONS.filter(
    (section) => !isLoaded || canAny(section.permissions)
  )

  return (
    <nav
      aria-label="Company calendar sections"
      className="flex w-fit max-w-full flex-wrap items-center gap-1 rounded-lg bg-muted p-1"
    >
      {sections.map((section) => {
        const active =
          pathname === section.href || pathname.startsWith(`${section.href}/`)
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {section.title}
          </Link>
        )
      })}
    </nav>
  )
}
