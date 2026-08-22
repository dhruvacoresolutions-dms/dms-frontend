"use client"

import { useHealth } from "@/hooks/use-health"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function ServerStatus() {
  const { data, isFetching, isError } = useHealth()

  const isUp = !isError && data?.status === "UP"

  return (
    <Tooltip>
      <TooltipTrigger
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground outline-none hover:bg-muted"
        aria-label="API server status"
      >
        <span
          className={cn(
            "size-2 rounded-full",
            isUp && "bg-emerald-500",
            !isUp && "bg-destructive",
            isFetching && "animate-pulse"
          )}
        />
      </TooltipTrigger>
      <TooltipContent>
        {isUp
          ? `Backend reachable: ${data.status}`
          : `Backend unreachable at ${process.env.NEXT_PUBLIC_API_URL}`}
      </TooltipContent>
    </Tooltip>
  )
}
