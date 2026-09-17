import { Copy, LoaderCircle, MoreHorizontal, Sparkles } from "lucide-react"
import { HTMLContainer, useValue, type Editor, type TLImageAsset, type TLShapeId } from "tldraw"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ASPECT_RATIOS, ASPECT_RATIO_LABELS } from "@/features/ai/constants"

import { dispatchNodeAction } from "./nodeEvents"
import {
  PROMPT_SHAPE_TYPE,
  type ImageShape,
  type PromptShape,
  type PromptShapeProps,
} from "./shapeTypes"

function stopPointer(event: React.PointerEvent) {
  event.stopPropagation()
}

function updatePromptShape(editor: Editor, id: TLShapeId, props: Partial<PromptShapeProps>) {
  editor.updateShape<PromptShape>({ id, type: PROMPT_SHAPE_TYPE, props })
}

function ReferenceThumbnail({ shape, editor }: { shape: ImageShape; editor: Editor }) {
  const asset = useValue(
    `kundraw prompt reference ${shape.id}`,
    () => editor.getAsset(shape.props.assetId as TLImageAsset["id"]),
    [editor, shape.props.assetId]
  )
  const src = (asset && "src" in asset.props ? asset.props.src : null) || shape.props.imageUrl
  return <img src={src} alt="参考图" className="size-9 rounded object-cover" />
}

export function PromptNode({ shape, editor }: { shape: PromptShape; editor: Editor }) {
  const { props } = shape
  const referenceShapes = props.referenceImages
    .map((id) => editor.getShape(id as TLShapeId))
    .filter((item): item is ImageShape => item?.type === "kundraw-image")

  return (
    <HTMLContainer className="group/prompt overflow-visible">
      <article className="flex size-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-lg shadow-foreground/5">
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid size-6 place-items-center rounded-md bg-brand-subtle text-brand"><Sparkles className="size-3.5" /></span>
            {props.mode === "image" ? "图生图" : "文生图"}
          </div>
          <div className="pointer-events-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover/prompt:opacity-100 focus-within:opacity-100">
            <Button variant="ghost" size="icon-xs" aria-label="复制提示词" title="复制提示词" onPointerDown={stopPointer} onClick={() => void navigator.clipboard.writeText(props.prompt)}><Copy /></Button>
            <Button variant="ghost" size="icon-xs" aria-label="更多" title="更多" onPointerDown={stopPointer}><MoreHorizontal /></Button>
          </div>
        </header>
        <div className="pointer-events-auto flex min-h-0 flex-1 flex-col gap-3 p-3" onPointerDown={stopPointer}>
          <div className="relative min-h-0 flex-1">
            <Textarea aria-label="提示词" value={props.prompt} maxLength={2000} placeholder="描述你想生成的图片..." onChange={(event) => updatePromptShape(editor, shape.id, { prompt: event.target.value })} className="size-full min-h-28 resize-none border-0 bg-muted/35 px-3 py-2.5 text-sm leading-6 shadow-none focus-visible:ring-1" />
            <span className="pointer-events-none absolute right-2 bottom-1.5 text-[10px] text-muted-foreground">{props.prompt.length}/2000</span>
          </div>
          <section className="space-y-1.5">
            <span className="text-[11px] font-medium text-foreground/75">参考图</span>
            <div className="flex h-12 items-center gap-1.5 rounded-md border border-dashed border-border bg-muted/20 px-1.5">
              {referenceShapes.length === 0 ? <span className="px-1 text-[11px] text-muted-foreground">从图片节点添加参考</span> : referenceShapes.slice(0, 4).map((reference) => <ReferenceThumbnail key={reference.id} shape={reference} editor={editor} />)}
              {referenceShapes.length > 4 ? <span className="text-[10px] text-muted-foreground">+{referenceShapes.length - 4}</span> : null}
            </div>
          </section>
          <label className="grid grid-cols-[42px_1fr] items-center gap-2 text-[11px] font-medium text-foreground/75">
            模型
            <Input aria-label="模型" value={props.model} onChange={(event) => updatePromptShape(editor, shape.id, { model: event.target.value })} className="h-8 text-xs" />
          </label>
          <section className="space-y-1.5">
            <span className="text-[11px] font-medium text-foreground/75">比例</span>
            <div className="grid grid-cols-5 gap-1">
              {ASPECT_RATIOS.filter((ratio) => ["1:1", "4:3", "16:9", "3:4", "9:16"].includes(ratio)).map((ratio) => <Button key={ratio} type="button" variant={props.aspectRatio === ratio ? "outline" : "ghost"} size="xs" className={props.aspectRatio === ratio ? "border-brand text-brand" : "text-muted-foreground"} onClick={() => updatePromptShape(editor, shape.id, { aspectRatio: ratio })}>{ASPECT_RATIO_LABELS[ratio]}</Button>)}
            </div>
          </section>
          <Button type="button" size="sm" disabled={!props.prompt.trim() || props.status === "generating"} className="w-full bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => dispatchNodeAction(editor, { type: "generate-prompt", shapeId: shape.id })}>
            {props.status === "generating" ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
            {props.status === "generating" ? "生成中..." : "生成图片"}
          </Button>
        </div>
      </article>
    </HTMLContainer>
  )
}
