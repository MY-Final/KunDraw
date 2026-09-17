import { useRef } from "react"
import { Copy, ImagePlus, LoaderCircle, Sparkles, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { HTMLContainer, useValue, type Editor, type TLImageAsset, type TLShapeId } from "tldraw"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ACCEPTED_REFERENCE_TYPES,
  ASPECT_RATIOS,
  ASPECT_RATIO_LABELS,
  RESOLUTION_LABELS,
  describeSize,
} from "@/features/ai/constants"
import { GenerationElapsed } from "@/features/ai/components/GenerationElapsed"
import { ModelPicker } from "@/features/ai/components/ModelPicker"
import { summarizeReferenceRoles } from "@/features/ai/referenceRoles"
import { useOptionalAi } from "@/features/ai/useAi"

import { dispatchNodeAction } from "./nodeEvents"
import { NodeFloatingToolbar } from "./NodeFloatingToolbar"
import {
  addReferenceFilesToPrompt,
  readReferenceRole,
  removePromptReferences,
} from "./references"
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

function ReferenceThumbnail({ shape, editor, onRemove }: { shape: ImageShape; editor: Editor; onRemove: () => void }) {
  const asset = useValue(
    `kundraw prompt reference ${shape.id}`,
    () => editor.getAsset(shape.props.assetId as TLImageAsset["id"]),
    [editor, shape.props.assetId]
  )
  const src = (asset && "src" in asset.props ? asset.props.src : null) || shape.props.imageUrl
  return (
    <div className="group/reference relative size-9 shrink-0">
      <img src={src} alt={shape.props.name || "参考图"} title={shape.props.name} className="size-full rounded object-cover" />
      <Button
        type="button"
        variant="secondary"
        size="icon-xs"
        className="absolute -top-1 -right-1 size-4 rounded-full opacity-0 shadow-sm group-hover/reference:opacity-100 focus-visible:opacity-100"
        aria-label="移除参考图"
        title="移除参考图"
        onClick={onRemove}
      >
        <X className="size-2.5" />
      </Button>
    </div>
  )
}

