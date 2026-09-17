import { useCallback, useEffect, useRef, useState } from "react"
import { Check, ChevronDown, Download, PanelRight, PenTool, Redo2, Settings, Undo2 } from "lucide-react"
import { cn } from "cn"
import { useValue } from "tldraw"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useWorkspaceEditor } from "@/hooks/useEditor"

function ProjectName({
  name,
  onRename,
  onClear,
}: {
  name: string
  onRename: (name: string) => void
  onClear: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editing])

  const commit = useCallback(() => {
    const next = draft.trim()
    onRename(next || name)
    setDraft(next || name)
    setEditing(false)
  }, [draft, name, onRename])

  if (editing) {
    return (
      <Input
        ref={inputRef}
        aria-label="项目名称"
        value={draft}
        maxLength={60}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            commit()
          }
          if (event.key === "Escape") {
            event.preventDefault()
            setDraft(name)
            setEditing(false)
          }
        }}
        className="h-7 w-[200px] text-center text-sm"
      />
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="项目菜单"
        className="hidden items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors hover:bg-muted sm:flex"
      >
        <span className="max-w-[220px] truncate font-medium">{name}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-44">
        <DropdownMenuItem onClick={() => setEditing(true)}>重命名</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onClear}>
          清空画布
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Header({
  projectName,
  onRenameProject,
  onClearCanvas,
  onOpenSettings,
  panelOpen,
  onTogglePanel,
}: {
  projectName: string
  onRenameProject: (name: string) => void
  onClearCanvas: () => void
  onOpenSettings: () => void
  panelOpen: boolean
  onTogglePanel: () => void
}) {
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
        <ProjectName
          name={projectName}
          onRename={onRenameProject}
          onClear={onClearCanvas}
        />
      </div>

      <div className="flex items-center gap-1">
        <div className="hidden items-center gap-1.5 pr-1 text-xs text-muted-foreground md:flex">
          <Check className="size-3.5" />
          <span>本地草稿</span>
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
