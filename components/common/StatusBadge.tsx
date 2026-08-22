import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusVariants: Record<string, string> = {
  ACTIVE:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
  INACTIVE:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  PENDING:
    "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
}

export function StatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const variant = statusVariants[status.toUpperCase()] ?? ""

  return (
    <Badge variant="outline" className={cn("capitalize", variant, className)}>
      {status.toLowerCase()}
    </Badge>
  )
}
