import { useCallback, useState } from "react"
import { Download, ImagePlus, LoaderCircle, RefreshCw, Trash } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useProject } from "@/features/persistence/useProject"
import { useWorkspaceEditor } from "@/hooks/useEditor"

import { addImageToCanvas, downloadImage, imageFileName } from "../canvas"
import type { GeneratedImage } from "../types"

function ResultCard({
  image,
  onRegenerate,
  onRemove,
}: {
  image: GeneratedImage
  onRegenerate: (image: GeneratedImage) => void
  onRemove: (id: string) => void
}) {
  const editor = useWorkspaceEditor()
  const { project } = useProject()
  const [adding, setAdding] = useState(false)

  const handleAdd = useCallback(async () => {
    if (!editor || adding) return
    setAdding(true)
    try {
      await addImageToCanvas(editor, image)
      toast.success("已添加到画布")
    } catch (error) {
      console.error("[kunDraw] 添加到画布失败", error)
      toast.error("添加到画布失败", { description: "图片可能已失效，请重新生成" })
    } finally {
      setAdding(false)
    }
  }, [adding, editor, image])

  const handleDownload = useCallback(async () => {
    const result = await downloadImage(
      image,
      imageFileName({
        projectName: project.name,
        prompt: image.source.prompt,
        model: image.source.model,
        createdAt: image.createdAt,
      })
    )
    if (result === "opened") {
      toast.info("已在新的标签页打开图片", {
        description: "浏览器阻止了直接下载，可右键保存图片",
      })
    }
  }, [image, project.name])

  return (
    <div className="group/result relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
      <img
        src={image.url}
        alt={image.source.prompt}
        loading="lazy"
        className="size-full object-cover"
      />

      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-1 bg-foreground/55 opacity-0 transition-opacity",
          "group-hover/result:opacity-100 focus-within:opacity-100"
        )}
      >
        <Button
          size="icon-sm"
          aria-label="添加到画布"
          title="添加到画布"
          disabled={adding}
          onClick={() => void handleAdd()}
          className="bg-background text-foreground hover:bg-background/90"
        >
          {adding ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <ImagePlus />
          )}
        </Button>
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label="下载"
          title="下载"
          onClick={() => void handleDownload()}
        >
          <Download />
        </Button>
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label="重新生成"
          title="重新生成"
          onClick={() => onRegenerate(image)}
        >
          <RefreshCw />
        </Button>
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label="删除"
          title="删除"
          onClick={() => onRemove(image.id)}
        >
          <Trash />
        </Button>
      </div>
    </div>
  )
}

export function ResultGallery({
  results,
  onRegenerate,
  onRemove,
  onClear,
}: {
  results: GeneratedImage[]
  onRegenerate: (image: GeneratedImage) => void
  onRemove: (id: string) => void
  onClear: () => void
}) {
  if (results.length === 0) return null

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground/80">
          生成结果
          <span className="ml-1 text-muted-foreground tabular-nums">
            {results.length}
          </span>
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          清空
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {results.map((image) => (
          <ResultCard
            key={image.id}
            image={image}
            onRegenerate={onRegenerate}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  )
}
