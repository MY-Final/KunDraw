import { errorFromResponse, NewApiError, toNewApiError } from "./errors"
import type { OpenAiModelListResponse } from "./types"

export const MODELS_TIMEOUT_MS = 20_000
export const GENERATION_TIMEOUT_MS = 20 * 60_000

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, "")
}

function parseJson(text: string): unknown {
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/**
 * Thin OpenAI-compatible client for a user-supplied NewAPI endpoint.
 * kunDraw has no backend, so the browser talks to the gateway directly.
 */
export class NewApiClient {
  readonly baseUrl: string
  private readonly apiKey: string

  constructor(config: { baseUrl: string; apiKey: string }) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl)
    this.apiKey = config.apiKey.trim()
  }

  get isConfigured() {
    return this.baseUrl.length > 0
  }

  endpoint(path: string) {
    return `${this.baseUrl}${path}`
  }

  private buildHeaders(extra?: HeadersInit) {
    const headers = new Headers(extra)
    if (this.apiKey) headers.set("Authorization", `Bearer ${this.apiKey}`)
    return headers
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    timeoutMs: number
  ): Promise<T> {
    if (!this.isConfigured) {
      throw new NewApiError("config", "尚未配置 NewAPI 地址")
    }

    const controller = new AbortController()
    const externalSignal = init.signal
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)
    const forwardAbort = () => controller.abort()

    // A caller-supplied signal (user pressed cancel) aborts the same request.
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort()
      else externalSignal.addEventListener("abort", forwardAbort, { once: true })
    }

    try {
      const response = await fetch(this.endpoint(path), {
        ...init,
        headers: this.buildHeaders(init.headers),
        signal: controller.signal,
      })

      const payload = parseJson(await response.text())

      if (!response.ok) {
        throw errorFromResponse(response.status, payload)
      }

      const body = payload as { error?: unknown } | undefined
      if (body && typeof body === "object" && body.error) {
        throw errorFromResponse(response.status, payload)
      }

      if (payload === undefined) {
        throw new NewApiError("bad-response", "服务端返回了无法解析的内容")
      }

      return payload as T
    } catch (error) {
      if (error instanceof NewApiError) throw error
      if (error instanceof DOMException && error.name === "AbortError") {
        if (!timedOut) throw new NewApiError("cancelled", "已取消本次生成")
        throw new NewApiError("timeout", `请求超时（${timeoutMs / 1000} 秒）`)
      }
      throw toNewApiError(error)
    } finally {
      clearTimeout(timer)
      externalSignal?.removeEventListener("abort", forwardAbort)
    }
  }

  requestJson<T>(path: string, body: unknown, timeoutMs: number, signal?: AbortSignal) {
    return this.request<T>(
      path,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      },
      timeoutMs
    )
  }

  requestForm<T>(path: string, form: FormData, timeoutMs: number, signal?: AbortSignal) {
    // Content-Type is intentionally left unset so the browser adds the multipart boundary.
    return this.request<T>(path, { method: "POST", body: form, signal }, timeoutMs)
  }

  async listModels(): Promise<string[]> {
    const payload = await this.request<OpenAiModelListResponse>(
      "/models",
      { method: "GET" },
      MODELS_TIMEOUT_MS
    )

    const ids = (payload.data ?? [])
      .map((item) => item.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0)

    return Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b))
  }
}
