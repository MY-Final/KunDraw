import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  BringToFront,
  ChevronDown,
  ChevronUp,
  Group,
  SendToBack,
  Ungroup,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"
import type { Editor, TLShape } from "tldraw"

import { Button } from "@/components/ui/button"

import { PropertySection } from "./PropertySection"
import {
  alignShapes,
  distributeShapes,
  groupShapes,
  reorderShapes,
  ungroupShapes,
  type AlignOperation,
  type DistributeOperation,
  type ReorderOperation,
} from "./shapeProps"

function ActionButton({
  label,
  icon: Icon,
  disabled,
  className,
  onClick,
}: {
  label: string
  icon?: LucideIcon
  disabled?: boolean
  className?: string
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="xs"
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "h-7 justify-center gap-1 rounded-md border border-border text-muted-foreground",
        className
      )}
    >
      {Icon ? <Icon className="size-3.5" /> : null}
      {Icon ? null : label}
    </Button>
  )
}

const ALIGN_ACTIONS: Array<{ operation: AlignOperation; label: string; icon: LucideIcon }> = [
  { operation: "left", label: "左对齐", icon: AlignStartVertical },
  { operation: "center-horizontal", label: "水平居中", icon: AlignCenterVertical },
  { operation: "right", label: "右对齐", icon: AlignEndVertical },
  { operation: "top", label: "顶对齐", icon: AlignStartHorizontal },
  { operation: "center-vertical", label: "垂直居中", icon: AlignCenterHorizontal },
  { operation: "bottom", label: "底对齐", icon: AlignEndHorizontal },
]

const DISTRIBUTE_ACTIONS: Array<{
  operation: DistributeOperation
  label: string
  icon: LucideIcon
}> = [
  { operation: "horizontal", label: "水平分布", icon: AlignHorizontalDistributeCenter },
  { operation: "vertical", label: "垂直分布", icon: AlignVerticalDistributeCenter },
]

const LAYER_ACTIONS: Array<{ operation: ReorderOperation; label: string; icon: LucideIcon }> = [
  { operation: "front", label: "置顶", icon: BringToFront },
  { operation: "forward", label: "上移一层", icon: ChevronUp },
  { operation: "backward", label: "下移一层", icon: ChevronDown },
  { operation: "back", label: "置底", icon: SendToBack },
]

/** Multi-selection tools: alignment, distribution and grouping. */
export function ArrangeSection({ editor, shapes }: { editor: Editor; shapes: TLShape[] }) {
  if (shapes.length < 2) return null

  return (
    <PropertySection title="排列" className="grid-cols-3">
      {ALIGN_ACTIONS.map(({ operation, label, icon }) => (
        <ActionButton
          key={operation}
          label={label}
          icon={icon}
          onClick={() => alignShapes(editor, shapes, operation)}
        />
      ))}
      {DISTRIBUTE_ACTIONS.map(({ operation, label, icon }) => (
        <ActionButton
          key={operation}
          label={shapes.length < 3 ? `${label}（需 3 个以上元素）` : label}
          icon={icon}
          disabled={shapes.length < 3}
          onClick={() => distributeShapes(editor, shapes, operation)}
        />
      ))}
      <ActionButton
        label={`组合 ${shapes.length} 个元素`}
        icon={Group}
        onClick={() => groupShapes(editor, shapes)}
      />
    </PropertySection>
  )
}

/** Stacking order and ungrouping for any selection. */
export function LayerSection({ editor, shapes }: { editor: Editor; shapes: TLShape[] }) {
  if (shapes.length === 0) return null
  const hasGroup = shapes.some((shape) => shape.type === "group")

  return (
    <PropertySection title="层级" className={hasGroup ? "grid-cols-2" : "grid-cols-4"}>
      {LAYER_ACTIONS.map(({ operation, label, icon }) => (
        <ActionButton
          key={operation}
          label={label}
          icon={icon}
          onClick={() => reorderShapes(editor, shapes, operation)}
        />
      ))}
      {hasGroup ? (
        <ActionButton
          label="取消组合"
          icon={Ungroup}
          className="col-span-2"
          onClick={() => ungroupShapes(editor, shapes)}
        />
      ) : null}
    </PropertySection>
  )
}