export function PromptNode({ shape, editor }: { shape: PromptShape; editor: Editor }) {
  const ai = useOptionalAi()
  const referenceInputRef = useRef<HTMLInputElement>(null)
  const { props } = shape
  const isSelected = useValue(
    `kundraw prompt selected ${shape.id}`,
    () => editor.getOnlySelectedShape()?.id === shape.id,
    [editor, shape.id]
  )
  // Reactive so role changes on the referenced images re-render this node.
  const referenceShapes = useValue(
    `kundraw prompt references ${shape.id}`,
    () =>
      props.referenceImages
        .map((id) => editor.getShape(id as TLShapeId))
        .filter((item): item is ImageShape => item?.type === "kundraw-image"),
    [editor, props.referenceImages]
  )

  return (
    <HTMLContainer className="group/prompt overflow-visible">
      {isSelected ? (
        <NodeFloatingToolbar label="Prompt 操作">
          <Button variant="ghost" size="xs" disabled={!props.prompt.trim() || props.status === "generating"} onClick={() => dispatchNodeAction(editor, { type: "generate-prompt", shapeId: shape.id })}><Sparkles />生成</Button>
          <Button variant="ghost" size="xs" disabled={!props.prompt} onClick={() => void navigator.clipboard.writeText(props.prompt)}><Copy />复制提示词</Button>
          <Button variant="ghost" size="icon-xs" className="text-destructive" aria-label="删除 Prompt" title="删除 Prompt" onClick={() => dispatchNodeAction(editor, { type: "delete-node", shapeId: shape.id })}><Trash2 /></Button>
        </NodeFloatingToolbar>
      ) : null}
      <article className="flex size-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-lg shadow-foreground/5">
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid size-6 place-items-center rounded-md bg-brand-subtle text-brand"><Sparkles className="size-3.5" /></span>
            {props.mode === "image" ? "图生图" : "文生图"}
          </div>
        </header>
        <div className="pointer-events-auto flex min-h-0 flex-1 flex-col gap-3 p-3" onPointerDown={stopPointer}>
          <div className="relative min-h-0 flex-1">
            <Textarea aria-label="提示词" value={props.prompt} maxLength={2000} placeholder="描述你想生成的图片..." onChange={(event) => updatePromptShape(editor, shape.id, { prompt: event.target.value })} className="size-full min-h-28 resize-none border-0 bg-muted/35 px-3 py-2.5 text-sm leading-6 shadow-none focus-visible:ring-1" />
            <span className="pointer-events-none absolute right-2 bottom-1.5 text-[10px] text-muted-foreground">{props.prompt.length}/2000</span>
          </div>
          <section className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-foreground/75">参考图</span>
              <span className="min-w-0 truncate text-[10px] text-muted-foreground" title={referenceShapes.length > 0 ? summarizeReferenceRoles(referenceShapes.map((item) => ({ role: readReferenceRole(item) }))) : undefined}>
                {referenceShapes.length > 0
                  ? `已引用 ${referenceShapes.length} 张 · ${summarizeReferenceRoles(referenceShapes.map((item) => ({ role: readReferenceRole(item) })))}`
                  : "可添加多张"}
              </span>
            </div>
            <input
              ref={referenceInputRef}
              type="file"
              accept={ACCEPTED_REFERENCE_TYPES.join(",")}
              multiple
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? [])
                event.target.value = ""
                void addReferenceFilesToPrompt(editor, shape, files).catch((error) => {
                  toast.error(error instanceof Error ? error.message : "添加参考图失败")
                })
              }}
            />
            <div className="flex h-12 items-center gap-1.5 rounded-md border border-dashed border-border bg-muted/20 px-1.5">
              {referenceShapes.length === 0 ? <span className="min-w-0 flex-1 px-1 text-[11px] text-muted-foreground">添加图片作为生成参考</span> : referenceShapes.slice(0, 4).map((reference) => <ReferenceThumbnail key={reference.id} shape={reference} editor={editor} onRemove={() => removePromptReferences(editor, shape, [reference.id])} />)}
              {referenceShapes.length > 4 ? <span className="text-[10px] text-muted-foreground">+{referenceShapes.length - 4}</span> : null}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="ml-auto shrink-0 border border-dashed border-border text-muted-foreground"
                aria-label="添加参考图"
                title="添加参考图"
                disabled={props.status === "generating"}
                onClick={() => referenceInputRef.current?.click()}
              >
                <ImagePlus />
              </Button>
            </div>
          </section>
          <ModelPicker
            models={ai?.models ?? []}
            value={props.model}
            disabled={props.status === "generating"}
            onChange={(model) => updatePromptShape(editor, shape.id, { model })}
            onRefresh={
              ai
                ? async () => {
                    await ai.refreshModels()
                  }
                : undefined
            }
          />
          <section className="space-y-1.5">
            <span className="text-[11px] font-medium text-foreground/75">比例</span>
            <div className="grid grid-cols-5 gap-1">
              {ASPECT_RATIOS.filter((ratio) => ["1:1", "4:3", "16:9", "3:4", "9:16"].includes(ratio)).map((ratio) => <Button key={ratio} type="button" variant={props.aspectRatio === ratio ? "outline" : "ghost"} size="xs" className={props.aspectRatio === ratio ? "border-brand text-brand" : "text-muted-foreground"} onClick={() => updatePromptShape(editor, shape.id, { aspectRatio: ratio })}>{ASPECT_RATIO_LABELS[ratio]}</Button>)}
            </div>
          </section>
          <Button type="button" size="sm" disabled={!props.prompt.trim() || props.status === "generating"} className="w-full bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => dispatchNodeAction(editor, { type: "generate-prompt", shapeId: shape.id })}>
            {props.status === "generating" ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
            {props.status === "generating" ? <>生成中 · <GenerationElapsed /></> : "生成图片"}
          </Button>
          <p className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <span className="truncate">
              {props.mode === "image" ? `图生图 · 参考图 ${referenceShapes.length} 张` : "文生图"}
            </span>
            <span className="shrink-0 tabular-nums">
              {props.count} 张 · {RESOLUTION_LABELS[props.resolution]} · {describeSize({ ...props })}
            </span>
          </p>
        </div>
      </article>
    </HTMLContainer>
  )
}
