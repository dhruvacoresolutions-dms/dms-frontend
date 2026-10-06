import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { GeographyType } from "../api/geography.types"

const typeVariants: Record<GeographyType, string> = {
  COUNTRY:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300",
  ZONE: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  STATE:
    "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
  REGION:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  TERRITORY:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  BEAT: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300",
}

export function GeographyTypeBadge({
  type,
  className,
}: {
  type: GeographyType
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn(typeVariants[type] ?? "", className)}>
      {type}
    </Badge>
  )
}
