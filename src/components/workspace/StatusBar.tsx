import { Maximize, ZoomIn, ZoomOut } from "lucide-react"

import { Button } from "@/components/ui/button"

import { tools, type ToolId } from "./tools"

type StatusBarProps = {
  activeTool: ToolId
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
}

function StatusBar({
  activeTool,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: StatusBarProps) {
  const tool = tools.find((item) => item.id === activeTool) ?? tools[0]
  const Icon = tool.icon

  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-border bg-background px-2 text-xs text-muted-foreground">
      <div className="flex min-w-0 items-center gap-2 pl-1">
        <Icon className="size-3.5 shrink-0" />
        <span className="shrink-0 text-foreground/80">{tool.label}</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden truncate sm:inline">未选择任何元素</span>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="缩小"
          title="缩小"
          onClick={onZoomOut}
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
          onClick={onZoomIn}
        >
          <ZoomIn />
        </Button>

        <span className="mx-1 h-3.5 w-px bg-border" />

        <Button
          variant="ghost"
          size="xs"
          className="gap-1"
          onClick={onZoomReset}
        >
          <Maximize className="size-3.5" />
          适应画布
        </Button>
      </div>
    </footer>
  )
}

export { StatusBar }
