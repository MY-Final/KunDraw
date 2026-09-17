import { NewApiError } from "./errors"
import { GENERATION_TIMEOUT_MS, type NewApiClient } from "./client"
import type {
  GenerateImageRequest,
  GeneratedImagePayload,
  OpenAiImageResponse,
} from "./types"

const FALLBACK_MIME = "image/png"

const BASE64_MAGIC: Array<[string, string]> = [
  ["iVBORw0KGgo", "image/png"],
  ["/9j/", "image/jpeg"],
  ["R0lGOD", "image/gif"],
  ["UklGR", "image/webp"],
]

/** base64 payloads carry no mime type, so sniff it from the magic bytes. */
function sniffMime(base64: string) {
  for (const [prefix, mime] of BASE64_MAGIC) {
    if (base64.startsWith(prefix)) return mime
  }
  return FALLBACK_MIME
}

function buildFields(request: GenerateImageRequest) {
  const fields: Record<string, unknown> = {
    model: request.model,
    prompt: request.prompt,
  }

  if (typeof request.count === "number" && request.count > 0) {
    fields.n = request.count
  }
  if (request.size) {
    fields.size = request.size
  }
  if (request.responseFormat) {
    fields.response_format = request.responseFormat
  }

  return { ...fields, ...(request.extraParams ?? {}) }
}

function appendFormValue(form: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return
  form.append(key, typeof value === "string" ? value : JSON.stringify(value))
}

function toPayloads(response: OpenAiImageResponse): GeneratedImagePayload[] {
  const data = Array.isArray(response.data) ? response.data : []

  const payloads: GeneratedImagePayload[] = []

  for (const item of data) {
    if (item.b64_json) {
      payloads.push({
        b64Json: item.b64_json,
        mimeType: sniffMime(item.b64_json),
        revisedPrompt: item.revised_prompt,
      })
    } else if (item.url) {
      payloads.push({
        url: item.url,
        mimeType: FALLBACK_MIME,
        revisedPrompt: item.revised_prompt,
      })
    }
  }

  if (payloads.length === 0) {
    throw new NewApiError("bad-response", "接口没有返回任何图片", {
      detail: JSON.stringify(response).slice(0, 500),
    })
  }

  return payloads
}

/**
 * Calls the OpenAI-compatible Images API.
 *
 * - no references   -> POST {base}/images/generations  (JSON body)
 * - with references -> POST {base}/images/edits        (multipart/form-data)
 */
export async function generateImages(
  client: NewApiClient,
  request: GenerateImageRequest
): Promise<GeneratedImagePayload[]> {
  const timeoutMs = request.timeoutMs ?? GENERATION_TIMEOUT_MS
  const fields = buildFields(request)
  const references = request.references ?? []

  if (references.length === 0) {
    const response = await client.requestJson<OpenAiImageResponse>(
      "/images/generations",
      fields,
      timeoutMs
    )
    return toPayloads(response)
  }

  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    appendFormValue(form, key, value)
  }

  const fieldName = references.length > 1 ? "image[]" : "image"
  for (const reference of references) {
    form.append(fieldName, reference.blob, reference.name)
  }

  const response = await client.requestForm<OpenAiImageResponse>(
    "/images/edits",
    form,
    timeoutMs
  )

  return toPayloads(response)
}
