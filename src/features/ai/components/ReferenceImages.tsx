import { useCallback, useRef, useState } from "react"
import { ImagePlus, X } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { ACCEPTED_REFERENCE_TYPES, MAX_REFERENCES } from "../constants"
import type { ImageModel, ReferenceImage } from "../types"
import { AiField } from "./AiField"

export function ReferenceImages({
  references,
  model,
  onAdd,
  onRemove,
  onClear,
}: {
  references: ReferenceImage[]
  model: ImageModel
  onAdd: (files: File[]) => Promise<void>
  onRemove: (id: string) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const limit = Math.min(
    MAX_REFERENCES,
    model.capabilities.multipleReferences
      ? (model.capabilities.maxReferences ?? MAX_REFERENCES)
      : 1
  )
  const atLimit = references.length >= limit

  const accept = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return
      const room = limit - references.length
      if (room <= 0) {
        setNotice(`当前模型最多支持 ${limit} 张参考图`)
        return
      }
      if (files.length > room) {
        setNotice(`仅保留前 ${room} 张，当前模型最多支持 ${limit} 张参考图`)
      } else {
        setNotice(null)
      }
      try {
        await onAdd(files.slice(0, room))
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "添加参考图失败")
      }
    },
    [limit, onAdd, references.length]
  )

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
        multiple={model.capabilities.multipleReferences}
        className="hidden"
        onChange={(event) => {
          void accept(Array.from(event.target.files ?? []))
          event.target.value = ""
        }}
      />

      {references.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
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
            "flex w-full flex-col items-center gap-1 rounded-md border border-dashed border-border py-4 transition-colors hover:border-brand/50 hover:bg-brand-subtle/50",
            dragging && "border-brand bg-brand-subtle"
          )}
        >
          <ImagePlus className="size-4 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            拖入图片到这里
          </span>
          <span className="text-[11px] text-muted-foreground">或点击上传</span>
        </button>
      ) : (
        <div
          className={cn(
            "flex flex-wrap gap-2 rounded-md",
            dragging && "ring-2 ring-brand/40"
          )}
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
        >
          {references.map((reference) => (
            <div
              key={reference.id}
              className="group/ref relative size-14 overflow-hidden rounded-md border border-border bg-muted"
            >
              <img
                src={reference.dataUrl}
                alt={reference.name}
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
          ))}

          {!atLimit ? (
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
          ) : null}
        </div>
      )}

      {notice ?? !model.capabilities.multipleReferences ? (
        <p className="text-[11px] text-muted-foreground">
          {notice ?? `当前模型最多支持 ${limit} 张参考图`}
        </p>
      ) : null}
    </AiField>
  )
}
