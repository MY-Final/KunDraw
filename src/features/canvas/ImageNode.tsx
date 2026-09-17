import { Download, ImagePlus, MoreHorizontal, Pencil, RefreshCw } from "lucide-react"
import { HTMLContainer, useValue, type Editor, type TLImageAsset } from "tldraw"

import { Button } from "@/components/ui/button"

import { dispatchNodeAction } from "./nodeEvents"
import type { ImageShape } from "./shapeTypes"

function stopPointer(event: React.PointerEvent) {
  event.stopPropagation()
}

export function ImageNode({ shape, editor }: { shape: ImageShape; editor: Editor }) {
  const asset = useValue(`kundraw image asset ${shape.id}`, () => shape.props.assetId ? editor.getAsset(shape.props.assetId as TLImageAsset["id"]) : null, [shape.props.assetId, editor])
  const src = (asset && "src" in asset.props ? asset.props.src : null) || shape.props.imageUrl
  const action = (type: "create-reference-prompt" | "regenerate-image" | "download-image") => dispatchNodeAction(editor, { type, shapeId: shape.id })

  return (
    <HTMLContainer className="group/image overflow-visible">
      <article className="relative flex size-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-lg shadow-foreground/5">
        <div className="relative min-h-0 flex-1 overflow-hidden bg-muted">
          {src ? <img src={src} alt={shape.props.prompt || shape.props.name} className="size-full object-cover" draggable={false} /> : <div className="grid size-full place-items-center text-xs text-muted-foreground">图片加载中...</div>}
          <div className="pointer-events-auto absolute right-2 bottom-2 flex items-center gap-1 rounded-lg border border-border/70 bg-background/95 p-1 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover/image:opacity-100 focus-within:opacity-100" onPointerDown={stopPointer}>
            <Button variant="ghost" size="icon-xs" aria-label="作为参考图" title="作为参考图" onClick={() => action("create-reference-prompt")}><ImagePlus /></Button>
            <Button variant="ghost" size="icon-xs" aria-label="AI 编辑" title="AI 编辑" onClick={() => action("create-reference-prompt")}><Pencil /></Button>
            <Button variant="ghost" size="icon-xs" aria-label="重新生成" title="重新生成" disabled={!shape.props.sourcePromptId} onClick={() => action("regenerate-image")}><RefreshCw /></Button>
            <Button variant="ghost" size="icon-xs" aria-label="下载" title="下载" onClick={() => action("download-image")}><Download /></Button>
            <Button variant="ghost" size="icon-xs" aria-label="更多" title="更多"><MoreHorizontal /></Button>
          </div>
        </div>
        <footer className="flex h-11 shrink-0 items-center justify-between gap-2 border-t border-border px-3 text-[10px]">
          <span className="max-w-[60%] truncate font-medium text-foreground/75">{shape.props.model || "本地图片"}</span>
          <time className="shrink-0 text-muted-foreground">{new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(shape.props.createdAt)}</time>
        </footer>
      </article>
    </HTMLContainer>
  )
}
