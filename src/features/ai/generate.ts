import { NewApiClient } from "@/api/newapi/client"
import { describeNewApiError, toNewApiError } from "@/api/newapi/errors"
import { generateImages } from "@/api/newapi/images"
import type { NewApiConfig } from "@/api/newapi/types"

import { PROMPT_MAX_LENGTH } from "./constants"
import { getImageModel, resolveSize } from "./models"
import type {
  AiError,
  GeneratedImage,
  GeneratedImageSource,
  ImageModel,
  ReferenceImage,
} from "./types"

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",")
  const mimeType = /:(.*?);/.exec(header ?? "")?.[1] ?? "image/png"
  const binary = window.atob(base64 ?? "")
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return new Blob([bytes], { type: mimeType })
}

function toDataUrl(payload: { b64Json?: string; url?: string; mimeType?: string }) {
  if (payload.b64Json) {
    return `data:${payload.mimeType ?? "image/png"};base64,${payload.b64Json}`
  }
  return payload.url ?? null
}

function createId() {
  return `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function clampCount(model: ImageModel, count: number) {
  const supported = model.capabilities.supportedCounts
  if (supported.length === 0) return count
  return Math.min(count, Math.max(...supported))
}

export type GenerationInput = {
  config: NewApiConfig
  model: ImageModel
  prompt: string
  size?: string
  count: number
  references: ReferenceImage[]
  source: GeneratedImageSource
}

/** Pure request assembly: only fields the selected model declares are included. */
export function buildGenerationInput(params: {
  config: NewApiConfig
  models: ImageModel[]
  modelId: string
  prompt: string
  aspectRatio: GeneratedImageSource["aspectRatio"]
  count: number
  references: ReferenceImage[]
}): GenerationInput {
  const model = getImageModel(params.models, params.modelId)
  const usesReferences =
    params.references.length > 0 && model.capabilities.imageToImage
  const prompt = params.prompt.trim().slice(0, PROMPT_MAX_LENGTH)

  return {
    config: params.config,
    model,
    prompt,
    size: resolveSize(model, params.aspectRatio),
    count: clampCount(model, usesReferences ? 1 : params.count),
    references: usesReferences ? params.references : [],
    source: {
      prompt,
      modelId: model.id,
      modelName: model.name,
      aspectRatio: params.aspectRatio,
      count: params.count,
    },
  }
}

export async function runGeneration(
  input: GenerationInput
): Promise<{ images: GeneratedImage[] } | { error: AiError }> {
  try {
    const client = new NewApiClient(input.config)

    const payloads = await generateImages(client, {
      model: input.model.id,
      prompt: input.prompt,
      count: input.count,
      size: input.size,
      responseFormat:
        input.model.supportsResponseFormat === false
          ? undefined
          : input.config.responseFormat,
      extraParams: input.model.extraParams,
      references: input.references.map((reference) => ({
        blob: dataUrlToBlob(reference.dataUrl),
        name: reference.name,
      })),
    })

    const images = payloads.flatMap((payload) => {
      const url = toDataUrl(payload)
      if (!url) return []
      return [
        {
          id: createId(),
          url,
          createdAt: Date.now(),
          source: input.source,
          revisedPrompt: payload.revisedPrompt,
        } satisfies GeneratedImage,
      ]
    })

    if (images.length === 0) {
      return {
        error: { kind: "bad-response", title: "接口没有返回可用的图片", hints: [] },
      }
    }

    return { images }
  } catch (error) {
    // Keep the full error in the console for debugging; the panel shows a summary.
    console.error("[kunDraw] 图片生成失败", error)
    return { error: describeNewApiError(toNewApiError(error), "generate") }
  }
}
