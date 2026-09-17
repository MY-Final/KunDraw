import { ASPECT_RATIOS, BASE_RESOLUTIONS, DEFAULT_SETTINGS, MAX_COUNT, MIN_COUNT, PROMPT_MAX_LENGTH } from "./constants"
import { mergeModels, builtInModelIds } from "./models"
import type { Channel, GenerationSettings } from "./types"

const CHANNELS_KEY = "kundraw.ai.channels.v1"
const ACTIVE_CHANNEL_KEY = "kundraw.ai.active-channel.v1"
const DRAFT_KEY = "kundraw.ai.prompt.v1"
const SETTINGS_KEY = "kundraw.ai.settings.v1"

export function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function createChannel(partial?: Partial<Channel>): Channel {
  return {
    id: partial?.id ?? createId("ch"),
    name: partial?.name ?? "",
    baseUrl: partial?.baseUrl ?? "",
    apiKey: partial?.apiKey ?? "",
    models: partial?.models ?? [],
  }
}

export function findChannel(channels: Channel[], id: string) {
  return channels.find((channel) => channel.id === id) ?? channels[0] ?? null
}

/** Built-ins plus whatever the active channel reported. */
export function modelsForChannel(channel: Channel | null): string[] {
  return mergeModels(builtInModelIds, channel?.models ?? [])
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed === null ? fallback : (parsed as T)
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode, quota); kunDraw still works in memory.
  }
}

function sanitizeChannel(raw: unknown): Channel | null {
  if (!raw || typeof raw !== "object") return null
  const record = raw as Record<string, unknown>
  if (typeof record.id !== "string") return null

  return {
    id: record.id,
    name: typeof record.name === "string" ? record.name : "",
    baseUrl: typeof record.baseUrl === "string" ? record.baseUrl : "",
    apiKey: typeof record.apiKey === "string" ? record.apiKey : "",
    models: Array.isArray(record.models)
      ? record.models.filter((id): id is string => typeof id === "string")
      : [],
  }
}

export function loadChannels(): Channel[] {
  const stored = readJson<unknown[]>(CHANNELS_KEY, [])

  if (Array.isArray(stored) && stored.length > 0) {
    return stored
      .map(sanitizeChannel)
      .filter((channel): channel is Channel => channel !== null)
  }

  // Migrate the single-endpoint config used before channels existed.
  const legacy = readJson<Record<string, unknown> | null>("kundraw.ai.config.v1", null)
  if (legacy && typeof legacy.baseUrl === "string" && legacy.baseUrl) {
    return [
      createChannel({
        name: "默认渠道",
        baseUrl: legacy.baseUrl,
        apiKey: typeof legacy.apiKey === "string" ? legacy.apiKey : "",
        models: Array.isArray(legacy.remoteModels)
          ? legacy.remoteModels.filter((id): id is string => typeof id === "string")
          : [],
      }),
    ]
  }

  return []
}

export function saveChannels(channels: Channel[]) {
  writeJson(CHANNELS_KEY, channels)
}

export function loadActiveChannelId(): string {
  const stored = readJson<string>(ACTIVE_CHANNEL_KEY, "")
  return typeof stored === "string" ? stored : ""
}

export function saveActiveChannelId(id: string) {
  writeJson(ACTIVE_CHANNEL_KEY, id)
}

export function loadSettings(): GenerationSettings {
  const stored = readJson<Partial<GenerationSettings> | null>(SETTINGS_KEY, null)
  if (!stored || typeof stored !== "object") return DEFAULT_SETTINGS

  const count = Number(stored.count)

  return {
    model: typeof stored.model === "string" ? stored.model : "",
    mode: stored.mode === "image" ? "image" : "text",
    aspectRatio: ASPECT_RATIOS.includes(stored.aspectRatio as never)
      ? (stored.aspectRatio as GenerationSettings["aspectRatio"])
      : DEFAULT_SETTINGS.aspectRatio,
    resolution: BASE_RESOLUTIONS.includes(stored.resolution as never)
      ? (stored.resolution as GenerationSettings["resolution"])
      : DEFAULT_SETTINGS.resolution,
    count: Number.isFinite(count)
      ? Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(count)))
      : DEFAULT_SETTINGS.count,
  }
}

export function saveSettings(settings: GenerationSettings) {
  writeJson(SETTINGS_KEY, settings)
}

export function loadPromptDraft(): string {
  try {
    return (window.localStorage.getItem(DRAFT_KEY) ?? "").slice(0, PROMPT_MAX_LENGTH)
  } catch {
    return ""
  }
}

export function savePromptDraft(prompt: string) {
  try {
    window.localStorage.setItem(DRAFT_KEY, prompt)
  } catch {
    // The draft is a convenience only.
  }
}
