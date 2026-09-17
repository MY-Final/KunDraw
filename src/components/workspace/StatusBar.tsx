import { Maximize, ZoomIn, ZoomOut } from "lucide-react"
import { useValue } from "tldraw"

import { Button } from "@/components/ui/button"
import { useWorkspaceEditor } from "@/hooks/useEditor"

import { getActiveToolId, tools } from "./tools"

function StatusBar() {
  const editor = useWorkspaceEditor()

  const zoom = useValue(
    "kundraw zoom",
    () => (editor ? editor.getZoomLevel() : 1),
    [editor]
  )

  const activeToolId = useValue(
    "kundraw status tool",
    () => (editor ? getActiveToolId(editor) : null),
    [editor]
  )

  const selectionCount = useValue(
    "kundraw status selection",
    () => (editor ? editor.getSelectedShapeIds().length : 0),
    [editor]
  )

  const tool = tools.find((item) => item.id === activeToolId) ?? tools[0]
  const Icon = tool.icon

  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-border bg-background px-2 text-xs text-muted-foreground">
      <div className="flex min-w-0 items-center gap-2 pl-1">
        <Icon className="size-3.5 shrink-0" />
        <span className="shrink-0 text-foreground/80">{tool.label}</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden truncate sm:inline">
          {selectionCount === 0
            ? "未选择任何元素"
            : `已选择 ${selectionCount} 个元素`}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="缩小"
          title="缩小"
          disabled={!editor}
          onClick={() => editor?.zoomOut()}
        >
          <ZoomOut />
        </Button>
        <span className="w-12 text-center text-foreground/80 tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="放大"
          title="放大"
          disabled={!editor}
          onClick={() => editor?.zoomIn()}
        >
          <ZoomIn />
        </Button>

        <span className="mx-1 h-3.5 w-px bg-border" />

        <Button
          variant="ghost"
          size="xs"
          className="gap-1"
          disabled={!editor}
          title="适应内容"
          onClick={() => editor?.zoomToFit()}
        >
          <Maximize className="size-3.5" />
          适应画布
        </Button>
      </div>
    </footer>
  )
}

export { StatusBar }
