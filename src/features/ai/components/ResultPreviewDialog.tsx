import { useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight, Download, ImagePlus, RefreshCw, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { GeneratedImage } from "../types"

function formatTime(value?: number) {
  if (!value) return ""
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

/** Full-size look at a generated image, with the same actions as the gallery card. */
export function ResultPreviewDialog({
  images,
  index,
  onIndexChange,
  onClose,
  onAdd,
  onDownload,
  onRegenerate,
  onRemove,
}: {
  images: GeneratedImage[]
  index: number | null
  onIndexChange: (index: number) => void
  onClose: () => void
  onAdd: (image: GeneratedImage) => void
  onDownload: (image: GeneratedImage) => void
  onRegenerate: (image: GeneratedImage) => void
  onRemove: (image: GeneratedImage) => void
}) {
  const image = index === null ? null : (images[index] ?? null)

  const step = useCallback(
    (delta: number) => {
      if (index === null || images.length < 2) return
      onIndexChange((index + delta + images.length) % images.length)
    },
    [images.length, index, onIndexChange]
  )

  useEffect(() => {
    if (!image) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        step(-1)
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        step(1)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [image, step])

  return (
    <Dialog open={Boolean(image)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-4xl">
        <DialogHeader className="min-w-0 gap-1 pr-10">
          <DialogTitle className="truncate">{image?.source.prompt || "生成结果"}</DialogTitle>
          <DialogDescription className="truncate">
            {[
              image?.source.model,
              image ? `${image.source.count} 张` : "",
              image?.source.references ? `参考图 ${image.source.references}` : "",
              formatTime(image?.createdAt),
            ]
              .filter(Boolean)
              .join(" · ")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 items-center justify-center overflow-hidden rounded-lg bg-muted/40">
          {image ? (
            <img
              src={image.url}
              alt={image.source.prompt}
              className="max-h-[70vh] max-w-full object-contain"
            />
          ) : null}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          <div className="flex items-center gap-1">
            {images.length > 1 ? (
              <>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="上一张"
                  title="上一张（←）"
                  onClick={() => step(-1)}
                >
                  <ChevronLeft />
                </Button>
                <span className="min-w-12 text-center text-[11px] tabular-nums text-muted-foreground">
                  {(index ?? 0) + 1}/{images.length}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="下一张"
                  title="下一张（→）"
                  onClick={() => step(1)}
                >
                  <ChevronRight />
                </Button>
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => image && onAdd(image)}
            >
              <ImagePlus />
              添加到画布
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => image && onDownload(image)}
            >
              <Download />
              下载
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => image && onRegenerate(image)}
            >
              <RefreshCw />
              重新生成
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => image && onRemove(image)}
            >
              <Trash />
              删除
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
