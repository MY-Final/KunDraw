import { useCallback, useEffect, useRef, useState } from "react"
import { Eraser, LoaderCircle, Sparkles } from "lucide-react"
import { toast } from "sonner"
import type { TLShapeId } from "tldraw"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { ModelPicker } from "@/features/ai/components/ModelPicker"
import { useAi } from "@/features/ai/useAi"
import type { GeneratedImage, ReferenceImage } from "@/features/ai/types"

export type InpaintTarget = {
  shapeId: TLShapeId
  src: string
  name: string
  mimeType: string
  prompt: string
  model: string
}

const BRUSH_MIN = 8
const BRUSH_MAX = 240
const PAINT_COLOR = "rgba(239,68,68,0.6)"

function loadImageSize(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error("无法读取图片尺寸"))
    image.src = src
  })
}

/** OpenAI-compatible masks are opaque except where the image should be regenerated. */
function maskFromPaint(paint: HTMLCanvasElement) {
  const mask = document.createElement("canvas")
  mask.width = paint.width
  mask.height = paint.height

  const context = mask.getContext("2d")
  if (!context) return Promise.resolve<Blob | null>(null)

  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, mask.width, mask.height)
  context.globalCompositeOperation = "destination-out"
  context.drawImage(paint, 0, 0)

  return new Promise<Blob | null>((resolve) => mask.toBlob(resolve, "image/png"))
}

