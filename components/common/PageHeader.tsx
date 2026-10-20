"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
  backHref?: string
  backLabel?: string
  className?: string
  children?: ReactNode
}

export function PageHeader({
  title,
  description,
  action,
  backHref,
  backLabel = "Back",
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {children}
          {action}
        </div>
      </div>
    </div>
  )
}
