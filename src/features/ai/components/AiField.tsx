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

/** Shared compact control styling for the AI panel's inputs and triggers. */
export const controlClass =
  "flex h-8 w-full items-center rounded-md border border-input bg-transparent px-2 text-xs text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
