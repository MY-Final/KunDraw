export type AspectRatio = "1:1" | "4:3" | "16:9" | "3:4" | "9:16"

export type ImageCount = 1 | 2 | 4

export type GenerationMode = "text" | "image"

export type ImageModelCapabilities = {
  textToImage: boolean
  imageToImage: boolean
  multipleReferences: boolean
  maxReferences?: number
  supportedAspectRatios: AspectRatio[]
  supportedCounts: ImageCount[]
}

export type ImageModel = {
  id: string
  name: string
  description?: string
  recommended?: boolean
  capabilities: ImageModelCapabilities
  /**
   * Maps a UI aspect ratio to the API's `size` field. Omit to send no `size` at all,
   * which is how models that only accept fixed sizes are supported.
   */
  sizeMap?: Partial<Record<AspectRatio, string>>
  /** Whether the gateway accepts `response_format`. Defaults to true. */
  supportsResponseFormat?: boolean
  /** Extra request fields, merged into the body only for this model. */
  extraParams?: Record<string, unknown>
}

export type ReferenceImage = {
  id: string
  name: string
  mimeType: string
  dataUrl: string
  bytes: number
}

export type GeneratedImageSource = {
  prompt: string
  modelId: string
  modelName: string
  aspectRatio: AspectRatio
  count: number
}

export type GeneratedImage = {
  id: string
  url: string
  createdAt: number
  source: GeneratedImageSource
  revisedPrompt?: string
}

export type AiError = {
  kind: string
  title: string
  hints: string[]
  detail?: string
}

export type GenerationSettings = {
  modelId: string
  aspectRatio: AspectRatio
  count: ImageCount
}
