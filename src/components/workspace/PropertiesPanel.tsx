import type { ReactNode } from "react"
import { Eye, EyeOff, Lock, LockOpen, Trash } from "lucide-react"
import { cn } from "cn"
import { useValue } from "tldraw"

import { Button } from "@/components/ui/button"
import { useWorkspaceEditor } from "@/hooks/useEditor"
import { useSelectedShapes } from "@/hooks/useSelectedShapes"

import { FillSection, ShapePropertySections, StrokeSection } from "./ShapePropertySections"
import { OpacitySection, ShapeCommonSections } from "./ShapeCommonSections"
import { shapeTypeLabel } from "./shapeLabels"
import {
  deleteShapes,
  opacityPercent,
  readOpacity,
  stylesFor,
  toggleHidden,
  toggleLocked,
  unhideAllShapes,
} from "./shapeProps"

function PanelAction({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string
  icon: ReactNode
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="xs"
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-7 flex-1 gap-1 rounded-md border border-border text-muted-foreground",
        active && "bg-muted text-foreground"
      )}
    >
      {icon}
      {label}
    </Button>
  )
}

function EmptyState({
  editor,
  hiddenCount,
}: {
  editor: ReturnType<typeof useWorkspaceEditor>
  hiddenCount: number
}) {
  return (
    <>
      <p className="border-b border-border px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        {hiddenCount > 0
          ? `画布中有 ${hiddenCount} 个已隐藏元素。`
          : "选择一个元素以查看属性。"}
      </p>
      {hiddenCount > 0 ? (
        <div className="border-b border-border px-3 py-2.5">
          <Button
            variant="outline"
            size="xs"
            className="w-full"
            disabled={!editor}
            onClick={() => editor && unhideAllShapes(editor)}
          >
            全部显示
          </Button>
        </div>
      ) : null}
    </>
  )
}

function PropertiesPanel() {
  const editor = useWorkspaceEditor()
  const shapes = useSelectedShapes()

  const styles = useValue(
    "kundraw shared styles",
    () => (editor ? stylesFor(editor) : null),
    [editor]
  )

  const opacity = useValue(
    "kundraw shared opacity",
    () => (editor ? readOpacity(editor) : undefined),
    [editor]
  )

  const hiddenCount = useValue(
    "kundraw hidden shapes",
    () =>
      editor
        ? editor
            .getCurrentPageShapes()
            .filter((shape) => editor.isShapeHidden(shape.id)).length
        : 0,
    [editor]
  )

  const count = shapes.length
  const shape = count === 1 ? shapes[0] : null
  const isLocked = count > 0 && shapes.every((item) => item.isLocked)
  const isHidden =
    count > 0 && Boolean(editor && shapes.every((item) => editor.isShapeHidden(item.id)))

  const statusText =
    count === 0
      ? "未选择"
      : count === 1
        ? "已选择 1 个元素"
        : `已选择 ${count} 个元素`

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[11px] text-muted-foreground">{statusText}</span>
        {shape ? (
          <span className="truncate text-[11px] text-foreground/70">
            {shapeTypeLabel(shape)}
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 border-b border-border px-3 py-2">
        <PanelAction
          label={isLocked ? "解锁" : "锁定"}
          icon={
            isLocked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />
          }
          active={isLocked}
          disabled={!editor || count === 0}
          onClick={() => editor && toggleLocked(editor, shapes)}
        />
        <PanelAction
          label={isHidden ? "显示" : "隐藏"}
          icon={isHidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          active={isHidden}
          disabled={!editor || count === 0}
          onClick={() => editor && toggleHidden(editor, shapes)}
        />
        <PanelAction
          label="删除"
          icon={<Trash className="size-3.5" />}
          disabled={!editor || count === 0}
          onClick={() => editor && deleteShapes(editor, shapes)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {count === 0 ? (
          <EmptyState editor={editor} hiddenCount={hiddenCount} />
        ) : null}

        {editor && shape && styles ? (
          <>
            <ShapeCommonSections editor={editor} shape={shape} />
            <OpacitySection editor={editor} value={opacityPercent(opacity)} />
            <ShapePropertySections editor={editor} shape={shape} styles={styles} />
          </>
        ) : null}

        {editor && count > 1 && styles ? (
          <>
            <p className="border-b border-border px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              已选择 {count} 个元素，可批量修改以下外观属性。
            </p>

            <OpacitySection editor={editor} value={opacityPercent(opacity)} />
            <FillSection editor={editor} styles={styles} />
            <StrokeSection editor={editor} styles={styles} />
          </>
        ) : null}
      </div>
    </div>
  )
}

export { PropertiesPanel }
