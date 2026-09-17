import type { OpenAiErrorBody } from "./types"

export type NewApiErrorKind =
  | "config"
  | "auth"
  | "forbidden"
  | "not-found"
  | "rate-limit"
  | "server"
  | "network"
  | "timeout"
  | "cancelled"
  | "bad-response"
  | "api"

export class NewApiError extends Error {
  readonly kind: NewApiErrorKind
  readonly status?: number
  readonly detail?: string

  constructor(
    kind: NewApiErrorKind,
    message: string,
    options?: { status?: number; detail?: string }
  ) {
    super(message)
    this.name = "NewApiError"
    this.kind = kind
    this.status = options?.status
    this.detail = options?.detail
  }
}

function kindFromStatus(status: number): NewApiErrorKind {
  if (status === 401) return "auth"
  if (status === 403) return "forbidden"
  if (status === 404) return "not-found"
  if (status === 408) return "timeout"
  if (status === 429) return "rate-limit"
  if (status >= 500) return "server"
  return "api"
}

function statusMessage(status: number) {
  switch (kindFromStatus(status)) {
    case "auth":
      return "API Key 无效或已过期"
    case "forbidden":
      return "没有访问该模型的权限"
    case "not-found":
      return "API 地址或接口路径不正确"
    case "timeout":
      return "请求超时"
    case "rate-limit":
      return "请求过于频繁，请稍后重试"
    case "server":
      return status >= 502 && status <= 504
        ? "上游模型服务暂时不可用"
        : "NewAPI 服务返回错误"
    default:
      return `请求失败（HTTP ${status}）`
  }
}

export function errorFromResponse(
  status: number,
  payload: unknown
): NewApiError {
  const body = (payload ?? {}) as { error?: OpenAiErrorBody; message?: string }
  const detail = body.error?.message ?? body.message
  return new NewApiError(kindFromStatus(status), statusMessage(status), {
    status,
    detail: typeof detail === "string" ? detail : undefined,
  })
}

export function toNewApiError(error: unknown): NewApiError {
  if (error instanceof NewApiError) return error

  if (error instanceof DOMException && error.name === "AbortError") {
    return new NewApiError("cancelled", "请求已取消")
  }

  if (error instanceof TypeError) {
    return new NewApiError(
      "network",
      "浏览器无法访问该 NewAPI 地址",
      { detail: error.message }
    )
  }

  if (error instanceof Error) {
    return new NewApiError("api", error.message || "请求失败")
  }

  return new NewApiError("api", "请求失败")
}

export type AiErrorInfo = {
  kind: NewApiErrorKind
  title: string
  hints: string[]
  detail?: string
}

const GENERATION_HINTS = [
  "NewAPI 地址是否正确",
  "API Key 是否有效",
  "模型名称是否存在",
  "该 API 是否支持图片生成",
]

function hintsFor(kind: NewApiErrorKind, context: "generate" | "models") {
  const configHints =
    context === "models"
      ? ["NewAPI 地址是否以 /v1 结尾", "API Key 是否有效"]
      : GENERATION_HINTS

  switch (kind) {
    case "auth":
      return ["在设置中重新填写 API Key", "确认该 Key 已开通对应模型"]
    case "forbidden":
      return ["确认该 Key 有权限访问此模型", "确认模型名称未被改名"]
    case "not-found":
      return ["确认地址形如 https://example.com/v1", "确认服务端已开放 Images 接口"]
    case "rate-limit":
      return ["稍后重试", "降低生成数量"]
    case "server":
      return ["稍后重试", "确认上游模型服务可用"]
    case "network":
      return context === "generate"
        ? [
            "若 Network 显示 524，是网关等待回源超时（Cloudflare 默认约 100 秒），上游可能已出图并计费",
            "网关需关闭该域名的 CDN 代理、延长回源超时，或改用异步任务查询",
            "可减少生成张数、参考图数量或分辨率后重试",
            "控制台若提示 Access-Control-Allow-Origin 与当前地址不符，说明渠道限制了跨域来源，需放行 kunDraw 的访问域名",
          ]
        : [
            "确认 NewAPI 地址可以直接从浏览器访问",
            "第三方服务需允许当前站点跨域，并放行 GET、POST、OPTIONS",
            "服务端需允许 Authorization 与 Content-Type 请求头",
            "控制台若提示 Access-Control-Allow-Origin 与当前地址不符，说明渠道限制了跨域来源",
          ]
    case "timeout":
      return ["客户端已等待 20 分钟仍未收到结果", "确认上游服务未卡住，或降低生成负载后重试"]
    case "cancelled":
      return []
    case "config":
      return ["在设置中填写 NewAPI 地址与 API Key"]
    default:
      return configHints
  }
}

export function describeNewApiError(
  error: NewApiError,
  context: "generate" | "models"
): AiErrorInfo {
  return {
    kind: error.kind,
    title:
      error.kind === "network" && context === "generate"
        ? "生成请求被网关中断或浏览器拦截"
        : error.message,
    hints: hintsFor(error.kind, context),
    detail: error.detail,
  }
}
