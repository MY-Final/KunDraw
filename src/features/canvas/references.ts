import type { Editor, TLImageAsset, TLShapeId } from "tldraw"

import { addImageToCanvas } from "@/features/ai/canvas"
import { MAX_REFERENCE_BYTES } from "@/features/ai/constants"
import { DEFAULT_REFERENCE_ROLE, REFERENCE_ROLES } from "@/features/ai/constants"
import type { GeneratedImage, ReferenceImage, ReferenceRole } from "@/features/ai/types"

import { createRelation } from "./relations"
import {
  IMAGE_SHAPE_TYPE,
  PROMPT_SHAPE_TYPE,
  type ImageShape,
  type PromptShape,
} from "./shapeTypes"

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("读取图片失败"))
    reader.readAsDataURL(file)
  })
}

export function referenceFromImageShape(
  editor: Editor,
  shape: ImageShape
): ReferenceImage | null {
  const asset = shape.props.assetId
    ? editor.getAsset(shape.props.assetId as TLImageAsset["id"])
    : null
  const assetUrl = asset && "src" in asset.props ? asset.props.src : null
  const dataUrl = assetUrl || shape.props.imageUrl
  if (!dataUrl) return null

  return {
    id: `ref_${shape.id}`,
    name: shape.props.name,
    mimeType: shape.props.mimeType,
    dataUrl,
    bytes: 0,
    role: readReferenceRole(shape),
  }
}

/** Roles live in shape meta so no props migration is needed. */
export function readReferenceRole(shape: ImageShape): ReferenceRole {
  const stored = shape.meta.kundrawReferenceRole
  return typeof stored === "string" && REFERENCE_ROLES.includes(stored as ReferenceRole)
    ? (stored as ReferenceRole)
    : DEFAULT_REFERENCE_ROLE
}

export function setReferenceRole(editor: Editor, shape: ImageShape, role: ReferenceRole) {
  editor.markHistoryStoppingPoint("kundraw:reference-role")
  editor.updateShape<ImageShape>({
    id: shape.id,
    type: IMAGE_SHAPE_TYPE,
    meta: { ...shape.meta, kundrawReferenceRole: role },
  })
  editor.focus()
}

export function referencesForPrompt(editor: Editor, shape: PromptShape) {
  return shape.props.referenceImages.flatMap((id) => {
    const image = editor.getShape<ImageShape>(id as TLShapeId)
    if (!image || image.type !== IMAGE_SHAPE_TYPE) return []
    const reference = referenceFromImageShape(editor, image)
    return reference ? [reference] : []
  })
}

function relationArrowIds(
  editor: Editor,
  promptId: TLShapeId,
  imageIds: Set<string>
) {
  return editor.getCurrentPageShapes().flatMap((shape) => {
    if (shape.type !== "arrow") return []
    const relation = shape.meta.kundrawRelation
    if (!relation || typeof relation !== "object") return []
    const metadata = relation as Record<string, unknown>
    return metadata.relationType === "reference" &&
      metadata.targetShapeId === promptId &&
      typeof metadata.sourceShapeId === "string" &&
      imageIds.has(metadata.sourceShapeId)
      ? [shape.id]
      : []
  })
}

export function removePromptReferences(
  editor: Editor,
  prompt: PromptShape,
  imageIds: TLShapeId[]
) {
  const removed = new Set<string>(imageIds)
  const arrows = relationArrowIds(editor, prompt.id, removed)
  editor.markHistoryStoppingPoint("kundraw:remove-references")
  if (arrows.length > 0) editor.deleteShapes(arrows)
  editor.updateShape<PromptShape>({
    id: prompt.id,
    type: PROMPT_SHAPE_TYPE,
    props: {
      referenceImages: prompt.props.referenceImages.filter((id) => !removed.has(id)),
    },
  })
}

export async function addReferenceFilesToPrompt(
  editor: Editor,
  prompt: PromptShape,
  files: File[]
) {
  const images = files.filter((file) => file.type.startsWith("image/"))
  const tooLarge = images.find((file) => file.size > MAX_REFERENCE_BYTES)
  if (tooLarge) throw new Error(`参考图过大：${tooLarge.name}`)

  const createdIds: TLShapeId[] = []
  for (let index = 0; index < images.length; index += 1) {
    const file = images[index]
    const generated: GeneratedImage = {
      id: `local_${Date.now().toString(36)}_${index}`,
      url: await readFileAsDataUrl(file),
      createdAt: Date.now(),
      source: { prompt: "", model: "", channelName: "本地", mode: "image", count: 1 },
    }
    const id = await addImageToCanvas(editor, generated, {
      point: { x: prompt.x - 520, y: prompt.y + index * 360 },
    })
    if (!id) continue
    createdIds.push(id)
    createRelation(editor, id, prompt.id, "reference")
  }

  const current = editor.getShape<PromptShape>(prompt.id)
  if (current?.type === PROMPT_SHAPE_TYPE && createdIds.length > 0) {
    editor.updateShape<PromptShape>({
      id: current.id,
      type: PROMPT_SHAPE_TYPE,
      props: {
        mode: "image",
        referenceImages: [...current.props.referenceImages, ...createdIds],
      },
    })
    editor.select(current.id)
  }
}
