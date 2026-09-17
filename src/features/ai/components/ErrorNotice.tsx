import { CircleAlert, X } from "lucide-react"

import type { AiError } from "../types"

export function ErrorNotice({
  error,
  onDismiss,
}: {
  error: AiError
  onDismiss: () => void
}) {
  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5"
    >
      <div className="flex items-start gap-2">
        <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-medium text-destructive">{error.title}</p>
          {error.hints.length > 0 ? (
            <ul className="space-y-0.5 text-[11px] text-destructive/90">
              {error.hints.map((hint) => (
                <li key={hint}>· {hint}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="关闭错误提示"
          title="关闭"
          onClick={onDismiss}
          className="shrink-0 text-destructive/70 transition-colors hover:text-destructive"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
