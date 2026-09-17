import { useCallback, useEffect, useRef, useState } from "react"
import { Check, ChevronDown, Layers, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useValue } from "tldraw"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useWorkspaceEditor } from "@/hooks/useEditor"

const PAGE_NAME_PREFIX = "页面"

function PageMenu() {
  const editor = useWorkspaceEditor()
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const pages = useValue("kundraw pages", () => editor?.getPages() ?? [], [editor])
  const current = useValue("kundraw current page", () => editor?.getCurrentPage() ?? null, [editor])

  useEffect(() => {
    if (!editing) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editing])

  const startRenaming = useCallback(() => {
    if (!current) return
    setDraft(current.name)
    setEditing(true)
  }, [current])

  const commit = useCallback(() => {
    if (!editor || !current) return
    const name = draft.trim()
    setEditing(false)
    if (!name || name === current.name) return

    editor.markHistoryStoppingPoint("kundraw:rename-page")
    editor.updatePage({ id: current.id, name })
    editor.focus()
  }, [current, draft, editor])

  const addPage = useCallback(() => {
    if (!editor) return
    const before = editor.getPages()
    if (before.length >= editor.options.maxPages) {
      toast.info(`最多支持 ${editor.options.maxPages} 个页面`)
      return
    }

    editor.markHistoryStoppingPoint("kundraw:create-page")
    editor.createPage({ name: `${PAGE_NAME_PREFIX} ${before.length + 1}` })
    const created = editor.getPages().at(-1)
    if (created && !before.some((page) => page.id === created.id)) editor.setCurrentPage(created.id)
    editor.focus()
  }, [editor])

  const removePage = useCallback(() => {
    if (!editor || !current) return
    editor.markHistoryStoppingPoint("kundraw:delete-page")
    editor.deletePage(current.id)
    editor.focus()
  }, [current, editor])

  if (!editor || !current) return null

  if (editing) {
    return (
      <Input
        ref={inputRef}
        aria-label="页面名称"
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
            setEditing(false)
          }
        }}
        className="h-7 w-[160px] text-center text-sm"
      />
    )
  }

  const currentIndex = pages.findIndex((page) => page.id === current.id)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="页面菜单"
          className="hidden items-center gap-1.5 rounded-md px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex"
        >
          <Layers className="size-3.5" />
          <span className="max-w-[140px] truncate">{current.name}</span>
          {pages.length > 1 ? (
            <span className="shrink-0 text-[10px] tabular-nums">
              {currentIndex + 1}/{pages.length}
            </span>
          ) : null}
          <ChevronDown className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-56">
          <DropdownMenuItem onClick={addPage}>
            <Plus />
            新建页面
          </DropdownMenuItem>
          <DropdownMenuItem onClick={startRenaming}>重命名当前页面</DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[10px] text-muted-foreground">
              页面列表
            </DropdownMenuLabel>
            {pages.map((page) => (
              <DropdownMenuItem
                key={page.id}
                disabled={page.id === current.id}
                onClick={() => {
                  editor.setCurrentPage(page.id)
                  editor.focus()
                }}
              >
                <span className="truncate">{page.name}</span>
                {page.id === current.id ? <Check className="ml-auto size-3.5" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={pages.length <= 1}
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 />
            删除当前页面
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除页面</AlertDialogTitle>
            <AlertDialogDescription>
              “{current.name}”上的所有内容会被删除，此操作可以用撤销恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmingDelete(false)
                removePage()
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { PageMenu }
