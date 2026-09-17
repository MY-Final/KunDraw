export type ImageResponseFormat = "b64_json" | "url"

/** What we ask the gateway to return for generated images. */
export type NewApiConfig = {
  baseUrl: string
  apiKey: string
  responseFormat: ImageResponseFormat
}

export type ReferenceFile = {
  blob: Blob
  name: string
}

export type GenerateImageRequest = {
  model: string
  prompt: string
  count?: number
  size?: string
  responseFormat?: ImageResponseFormat
  /** Extra body fields, only supplied by models that declare them. */
  extraParams?: Record<string, unknown>
  references?: ReferenceFile[]
  /** Inpainting mask: transparent areas mark the region to regenerate. */
  mask?: Blob
  timeoutMs?: number
}

export type GeneratedImagePayload = {
  url?: string
  b64Json?: string
  mimeType?: string
  revisedPrompt?: string
}

type OpenAiImageDatum = {
  url?: string
  b64_json?: string
  revised_prompt?: string
}

export type OpenAiImageResponse = {
  created?: number
  data?: OpenAiImageDatum[]
  error?: OpenAiErrorBody
}

export type OpenAiErrorBody = {
  message?: string
  type?: string
  code?: string | number
}

export type OpenAiModelListResponse = {
  data?: Array<{ id?: string }>
  error?: OpenAiErrorBody
}
