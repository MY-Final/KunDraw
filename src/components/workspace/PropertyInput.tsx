import { useEffect, useRef } from "react"

const CONTROL_CLASS =
  "w-full bg-transparent text-right text-xs text-foreground/80 tabular-nums outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"

const MIXED_PLACEHOLDER = "混合"

function CommitInput({
  display,
  onCommit,
  onConfirm,
  placeholder,
  disabled,
  inputMode = "text",
  ariaLabel,
}: {
  display: string
  onCommit: (raw: string) => boolean
  onConfirm?: () => void
  placeholder?: string
  disabled?: boolean
  inputMode?: "text" | "decimal"
  ariaLabel: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const focused = useRef(false)
  const skipBlurCommit = useRef(false)

  // The input owns the in-progress text; React only re-syncs it from the editor
  // while the field is not being edited, so typing is never clobbered.
  useEffect(() => {
    const input = inputRef.current
    if (!input || focused.current) return
    if (input.value !== display) input.value = display
  })

  const commit = () => {
    const input = inputRef.current
    if (!input) return
    const raw = input.value
    if (raw === display) return
    if (!onCommit(raw)) input.value = display
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={inputMode}
      aria-label={ariaLabel}
      disabled={disabled}
      placeholder={placeholder}
      defaultValue={display}
      spellCheck={false}
      autoComplete="off"
      className={CONTROL_CLASS}
      onFocus={() => {
        focused.current = true
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault()
          commit()
          skipBlurCommit.current = true
          event.currentTarget.blur()
          onConfirm?.()
          return
        }
        if (event.key === "Escape") {
          event.preventDefault()
          event.currentTarget.value = display
          skipBlurCommit.current = true
          event.currentTarget.blur()
        }
      }}
      onBlur={() => {
        focused.current = false
        if (skipBlurCommit.current) {
          skipBlurCommit.current = false
          return
        }
        commit()
      }}
    />
  )
}

function NumberInput({
  value,
  onCommit,
  onConfirm,
  min,
  max,
  disabled,
  ariaLabel,
}: {
  value: number | null
  onCommit: (value: number) => void
  onConfirm?: () => void
  min?: number
  max?: number
  disabled?: boolean
  ariaLabel: string
}) {
  const display = value === null ? "" : String(Number(value.toFixed(2)))

  return (
    <CommitInput
      display={display}
      placeholder={MIXED_PLACEHOLDER}
      disabled={disabled}
      inputMode="decimal"
      ariaLabel={ariaLabel}
      onConfirm={onConfirm}
      onCommit={(raw) => {
        const parsed = Number.parseFloat(raw.trim())
        if (!Number.isFinite(parsed)) return false
        let next = parsed
        if (min !== undefined) next = Math.max(min, next)
        if (max !== undefined) next = Math.min(max, next)
        onCommit(next)
        return true
      }}
    />
  )
}

function TextField({
  value,
  onCommit,
  onConfirm,
  placeholder,
  disabled,
  ariaLabel,
}: {
  value: string | null
  onCommit: (value: string) => void
  onConfirm?: () => void
  placeholder?: string
  disabled?: boolean
  ariaLabel: string
}) {
  const display = value ?? ""

  return (
    <CommitInput
      display={display}
      placeholder={placeholder ?? MIXED_PLACEHOLDER}
      disabled={disabled}
      ariaLabel={ariaLabel}
      onConfirm={onConfirm}
      onCommit={(raw) => {
        const next = raw.trim()
        if (next === display) return false
        onCommit(next)
        return true
      }}
    />
  )
}

export { CONTROL_CLASS, CommitInput, MIXED_PLACEHOLDER, NumberInput, TextField }
