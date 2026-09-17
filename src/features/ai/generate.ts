import { NewApiClient } from "@/api/newapi/client"
import { describeNewApiError, toNewApiError } from "@/api/newapi/errors"
import { generateImages } from "@/api/newapi/images"

import { computeSize } from "./constants"
import type {
  AiError,
  Channel,
  GeneratedImage,
  GeneratedImageSource,
  GenerationSettings,
  ReferenceImage,
} from "./types"

export async function imageSourceToBlob(source: string): Promise<Blob> {
  if (!source.startsWith("data:")) {
    const response = await fetch(source)
    if (!response.ok) throw new Error(`无法读取参考图（HTTP ${response.status}）`)
    return response.blob()
  }

  const [header, base64] = source.split(",")
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

export type GenerationInput = {
  channel: Channel
  model: string
  prompt: string
  count: number
  size?: string
  references: ReferenceImage[]
  source: GeneratedImageSource
}

/** Pure request assembly — the mode decides whether references are sent. */
export function buildGenerationInput(params: {
  channel: Channel
  model: string
  settings: GenerationSettings
  prompt: string
  references: ReferenceImage[]
}): GenerationInput {
  const { channel, model, settings, prompt, references } = params
  const sendsReferences = settings.mode === "image" && references.length > 0

  return {
    channel,
    model,
    prompt,
    count: settings.count,
    size: computeSize(settings),
    references: sendsReferences ? references : [],
    source: {
      prompt,
      model,
      channelName: channel.name || channel.baseUrl,
      mode: settings.mode,
      count: settings.count,
    },
  }
}

export async function runGeneration(
  input: GenerationInput
): Promise<{ images: GeneratedImage[] } | { error: AiError }> {
  try {
    const client = new NewApiClient(input.channel)

    const references = await Promise.all(
      input.references.map(async (reference) => ({
        blob: await imageSourceToBlob(reference.dataUrl),
        name: reference.name,
      }))
    )

    const payloads = await generateImages(client, {
      model: input.model,
      prompt: input.prompt,
      count: input.count,
      size: input.size,
      references,
    })

    const images = payloads.flatMap((payload) => {
      const url = toDataUrl(payload)
      if (!url) return []
      return [
        {
          id: `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
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
