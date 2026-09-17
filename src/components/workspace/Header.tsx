import {
  Check,
  ChevronDown,
  Download,
  PenTool,
  Redo2,
  Settings,
  Undo2,
} from "lucide-react"
import { useValue } from "tldraw"

import { Button } from "@/components/ui/button"
import { useWorkspaceEditor } from "@/hooks/useEditor"

function Header() {
  const editor = useWorkspaceEditor()

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

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-border bg-background px-2.5">
      <div className="flex items-center gap-2 pl-0.5">
        <span className="grid size-7 place-items-center rounded-md bg-foreground text-background">
          <PenTool className="size-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight">kunDraw</span>
      </div>

      <div className="flex flex-1 justify-center">
        <button
          type="button"
          className="hidden items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors hover:bg-muted sm:flex"
        >
          <span className="max-w-[220px] truncate font-medium">未命名项目</span>
          <span className="text-xs text-muted-foreground">草稿</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <div className="hidden items-center gap-1.5 pr-1 text-xs text-muted-foreground md:flex">
          <Check className="size-3.5" />
          <span>已保存</span>
        </div>

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

        <Button variant="outline" size="sm" className="gap-1.5">
          <Download />
          导出
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="设置" title="设置">
          <Settings />
        </Button>
      </div>
    </header>
  )
}

export { Header }
