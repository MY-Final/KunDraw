import { cn } from "cn"
import { getColorValue, useValue, type TLDefaultColorStyle } from "tldraw"

import { useWorkspaceEditor } from "@/hooks/useEditor"

import { colorLabel, colorOptions } from "./shapeLabels"

function ColorSwatches({
  value,
  onSelect,
  disabled,
  ariaLabel,
}: {
  value: TLDefaultColorStyle | null
  onSelect: (color: TLDefaultColorStyle) => void
  disabled?: boolean
  ariaLabel: string
}) {
  const editor = useWorkspaceEditor()

  const themeColors = useValue(
    "kundraw theme colors",
    () =>
      editor ? editor.getCurrentTheme().colors[editor.getColorMode()] : null,
    [editor]
  )

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1"
    >
      {colorOptions.map((color) => (
        <button
          key={color}
          type="button"
          title={colorLabel(color)}
          aria-label={colorLabel(color)}
          aria-pressed={value === color}
          disabled={disabled}
          onClick={() => onSelect(color)}
          style={
            themeColors
              ? { backgroundColor: getColorValue(themeColors, color, "solid") }
              : undefined
          }
          className={cn(
            "aspect-square rounded-[3px] border border-border transition-[box-shadow,transform] disabled:cursor-not-allowed disabled:opacity-50",
            value === color
              ? "ring-2 ring-foreground ring-offset-1 ring-offset-background"
              : "hover:scale-110"
          )}
        />
      ))}
    </div>
  )
}

export { ColorSwatches }
