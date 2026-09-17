import {
  createShapeId,
  type Box,
  type Editor,
  type TLShapeId,
  type VecModel,
} from "tldraw"

import { addImageToCanvas } from "@/features/ai/canvas"
import type { AiContextValue } from "@/features/ai/context"
import type { GeneratedImage } from "@/features/ai/types"

import {
  IMAGE_SHAPE_TYPE,
  PROMPT_SHAPE_TYPE,
  type ImageShape,
  type PromptShape,
  type PromptShapeProps,
} from "./shapeTypes"
import { createRelation } from "./relations"
import { referencesForPrompt } from "./references"

const NODE_GAP = 72

/**
 * New nodes go to the right of the selection, or below it when the right side
 * would fall outside the visible canvas (for example under the right panel).
 */
function nextNodePoint(selection: Box | null, viewport: Box, defaults: PromptShapeProps): VecModel {
  if (!selection) {
    return {
      x: viewport.center.x - defaults.w / 2,
      y: viewport.center.y - defaults.h / 2,
    }
  }

  const rightX = selection.maxX + NODE_GAP
  if (rightX + defaults.w <= viewport.maxX) return { x: rightX, y: selection.minY }
  return { x: selection.minX, y: selection.maxY + NODE_GAP }
}

export function createPromptNode(
  editor: Editor,
  options: {
    point?: VecModel
    props?: Partial<PromptShapeProps>
    select?: boolean
  } = {}
) {
  const id = createShapeId()
  const defaults = editor.getShapeUtil<PromptShape>(PROMPT_SHAPE_TYPE).getDefaultProps()
  const viewport = editor.getViewportPageBounds()
  const selection = editor.getSelectionPageBounds()
  const point = options.point ?? nextNodePoint(selection, viewport, defaults)

  editor.markHistoryStoppingPoint("kundraw:create-prompt")
  editor.createShape<PromptShape>({
    id,
    type: PROMPT_SHAPE_TYPE,
    x: point.x,
    y: point.y,
    props: {
      ...defaults,
      ...options.props,
    },
  })

  if (options.select !== false) editor.select(id)
  editor.zoomToSelectionIfOffscreen(24, {
    targetZoom: editor.getZoomLevel(),
    animation: { duration: 200 },
  })
  editor.focus()
  return id
}

export function createReferencePrompt(
  editor: Editor,
  imageShapeId: TLShapeId,
  fallbackModel = ""
) {
  const image = editor.getShape<ImageShape>(imageShapeId)
  if (!image || image.type !== IMAGE_SHAPE_TYPE) return null

  const promptDefaults = editor.getShapeUtil<PromptShape>(PROMPT_SHAPE_TYPE).getDefaultProps()
  const sourcePrompt = image.props.sourcePromptId
    ? editor.getShape<PromptShape>(image.props.sourcePromptId as TLShapeId)
    : null
  const previous = sourcePrompt?.type === PROMPT_SHAPE_TYPE ? sourcePrompt : null
  const promptId = createPromptNode(editor, {
    point: {
      x: image.x + Math.max(image.props.w - promptDefaults.w, 0) / 2,
      y: image.y + image.props.h + NODE_GAP,
    },
    props: {
      referenceImages: [image.id],
      mode: "image",
      model: image.props.model || previous?.props.model || fallbackModel,
      aspectRatio: previous?.props.aspectRatio ?? promptDefaults.aspectRatio,
      resolution: previous?.props.resolution ?? promptDefaults.resolution,
      count: previous?.props.count ?? promptDefaults.count,
    },
  })
  createRelation(editor, image.id, promptId, "reference")
  return promptId
}

export async function addGeneratedImagesForPrompt(
  editor: Editor,
  prompt: PromptShape,
  images: GeneratedImage[]
) {
  const createdIds: TLShapeId[] = []
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index]
    const id = await addImageToCanvas(editor, image, {
      sourcePromptId: prompt.id,
      point: {
        x: prompt.x + prompt.props.w + NODE_GAP,
        y: prompt.y + index * 360,
      },
    })
    if (!id) continue
    createdIds.push(id)
    createRelation(editor, prompt.id, id, "generation")
  }

  if (createdIds.length > 0) {
    const current = editor.getShape<PromptShape>(prompt.id)
    if (current?.type === PROMPT_SHAPE_TYPE) {
      editor.updateShape<PromptShape>({
        id: current.id,
        type: PROMPT_SHAPE_TYPE,
        props: {
          generatedImageIds: [...current.props.generatedImageIds, ...createdIds],
          status: "idle",
        },
      })
    }
    editor.select(...createdIds)
  }

  return createdIds
}

export async function generatePromptNode(
  editor: Editor,
  ai: AiContextValue,
  shapeId: TLShapeId
) {
  const prompt = editor.getShape<PromptShape>(shapeId)
  if (!prompt || prompt.type !== PROMPT_SHAPE_TYPE || !prompt.props.prompt.trim()) return []

  const references = referencesForPrompt(editor, prompt)
  editor.updateShape<PromptShape>({
    id: prompt.id,
    type: PROMPT_SHAPE_TYPE,
    props: { status: "generating" },
  })

  const images = await ai.generate({
    prompt: prompt.props.prompt,
    model: prompt.props.model,
    aspectRatio: prompt.props.aspectRatio,
    resolution: prompt.props.resolution,
    count: prompt.props.count,
    mode: prompt.props.mode,
    references,
  })

  if (images.length === 0) {
    editor.updateShape<PromptShape>({
      id: prompt.id,
      type: PROMPT_SHAPE_TYPE,
      props: { status: "error" },
    })
    return []
  }

  await addGeneratedImagesForPrompt(editor, prompt, images)
  return images
}
