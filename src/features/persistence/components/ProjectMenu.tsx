import { useCallback, useEffect, useRef, useState } from "react"
import { Check, ChevronDown, Trash2 } from "lucide-react"

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

import { useProject } from "../useProject"

const MAX_RECENT_PROJECTS = 6

export function ProjectMenu({ onClearCanvas }: { onClearCanvas: () => void }) {
  const { project, projects, createProject, switchProject, renameProject, deleteProject } =
    useProject()
  const [editing, setEditing] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(project.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editing])

  const commit = useCallback(() => {
    const next = draft.trim()
    if (next && next !== project.name) void renameProject(next)
    setEditing(false)
  }, [draft, project.name, renameProject])

  const startRenaming = useCallback(() => {
    setDraft(project.name)
    setEditing(true)
  }, [project.name])

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
            setEditing(false)
          }
        }}
        className="h-7 w-[200px] text-center text-sm"
      />
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="项目菜单"
          className="hidden items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors hover:bg-muted sm:flex"
        >
          <span className="max-w-[220px] truncate font-medium">{project.name}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-56">
          <DropdownMenuItem onClick={() => void createProject()}>新建项目</DropdownMenuItem>
          <DropdownMenuItem onClick={startRenaming}>重命名</DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[10px] text-muted-foreground">
              最近项目
            </DropdownMenuLabel>
            {projects.slice(0, MAX_RECENT_PROJECTS).map((item) => (
              <DropdownMenuItem
                key={item.id}
                disabled={item.id === project.id}
                onClick={() => void switchProject(item.id)}
              >
                <span className="truncate">{item.name}</span>
                {item.id === project.id ? <Check className="ml-auto size-3.5" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onClearCanvas}>
            清空画布
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setRenaming(true)}>
            <Trash2 />
            删除项目
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={renaming} onOpenChange={setRenaming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除项目</AlertDialogTitle>
            <AlertDialogDescription>
              “{project.name}”的画布、节点和图片会一起从本地删除，无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setRenaming(false)
                void deleteProject(project.id)
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
