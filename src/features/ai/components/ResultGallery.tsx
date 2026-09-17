import { useCallback, useState } from "react"
import { Download, ImagePlus, LoaderCircle, Maximize2, RefreshCw, Trash } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useProject } from "@/features/persistence/useProject"
import { useWorkspaceEditor } from "@/hooks/useEditor"

import { addImageToCanvas, downloadImage, imageFileName } from "../canvas"
import type { GeneratedImage } from "../types"
import { ResultPreviewDialog } from "./ResultPreviewDialog"

function ResultCard({
  image,
  adding,
  onAdd,
  onDownload,
  onRegenerate,
  onRemove,
  onPreview,
}: {
  image: GeneratedImage
  adding: boolean
  onAdd: (image: GeneratedImage) => void
  onDownload: (image: GeneratedImage) => void
  onRegenerate: (image: GeneratedImage) => void
  onRemove: (image: GeneratedImage) => void
  onPreview: () => void
}) {
  return (
    <div className="group/result relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
      <img
        src={image.url}
        alt={image.source.prompt}
        title={image.source.prompt || "点击预览"}
        loading="lazy"
        draggable={false}
        onClick={onPreview}
        className="size-full cursor-zoom-in object-cover"
      />

      {/* Actions sit in the bottom strip so the image itself stays clickable. */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-foreground/75 to-transparent px-1 pt-4 pb-1 opacity-0 transition-opacity group-hover/result:opacity-100 focus-within:opacity-100">
        <Button
          size="icon-sm"
          aria-label="添加到画布"
          title="添加到画布"
          disabled={adding}
          onClick={() => onAdd(image)}
          className="bg-background text-foreground hover:bg-background/90"
        >
          {adding ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}
        </Button>
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label="下载"
          title="下载"
          onClick={() => onDownload(image)}
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
          onClick={() => onRemove(image)}
        >
          <Trash />
        </Button>
      </div>

      <Button
        size="icon-xs"
        aria-label="预览"
        title="预览"
        onClick={onPreview}
        className="absolute top-1 right-1 bg-background/90 text-foreground opacity-0 transition-opacity group-hover/result:opacity-100 focus-visible:opacity-100"
      >
        <Maximize2 />
      </Button>
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
  const editor = useWorkspaceEditor()
  const { project } = useProject()
  const [addingId, setAddingId] = useState<string | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  const addToCanvas = useCallback(
    async (image: GeneratedImage) => {
      if (!editor || addingId) return
      setAddingId(image.id)

      try {
        await addImageToCanvas(editor, image)
        toast.success("已添加到画布")
      } catch (error) {
        console.error("[kunDraw] 添加到画布失败", error)
        toast.error("添加到画布失败", { description: "图片可能已失效，请重新生成" })
      } finally {
        setAddingId(null)
      }
    },
    [addingId, editor]
  )

  const download = useCallback(
    async (image: GeneratedImage) => {
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
    },
    [project.name]
  )

  const remove = useCallback(
    (image: GeneratedImage) => {
      onRemove(image.id)

      setPreviewIndex((current) => {
        if (current === null) return current
        const remaining = results.length - 1
        if (remaining === 0) return null
        return Math.min(current, remaining - 1)
      })
    },
    [onRemove, results.length]
  )

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
        {results.map((image, index) => (
          <ResultCard
            key={image.id}
            image={image}
            adding={addingId === image.id}
            onAdd={(target) => void addToCanvas(target)}
            onDownload={(target) => void download(target)}
            onRegenerate={onRegenerate}
            onRemove={remove}
            onPreview={() => setPreviewIndex(index)}
          />
        ))}
      </div>

      <ResultPreviewDialog
        images={results}
        index={previewIndex}
        onIndexChange={setPreviewIndex}
        onClose={() => setPreviewIndex(null)}
        onAdd={(image) => void addToCanvas(image)}
        onDownload={(image) => void download(image)}
        onRegenerate={(image) => {
          setPreviewIndex(null)
          onRegenerate(image)
        }}
        onRemove={remove}
      />
    </section>
  )
}
