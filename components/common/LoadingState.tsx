import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function LoadingState({
  className,
  message = "Loading...",
}: {
  className?: string
  message?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground",
        className
      )}
    >
      <Loader2 className="size-6 animate-spin" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6 space-y-3">
      <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
      <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
      <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
    </div>
  )
}
