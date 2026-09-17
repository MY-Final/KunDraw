import type { ReactNode } from "react"
import { cn } from "cn"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type Choice<T extends string> = {
  value: T
  label: string
  icon?: ReactNode
}

const ITEM_CLASS =
  "gap-1.5 rounded-md text-xs font-normal text-muted-foreground aria-pressed:border-brand aria-pressed:bg-brand-subtle aria-pressed:text-brand aria-pressed:hover:bg-brand-subtle aria-pressed:hover:text-brand"

/** Wrapped groups size to their label so options flow into rows instead of stacking. */
const ITEM_FILLED = "flex-1"
const ITEM_WRAPPED = "flex-none min-w-11 px-1.5"

/** Segmented control used for mode, aspect ratio and resolution. */
export function ChoiceGroup<T extends string>({
  value,
  choices,
  onChange,
  disabled,
  ariaLabel,
  wrap,
}: {
  value: T
  choices: Choice<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  ariaLabel: string
  /** Lets long option lists flow onto multiple rows instead of squashing. */
  wrap?: boolean
}) {
  return (
    <ToggleGroup
      aria-label={ariaLabel}
      value={[value]}
      onValueChange={(next) => {
        const picked = next[next.length - 1]
        if (picked) onChange(picked as T)
      }}
      disabled={disabled}
      variant="outline"
      spacing={2}
      className={cn("w-full", wrap && "flex-wrap")}
    >
      {choices.map((choice) => (
        <ToggleGroupItem
          key={choice.value}
          value={choice.value}
          aria-label={choice.label}
          className={cn(
            ITEM_CLASS,
            wrap ? ITEM_WRAPPED : ITEM_FILLED,
            "[&_svg]:size-3.5"
          )}
        >
          {choice.icon}
          {choice.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
