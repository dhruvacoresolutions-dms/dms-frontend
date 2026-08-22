"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react"
import { navLabelByUrl } from "@/configs/components/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb"

const formatSegment = (segment: string) =>
  segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

const getLabel = (path: string) => {
  const exact = navLabelByUrl.get(path)
  if (exact) return exact

  const lastSegment = path.split("/").filter(Boolean).pop()
  if (lastSegment) {
    const bySlug = navLabelByUrl.get(`/${lastSegment.toLowerCase()}`)
    if (bySlug) return bySlug
    return formatSegment(lastSegment)
  }

  return navLabelByUrl.get("/") ?? "Home"
}

export function SidebarBreadcrumbs() {
  const pathname = usePathname()

  const segments = pathname.split("/").filter(Boolean)

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    return {
      label: getLabel(href),
      href,
      isCurrent: index === segments.length - 1,
    }
  })

  return (
    <Breadcrumb className="hidden sm:block">
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <React.Fragment key={`${index}-${crumb.href}`}>
            <BreadcrumbItem>
              {crumb.isCurrent ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  render={<Link href={crumb.href} />}
                  href={crumb.href}
                >
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!crumb.isCurrent && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
