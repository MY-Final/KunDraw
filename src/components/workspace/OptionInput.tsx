import type { ReactNode } from "react"
import { cn } from "cn"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { MIXED_PLACEHOLDER } from "./PropertyInput"

const TRIGGER_CLASS =
  "w-full justify-end gap-1 border-0 bg-transparent p-0 text-xs text-foreground/80 shadow-none focus-visible:ring-0 data-[size=sm]:h-5 data-[size=sm]:rounded-none"

function OptionSelect<T extends string>({
  value,
  options,
  getLabel,
  onSelect,
  disabled,
  ariaLabel,
}: {
  value: T | null
  options: readonly T[]
  getLabel: (option: T) => string
  onSelect: (option: T) => void
  disabled?: boolean
  ariaLabel: string
}) {
  return (
    <Select
      items={options.map((option) => ({ value: option, label: getLabel(option) }))}
      value={value}
      onValueChange={(next) => {
        if (typeof next === "string") onSelect(next as T)
      }}
      disabled={disabled}
    >
      <SelectTrigger size="sm" aria-label={ariaLabel} className={TRIGGER_CLASS}>
        <SelectValue placeholder={MIXED_PLACEHOLDER} />
      </SelectTrigger>
      <SelectContent align="end" sideOffset={6} alignItemWithTrigger={false}>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {getLabel(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function SegmentedInput<T extends string>({
  value,
  options,
  getLabel,
  getIcon,
  onSelect,
  disabled,
  ariaLabel,
}: {
  value: T | null
  options: readonly T[]
  getLabel: (option: T) => string
  getIcon: (option: T) => ReactNode
  onSelect: (option: T) => void
  disabled?: boolean
  ariaLabel: string
}) {
  return (
    <ToggleGroup
      aria-label={ariaLabel}
      value={value ? [value] : []}
      onValueChange={(next) => {
        const picked = next[next.length - 1]
        if (picked) onSelect(picked as T)
      }}
      disabled={disabled}
      size="sm"
      spacing={2}
      className="w-full justify-end"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option}
          value={option}
          aria-label={getLabel(option)}
          title={getLabel(option)}
          className={cn(
            "size-5 min-w-5 rounded p-0 text-muted-foreground",
            "aria-pressed:bg-foreground aria-pressed:text-background aria-pressed:hover:bg-foreground aria-pressed:hover:text-background"
          )}
        >
          {getIcon(option)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export { OptionSelect, SegmentedInput }
