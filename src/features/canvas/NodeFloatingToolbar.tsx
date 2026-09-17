export function NodeFloatingToolbar({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      className="pointer-events-auto absolute bottom-full left-1/2 z-10 mb-3 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-border bg-background p-1 shadow-lg"
      onPointerDown={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  )
}
