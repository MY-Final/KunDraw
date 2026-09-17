import {
  AssetRecordType,
  type Editor,
  type TLImageAsset,
  type TLShapePartial,
  type TLShapeId,
  type VecModel,
} from "tldraw"

import { IMAGE_SHAPE_TYPE, type ImageShape } from "@/features/canvas/shapeTypes"
import type { GeneratedImage } from "./types"

/** Keeps large generations from dominating the canvas. */
const MAX_CANVAS_SIDE = 512
const SELECTION_GAP = 56

export function measureImage(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const w = image.naturalWidth
      const h = image.naturalHeight
      if (!w || !h) {
        reject(new Error("无法读取图片尺寸"))
        return
      }
      resolve({ w, h })
    }
    image.onerror = () => reject(new Error("无法加载图片"))
    image.src = src
  })
}

function mimeFromUrl(url: string) {
  const dataMime = /^data:([^;,]+)/.exec(url)?.[1]
  if (dataMime) return dataMime
  const extension = /\.(png|jpe?g|webp|gif|avif)($|\?)/i.exec(url)?.[1]?.toLowerCase()
  if (!extension) return "image/png"
  return extension === "jpg" ? "image/jpeg" : `image/${extension}`
}

function fitSize(w: number, h: number) {
  const scale = Math.min(1, MAX_CANVAS_SIDE / Math.max(w, h))
  return { w: Math.round(w * scale), h: Math.round(h * scale) }
}

/**
 * Places a generated image on the canvas: create the asset, then the image shape
 * at the viewport center (or beside the current selection), and select it.
 */
export async function addImageToCanvas(
  editor: Editor,
  image: GeneratedImage,
  options: { sourcePromptId?: TLShapeId; point?: VecModel } = {}
) {
  const natural = await measureImage(image.url)
  const size = fitSize(natural.w, natural.h)

  const selectionBounds = editor.getSelectionPageBounds()
  const viewport = editor.getViewportPageBounds()

  const point = options.point ?? (selectionBounds
    ? { x: selectionBounds.maxX + SELECTION_GAP, y: selectionBounds.minY }
    : { x: viewport.center.x - size.w / 2, y: viewport.center.y - size.h / 2 })

  const asset = AssetRecordType.create({
    id: AssetRecordType.createId(),
    type: "image",
    props: {
      name: `kundraw-${image.id}`,
      src: image.url,
      w: size.w,
      h: size.h,
      mimeType: mimeFromUrl(image.url),
      isAnimated: false,
    },
  })

  let createdShapeId: string | null = null

  editor.run(() => {
    editor.markHistoryStoppingPoint("kundraw:add-generated-image")
    editor.createAssets([asset])

    const partial = editor
      .getShapeUtil<ImageShape>(IMAGE_SHAPE_TYPE)
      .createShapeForAsset?.(asset as TLImageAsset, point) as
      | TLShapePartial<ImageShape>
      | null
      | undefined
    if (!partial) return

    editor.createShape<ImageShape>({
      ...partial,
      type: IMAGE_SHAPE_TYPE,
      props: {
        ...partial.props,
        imageUrl: image.url,
        name: `kundraw-${image.id}`,
        mimeType: mimeFromUrl(image.url),
        model: image.source.model,
        prompt: image.source.prompt,
        createdAt: image.createdAt,
        sourcePromptId: String(options.sourcePromptId ?? ""),
      },
    })
    createdShapeId = partial.id
  })

  if (createdShapeId) {
    editor.select(createdShapeId)
    editor.focus()
  }

  return createdShapeId
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a")
  link.href = href
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
}

function filenameFor(image: GeneratedImage) {
  const extension = mimeFromUrl(image.url).split("/")[1]?.replace("jpeg", "jpg") ?? "png"
  return `kundraw-${image.id}.${extension}`
}

/**
 * Downloads a generated image. Remote URLs are fetched to a blob so the browser
 * saves the file; when CORS blocks that, the image is opened instead so the user
 * can still save it. Returns how the download was handled.
 */
export async function downloadImage(image: GeneratedImage) {
  const filename = filenameFor(image)

  if (image.url.startsWith("data:")) {
    triggerDownload(image.url, filename)
    return "downloaded" as const
  }

  try {
    const response = await fetch(image.url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    triggerDownload(objectUrl, filename)
    URL.revokeObjectURL(objectUrl)
    return "downloaded" as const
  } catch (error) {
    console.warn("[kunDraw] 直接下载失败，改为打开图片", error)
    window.open(image.url, "_blank", "noopener,noreferrer")
    return "opened" as const
  }
}
