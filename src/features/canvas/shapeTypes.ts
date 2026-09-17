import type { TLBaseShape, TLShapeId } from "tldraw"

import type { AspectRatio, BaseResolution, GenerationMode } from "@/features/ai/types"

export const PROMPT_SHAPE_TYPE = "kundraw-prompt" as const
export const IMAGE_SHAPE_TYPE = "kundraw-image" as const

export type PromptStatus = "idle" | "generating" | "error"

export type PromptShapeProps = {
  w: number
  h: number
  prompt: string
  model: string
  mode: GenerationMode
  aspectRatio: AspectRatio
  resolution: BaseResolution
  count: number
  referenceImages: TLShapeId[]
  status: PromptStatus
  generatedImageIds: TLShapeId[]
}

export type ImageShapeProps = {
  w: number
  h: number
  assetId: string
  imageUrl: string
  /** Normalized crop box; null means the whole image is shown. */
  crop: { topLeft: { x: number; y: number }; bottomRight: { x: number; y: number } } | null
  name: string
  mimeType: string
  model: string
  prompt: string
  createdAt: number
  sourcePromptId: string
}

export type PromptShape = TLBaseShape<typeof PROMPT_SHAPE_TYPE, PromptShapeProps>
export type ImageShape = TLBaseShape<typeof IMAGE_SHAPE_TYPE, ImageShapeProps>

export type RelationType = "generation" | "reference"

export type RelationMeta = {
  sourceShapeId: TLShapeId
  targetShapeId: TLShapeId
  relationType: RelationType
}

declare module "@tldraw/tlschema" {
  interface TLGlobalShapePropsMap {
    [PROMPT_SHAPE_TYPE]: PromptShapeProps
    [IMAGE_SHAPE_TYPE]: ImageShapeProps
  }
}
