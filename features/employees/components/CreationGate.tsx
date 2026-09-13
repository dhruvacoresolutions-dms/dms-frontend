"use client"

import * as React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type CreationGateProps = {
  /** When set, children render disabled inside a tooltip explaining why */
  message: string | null
  children: React.ReactNode
}

/**
 * Wraps an action so that, when `message` is set, hovering shows why
 * the action is unavailable. The trigger span keeps hover working
 * around disabled buttons.
 */
export function CreationGate({ message, children }: CreationGateProps) {
  if (!message) return <>{children}</>
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{message}</TooltipContent>
    </Tooltip>
  )
}
