import type { ReactNode } from "react"
import { cn } from "cn"

function PropertySection({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className="border-b border-border px-3 py-3">
      <h3 className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <div className={cn("grid grid-cols-2 gap-2", className)}>{children}</div>
    </section>
  )
}

function PropertyRow({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 transition-colors focus-within:border-ring/60",
        className
      )}
    >
      <span className="shrink-0 text-[11px] text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
      {hint ? (
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </div>
  )
}

function PropertyStack({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function PropertyText({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <PropertyRow label={label} className={className}>
      <span className="block truncate text-right text-xs text-foreground/80">
        {value}
      </span>
    </PropertyRow>
  )
}

export { PropertyRow, PropertySection, PropertyStack, PropertyText }
