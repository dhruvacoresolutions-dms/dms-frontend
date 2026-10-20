"use client"

import * as React from "react"
import { ChevronRightIcon, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type CollapsibleNavGroupProps = {
  /** Section heading rendered as the collapse trigger. */
  label: string
  icon?: LucideIcon
  defaultOpen?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Sidebar section header + menu that can be collapsed by clicking the label.
 * The section is forced open while the sidebar is in icon mode so the
 * icon-only nav never disappears when a group was collapsed beforehand.
 */
export function CollapsibleNavGroup({
  label,
  icon: Icon,
  defaultOpen = true,
  className,
  children,
}: CollapsibleNavGroupProps) {
  const { state, isMobile } = useSidebar()
  const iconMode = !isMobile && state === "collapsed"
  const [open, setOpen] = React.useState(defaultOpen)
  const expanded = iconMode || open

  return (
    <Collapsible
      open={expanded}
      onOpenChange={(next) => {
        if (!iconMode) setOpen(next)
      }}
      render={<SidebarGroup className={cn("pt-2", className)} />}
    >
      <SidebarGroupLabel
        render={<CollapsibleTrigger />}
        className="mb-2 w-full cursor-pointer rounded-none border-b border-sidebar-border/60 pb-2 font-extrabold tracking-widest text-sidebar-foreground/70 uppercase transition-colors select-none hover:text-sidebar-foreground [&>svg]:text-sidebar-foreground/70"
      >
        {Icon ? <Icon className="size-3.5" /> : null}
        <span>{label}</span>
        <ChevronRightIcon
          aria-hidden="true"
          className={cn(
            "ml-auto size-3.5 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            expanded && "rotate-90"
          )}
        />
      </SidebarGroupLabel>
      <CollapsibleContent className="flex h-[var(--collapsible-panel-height)] flex-col justify-end overflow-hidden transition-[height] duration-300 ease-[ease-out] data-ending-style:h-0 data-starting-style:h-0 [&[hidden]:not([hidden='until-found'])]:hidden">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
