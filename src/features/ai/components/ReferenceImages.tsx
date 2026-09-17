import { useCallback, useEffect, useRef, useState } from "react"
import { Check, ChevronDown, ImagePlus, X } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ACCEPTED_REFERENCE_TYPES,
  REFERENCE_ROLES,
  REFERENCE_ROLE_LABELS,
} from "../constants"
import { summarizeReferenceRoles } from "../referenceRoles"
import type { ReferenceImage, ReferenceRole } from "../types"
import { AiField } from "./AiField"

export function ReferenceImages({
  references,
  onAdd,
  onRemove,
  onChangeRole,
  onClear,
}: {
  references: ReferenceImage[]
  onAdd: (files: File[]) => Promise<void>
  onRemove: (id: string) => void
  onChangeRole: (id: string, role: ReferenceRole) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const accept = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return
      try {
        setNotice(null)
        await onAdd(files)
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "添加参考图失败")
      }
    },
    [onAdd]
  )

  // Pasting works anywhere on the panel, not only over the drop area.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []).filter((file) =>
        file.type.startsWith("image/")
      )
      if (files.length === 0) return
      event.preventDefault()
      void accept(files)
    }

    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [accept])

  return (
    <AiField
      label="参考图"
      action={
        references.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            清空
          </button>
        ) : null
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_REFERENCE_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(event) => {
          void accept(Array.from(event.target.files ?? []))
          event.target.value = ""
        }}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          void accept(Array.from(event.dataTransfer.files))
        }}
        className={cn(
          "rounded-md border border-dashed border-border transition-colors",
          dragging && "border-brand bg-brand-subtle"
        )}
      >
        {references.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-1 py-4 transition-colors hover:bg-brand-subtle/50"
          >
            <ImagePlus className="size-4 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">
              点击、拖拽或粘贴图片到此处
            </span>
            <span className="text-[11px] text-muted-foreground">
              可添加多张参考图
            </span>
          </button>
        ) : (
          <div className="flex flex-wrap gap-2 p-2">
            {references.map((reference) => (
              <div key={reference.id} className="w-14 space-y-1">
                <div className="group/ref relative size-14 overflow-hidden rounded-md border border-border bg-muted">
                  <img
                    src={reference.dataUrl}
                    alt={reference.name}
                    title={reference.name}
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label={`移除 ${reference.name}`}
                    title="移除"
                    onClick={() => onRemove(reference.id)}
                    className="absolute top-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity group-hover/ref:opacity-100 focus-visible:opacity-100"
                  >
                    <X className="size-2.5" />
                  </button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label={`${reference.name} 的角色`}
                    title="参考图角色"
                    className="flex h-5 w-full items-center justify-between gap-0.5 rounded border border-border px-1 text-[9px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="truncate">{REFERENCE_ROLE_LABELS[reference.role]}</span>
                    <ChevronDown className="size-2.5 shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-28">
                    {REFERENCE_ROLES.map((role) => (
                      <DropdownMenuItem
                        key={role}
                        className="text-xs"
                        onClick={() => onChangeRole(reference.id, role)}
                      >
                        {REFERENCE_ROLE_LABELS[role]}
                        {role === reference.role ? <Check className="ml-auto size-3.5" /> : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

            <Button
              variant="outline"
              size="icon"
              aria-label="添加参考图"
              title="添加参考图"
              onClick={() => inputRef.current?.click()}
              className="size-14 rounded-md border-dashed text-muted-foreground"
            >
              <ImagePlus />
            </Button>
          </div>
        )}
      </div>

      {notice ? (
        <p className="text-[11px] text-destructive">{notice}</p>
      ) : references.length > 0 ? (
        <p className="text-[11px] text-muted-foreground">
          已添加 {references.length} 张（{summarizeReferenceRoles(references)}），多张会作为组图参考一起发送
        </p>
      ) : null}
    </AiField>
  )
}
