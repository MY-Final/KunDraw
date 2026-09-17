import type { ReactNode } from "react"
import { cn } from "cn"

export function AiField({
  label,
  action,
  children,
  className,
}: {
  label: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground/80">{label}</span>
        {action}
      </div>
      {children}
    </section>
  )
}

export const aiInputClass =
  "h-8 rounded-md border-input bg-transparent px-2 text-xs shadow-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
