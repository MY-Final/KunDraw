export type AspectRatio = "auto" | "1:1" | "4:3" | "3:2" | "16:9" | "21:9" | "3:4" | "2:3" | "9:16"

/** Base values are the long edge in pixels; the short edge follows the ratio. */
export type BaseResolution = 512 | 1024 | 1536 | 2048 | 3840

export type GenerationMode = "text" | "image"

/** A NewAPI endpoint the user configured. kunDraw never proxies or stores these remotely. */
export type Channel = {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  /** Model ids discovered from this channel's `/models`, cached locally. */
  models: string[]
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
  model: string
  channelName: string
  mode: GenerationMode
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
  model: string
  mode: GenerationMode
  aspectRatio: AspectRatio
  resolution: BaseResolution
  count: number
}
