import { useCallback, useState } from "react"
import {
  Download,
  EyeOff,
  LoaderCircle,
  PanelRight,
  PenTool,
  Redo2,
  Settings,
  Undo2,
} from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"
import { useValue } from "tldraw"

import { Button } from "@/components/ui/button"
import { exportCanvasAsPng } from "@/features/canvas/exportCanvas"
import { PageMenu } from "@/components/workspace/PageMenu"
import { ProjectMenu } from "@/features/persistence/components/ProjectMenu"
import { SaveStatusIndicator } from "@/features/persistence/components/SaveStatusIndicator"
import { useProject } from "@/features/persistence/useProject"
import { useWorkspaceEditor } from "@/hooks/useEditor"

function Header({
  onClearCanvas,
  onOpenSettings,
  panelOpen,
  onTogglePanel,
}: {
  onClearCanvas: () => void
  onOpenSettings: () => void
  panelOpen: boolean
  onTogglePanel: () => void
}) {
  const editor = useWorkspaceEditor()
  const { project, canEdit } = useProject()
  const [exporting, setExporting] = useState(false)

  const canUndo = useValue(
    "kundraw can undo",
    () => (editor ? editor.canUndo() : false),
    [editor]
  )

  const canRedo = useValue(
    "kundraw can redo",
    () => (editor ? editor.canRedo() : false),
    [editor]
  )

  const handleExport = useCallback(async () => {
    if (!editor || exporting) return
    setExporting(true)

    try {
      const exported = await exportCanvasAsPng(editor, project.name)
      if (exported) toast.success("已导出 PNG")
      else toast.info("画布是空的，没有可导出的内容")
    } catch (error) {
      console.error("[kunDraw] 导出失败", error)
      toast.error("导出失败", { description: "可以尝试减少节点数量后重试" })
    } finally {
      setExporting(false)
    }
  }, [editor, exporting, project.name])

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-border bg-background px-2.5">
      <div className="flex items-center gap-2 pl-0.5">
        <span className="grid size-7 place-items-center rounded-md bg-foreground text-background">
          <PenTool className="size-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight">kunDraw</span>
      </div>

      <div className="flex flex-1 items-center justify-center gap-2">
        <ProjectMenu onClearCanvas={onClearCanvas} />
        <span className="hidden h-5 w-px bg-border sm:block" />
        <PageMenu />
      </div>

      <div className="flex items-center gap-1">
        {canEdit ? (
          <SaveStatusIndicator />
        ) : (
          <span
            title="关闭另一个标签页后，本页会自动接管并恢复编辑"
            className="hidden items-center gap-1.5 pr-1 text-xs text-amber-600 md:flex"
          >
            <EyeOff className="size-3.5" />
            只读 · 另一个标签页正在编辑
          </span>
        )}

        <span className="mx-1 hidden h-5 w-px bg-border md:block" />

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="撤销"
          title="撤销"
          disabled={!canUndo}
          onClick={() => editor?.undo()}
        >
          <Undo2 />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="重做"
          title="重做"
          disabled={!canRedo}
          onClick={() => editor?.redo()}
        >
          <Redo2 />
        </Button>

        <span className="mx-1 h-5 w-px bg-border" />

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={!editor || exporting}
          onClick={() => void handleExport()}
        >
          {exporting ? <LoaderCircle className="animate-spin" /> : <Download />}
          {exporting ? "导出中" : "导出"}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={panelOpen ? "收起侧栏" : "展开侧栏"}
          title={panelOpen ? "收起侧栏" : "展开侧栏"}
          aria-pressed={panelOpen}
          onClick={onTogglePanel}
          className={cn("hidden lg:inline-flex", panelOpen && "bg-muted text-foreground")}
        >
          <PanelRight />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="设置"
          title="设置"
          onClick={onOpenSettings}
        >
          <Settings />
        </Button>
      </div>
    </header>
  )
}

export { Header }
