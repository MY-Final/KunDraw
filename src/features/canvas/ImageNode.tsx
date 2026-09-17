import { Crop, Download, Maximize2, Paintbrush, RefreshCw, Sparkles, Trash2 } from "lucide-react"
import { HTMLContainer, getUncroppedSize, useValue, type Editor, type TLImageAsset } from "tldraw"

import { Button } from "@/components/ui/button"

import { NodeFloatingToolbar } from "./NodeFloatingToolbar"
import { dispatchNodeAction } from "./nodeEvents"
import type { ImageShape } from "./shapeTypes"

export function ImageNode({ shape, editor }: { shape: ImageShape; editor: Editor }) {
  const asset = useValue(`kundraw image asset ${shape.id}`, () => shape.props.assetId ? editor.getAsset(shape.props.assetId as TLImageAsset["id"]) : null, [shape.props.assetId, editor])
  const isSelected = useValue(
    `kundraw image selected ${shape.id}`,
    () => editor.getOnlySelectedShape()?.id === shape.id,
    [editor, shape.id]
  )
  const isCropping = useValue(
    `kundraw image cropping ${shape.id}`,
    () => editor.getCroppingShapeId() === shape.id,
    [editor, shape.id]
  )
  const src = (asset && "src" in asset.props ? asset.props.src : null) || shape.props.imageUrl
  const crop = shape.props.crop
  const uncropped = getUncroppedSize({ w: shape.props.w, h: shape.props.h }, crop)
  const action = (type: "continue-from-image" | "preview-image" | "regenerate-image" | "inpaint-image" | "crop-image" | "download-image" | "delete-node") => dispatchNodeAction(editor, { type, shapeId: shape.id })

  return (
    <HTMLContainer className="group/image overflow-visible">
      {isSelected ? (
        <NodeFloatingToolbar label="图片操作">
          <Button variant="ghost" size="xs" onClick={() => action("continue-from-image")}><Sparkles />继续创作</Button>
          <Button variant="ghost" size="xs" onClick={() => action("preview-image")}><Maximize2 />预览</Button>
          <Button variant="ghost" size="xs" onClick={() => action("inpaint-image")}><Paintbrush />局部重绘</Button>
          <Button variant="ghost" size="xs" aria-pressed={isCropping} onClick={() => action("crop-image")}><Crop />{isCropping ? "完成裁剪" : "裁剪"}</Button>
          <Button variant="ghost" size="xs" disabled={!shape.props.sourcePromptId} onClick={() => action("regenerate-image")}><RefreshCw />重新生成</Button>
          <Button variant="ghost" size="icon-xs" aria-label="下载" title="下载" onClick={() => action("download-image")}><Download /></Button>
          <Button variant="ghost" size="icon-xs" className="text-destructive" aria-label="删除图片" title="删除图片" onClick={() => action("delete-node")}><Trash2 /></Button>
        </NodeFloatingToolbar>
      ) : null}
      <article className="relative size-full overflow-hidden rounded-xl border border-border bg-background shadow-lg shadow-foreground/5">
        <div className="relative size-full overflow-hidden bg-muted">
          {src ? (
            <img
              src={src}
              alt={shape.props.prompt || shape.props.name}
              draggable={false}
              width={Math.round(uncropped.w)}
              height={Math.round(uncropped.h)}
              style={
                crop
                  ? {
                      transform: `translate(${-crop.topLeft.x * uncropped.w}px, ${-crop.topLeft.y * uncropped.h}px)`,
                    }
                  : undefined
              }
              className="absolute top-0 left-0 max-w-none"
            />
          ) : (
            <div className="grid size-full place-items-center text-xs text-muted-foreground">
              图片加载中...
            </div>
          )}
        </div>
      </article>
      {/* The caption floats below the shape so cropping only affects the image. */}
      <footer className="absolute top-full left-0 mt-1.5 flex w-full items-center justify-between gap-2 rounded-md border border-border bg-background/95 px-2 py-1 text-[10px] shadow-sm backdrop-blur">
        <span className="max-w-[60%] truncate font-medium text-foreground/75">{shape.props.model || "本地图片"}</span>
        <time className="shrink-0 text-muted-foreground">{new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(shape.props.createdAt)}</time>
      </footer>
    </HTMLContainer>
  )
}