/** Mounted per image, so opening the dialog for another image resets the editor. */
function InpaintEditor({
  target,
  busy,
  onClose,
  onGenerate,
}: {
  target: InpaintTarget
  busy: boolean
  onClose: () => void
  onGenerate: (options: { prompt: string; model: string; mask: Blob }) => void
}) {
  const ai = useAi()
  const paintRef = useRef<HTMLCanvasElement>(null)
  const paintingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [brush, setBrush] = useState(64)
  const [prompt, setPrompt] = useState(target.prompt)
  const [model, setModel] = useState(target.model || ai.settings.model)
  const [strokes, setStrokes] = useState(0)
  const [preparing, setPreparing] = useState(true)

  useEffect(() => {
    let cancelled = false

    void loadImageSize(target.src)
      .then((natural) => {
        if (cancelled) return
        setSize(natural)
        setPreparing(false)
      })
      .catch(() => {
        if (cancelled) return
        setPreparing(false)
        toast.error("无法读取这张图片")
      })

    return () => {
      cancelled = true
    }
  }, [target.src])

  useEffect(() => {
    const paint = paintRef.current
    if (!paint || size.width === 0) return
    paint.width = size.width
    paint.height = size.height
    paint.getContext("2d")?.clearRect(0, 0, paint.width, paint.height)
  }, [size])

  const paintFrom = useCallback(
    (from: { x: number; y: number } | null, to: { x: number; y: number }) => {
      const context = paintRef.current?.getContext("2d")
      if (!context) return

      context.globalCompositeOperation = "source-over"
      context.strokeStyle = PAINT_COLOR
      context.fillStyle = PAINT_COLOR
      context.lineWidth = brush
      context.lineCap = "round"
      context.lineJoin = "round"

      if (!from) {
        context.beginPath()
        context.arc(to.x, to.y, brush / 2, 0, Math.PI * 2)
        context.fill()
        return
      }

      context.beginPath()
      context.moveTo(from.x, from.y)
      context.lineTo(to.x, to.y)
      context.stroke()
    },
    [brush]
  )

  const toCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const paint = event.currentTarget
    const rect = paint.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * paint.width,
      y: ((event.clientY - rect.top) / rect.height) * paint.height,
    }
  }

  const clearMask = () => {
    const paint = paintRef.current
    paint?.getContext("2d")?.clearRect(0, 0, paint.width, paint.height)
    lastPointRef.current = null
    setStrokes(0)
  }

  const start = async () => {
    if (busy) return
    if (!prompt.trim()) {
      toast.error("请先输入提示词")
      return
    }
    if (!model.trim()) {
      toast.error("请先选择或输入模型")
      return
    }
    if (strokes === 0) {
      toast.info("请先在图片上涂抹要重新生成的范围")
      return
    }

    const paint = paintRef.current
    const mask = paint ? await maskFromPaint(paint) : null
    if (!mask) {
      toast.error("无法生成蒙版")
      return
    }

    onGenerate({ prompt, model, mask })
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40 p-2">
        {preparing ? (
          <span className="py-10 text-xs text-muted-foreground">正在读取图片…</span>
        ) : (
          <div className="relative max-h-[46vh] max-w-full">
            <img
              src={target.src}
              alt={target.name}
              draggable={false}
              className="block max-h-[46vh] w-auto max-w-full select-none"
            />
            <canvas
              ref={paintRef}
              aria-label="蒙版涂抹层"
              className="absolute inset-0 size-full cursor-crosshair touch-none"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                paintingRef.current = true
                const point = toCanvasPoint(event)
                lastPointRef.current = point
                paintFrom(null, point)
                setStrokes((count) => count + 1)
              }}
              onPointerMove={(event) => {
                if (!paintingRef.current) return
                const point = toCanvasPoint(event)
                paintFrom(lastPointRef.current, point)
                lastPointRef.current = point
              }}
              onPointerUp={() => {
                paintingRef.current = false
                lastPointRef.current = null
              }}
              onPointerCancel={() => {
                paintingRef.current = false
                lastPointRef.current = null
              }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="shrink-0 text-[11px] text-muted-foreground">画笔</span>
        <Slider
          value={[brush]}
          min={BRUSH_MIN}
          max={BRUSH_MAX}
          step={2}
          onValueChange={(value) => setBrush(Array.isArray(value) ? value[0] : value)}
          className="flex-1"
        />
        <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
          {brush}
        </span>
        <Button variant="outline" size="xs" onClick={clearMask}>
          <Eraser />
          清除涂抹
        </Button>
      </div>

      <Textarea
        aria-label="重绘提示词"
        value={prompt}
        maxLength={2000}
        placeholder="描述这块区域要变成什么…"
        onChange={(event) => setPrompt(event.target.value)}
        className="min-h-16 text-sm"
      />

      <ModelPicker
        models={ai.models}
        value={model}
        disabled={busy}
        onChange={setModel}
        onRefresh={async () => {
          await ai.refreshModels()
        }}
      />

      <DialogFooter>
        <Button variant="outline" size="sm" disabled={busy} onClick={onClose}>
          取消
        </Button>
        <Button size="sm" disabled={busy} onClick={() => void start()}>
          {busy ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
          {busy ? "重绘中" : "开始重绘"}
        </Button>
      </DialogFooter>
    </>
  )
}

export function InpaintDialog({
  target,
  onClose,
  onApply,
}: {
  target: InpaintTarget | null
  onClose: () => void
  onApply: (target: InpaintTarget, images: GeneratedImage[]) => void
}) {
  const ai = useAi()
  const [busy, setBusy] = useState(false)

  const generate = useCallback(
    async (target: InpaintTarget, options: { prompt: string; model: string; mask: Blob }) => {
      const reference: ReferenceImage = {
        id: `ref_${target.shapeId}`,
        name: target.name,
        mimeType: target.mimeType,
        dataUrl: target.src,
        bytes: 0,
        role: "content",
      }

      setBusy(true)
      try {
        const images = await ai.generate({
          prompt: options.prompt,
          model: options.model,
          mode: "image",
          count: 1,
          aspectRatio: "auto",
          references: [reference],
          mask: options.mask,
        })

        if (images.length > 0) onApply(target, images)
      } finally {
        setBusy(false)
      }
    },
    [ai, onApply]
  )

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>局部重绘</DialogTitle>
          <DialogDescription>
            在图片上涂抹要重画的范围，其余部分保持不变。需要渠道支持带 mask 的图片编辑。
          </DialogDescription>
        </DialogHeader>

        {target ? (
          <div className="flex min-h-0 flex-col gap-3">
            <InpaintEditor
              key={target.shapeId}
              target={target}
              busy={busy}
              onClose={onClose}
              onGenerate={(options) => void generate(target, options)}
            />
          </div>
        ) : (
          <div />
        )}
      </DialogContent>
    </Dialog>
  )
}
