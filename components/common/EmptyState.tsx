import { cn } from "@/lib/utils"

export function EmptyState({
  title = "No results",
  description = "No items found.",
  icon: Icon,
  className,
  children,
}: {
  title?: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground",
        className
      )}
    >
      {Icon && <Icon className="size-8" />}
      <div className="text-center">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs">{description}</p>
      </div>
      {children}
    </div>
  )
}
