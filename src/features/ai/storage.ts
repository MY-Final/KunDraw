import { SETTINGS_STORE, readRecord, writeRecord } from "@/features/persistence/db"

import {
  ASPECT_RATIOS,
  BASE_RESOLUTIONS,
  DEFAULT_SETTINGS,
  MAX_COUNT,
  MIN_COUNT,
  PROMPT_MAX_LENGTH,
} from "./constants"
import type { Channel, GenerationSettings } from "./types"

/**
 * App settings (channels, API key, generation defaults) are separate from
 * project data: one IndexedDB record, never part of a canvas snapshot.
 */
const SETTINGS_RECORD_KEY = "ai"
/** Prompt drafts change on every keystroke, so they are batched. */
const DRAFT_WRITE_DELAY_MS = 500

const LEGACY_KEYS = {
  channels: "kundraw.ai.channels.v1",
  activeChannelId: "kundraw.ai.active-channel.v1",
  promptDraft: "kundraw.ai.prompt.v1",
  settings: "kundraw.ai.settings.v1",
  singleChannel: "kundraw.ai.config.v1",
} as const

type StoredAiSettings = {
  channels: Channel[]
  activeChannelId: string
  settings: GenerationSettings
  promptDraft: string
}

const DEFAULT_STORED: StoredAiSettings = {
  channels: [],
  activeChannelId: "",
  settings: DEFAULT_SETTINGS,
  promptDraft: "",
}

// Hydrated from IndexedDB before the first render so reads stay synchronous.
let cache: StoredAiSettings = DEFAULT_STORED
let persistenceAvailable = true
let draftTimer: number | null = null

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

function normalizeModels(models: readonly string[]) {
  const ids = models.map((id) => id.trim()).filter(Boolean)
  return Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b))
}

/** Models come only from what the channel reported; kunDraw ships no built-in ids. */
export function modelsForChannel(channel: Channel | null): string[] {
  return normalizeModels(channel?.models ?? [])
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
      ? normalizeModels(record.models.filter((id): id is string => typeof id === "string"))
      : [],
  }
}

function sanitizeChannels(raw: unknown) {
  if (!Array.isArray(raw)) return []
  return raw
    .map(sanitizeChannel)
    .filter((channel): channel is Channel => channel !== null)
}

function sanitizeSettings(raw: unknown): GenerationSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_SETTINGS
  const stored = raw as Partial<GenerationSettings>
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

function readLegacyJson(raw: string | null) {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** The single-endpoint config used before channels existed. */
function migrateSingleChannel(raw: unknown) {
  const record = (raw ?? {}) as Record<string, unknown>
  if (typeof record.baseUrl !== "string" || !record.baseUrl) return []

  return [
    createChannel({
      name: "默认渠道",
      baseUrl: record.baseUrl,
      apiKey: typeof record.apiKey === "string" ? record.apiKey : "",
      models: Array.isArray(record.remoteModels)
        ? record.remoteModels.filter((id): id is string => typeof id === "string")
        : [],
    }),
  ]
}

function readLegacySettings(): StoredAiSettings | null {
  try {
    const storage = window.localStorage
    const rawChannels = storage.getItem(LEGACY_KEYS.channels)
    const rawActiveId = storage.getItem(LEGACY_KEYS.activeChannelId)
    const rawDraft = storage.getItem(LEGACY_KEYS.promptDraft)
    const rawSettings = storage.getItem(LEGACY_KEYS.settings)
    const rawSingleChannel = storage.getItem(LEGACY_KEYS.singleChannel)

    if (!rawChannels && !rawActiveId && !rawDraft && !rawSettings && !rawSingleChannel) {
      return null
    }

    const channels = sanitizeChannels(readLegacyJson(rawChannels))
    const activeChannelId = readLegacyJson(rawActiveId)

    return {
      channels: channels.length > 0 ? channels : migrateSingleChannel(readLegacyJson(rawSingleChannel)),
      activeChannelId: typeof activeChannelId === "string" ? activeChannelId : "",
      settings: sanitizeSettings(readLegacyJson(rawSettings)),
      promptDraft: (rawDraft ?? "").slice(0, PROMPT_MAX_LENGTH),
    }
  } catch {
    return null
  }
}

function clearLegacyKeys() {
  try {
    for (const key of Object.values(LEGACY_KEYS)) window.localStorage.removeItem(key)
  } catch {
    // The migration already succeeded; leftover keys are only a small leak.
  }
}

function persist() {
  if (!persistenceAvailable) return
  if (draftTimer !== null) {
    window.clearTimeout(draftTimer)
    draftTimer = null
  }

  void writeRecord(SETTINGS_STORE, { key: SETTINGS_RECORD_KEY, value: cache }).catch((error) => {
    persistenceAvailable = false
    console.error("[kunDraw] AI 设置保存失败，本次会话不再写入渠道配置", error)
  })
}

/** Writes any batched settings immediately; called when the page goes away. */
export function flushAiSettings() {
  if (draftTimer === null) return
  persist()
}

function persistPromptDraft() {
  if (!persistenceAvailable) return
  if (draftTimer !== null) window.clearTimeout(draftTimer)
  draftTimer = window.setTimeout(() => {
    draftTimer = null
    persist()
  }, DRAFT_WRITE_DELAY_MS)
}

/** Reads stored settings into memory, migrating the old localStorage values once. */
export async function hydrateAiSettings() {
  try {
    const record = await readRecord<{ key: string; value: unknown }>(
      SETTINGS_STORE,
      SETTINGS_RECORD_KEY
    )

    if (record?.value) {
      cache = sanitizeStoredSettings(record.value)
      return
    }

    cache = readLegacySettings() ?? DEFAULT_STORED
    await writeRecord(SETTINGS_STORE, { key: SETTINGS_RECORD_KEY, value: cache })
    clearLegacyKeys()
  } catch (error) {
    persistenceAvailable = false
    cache = readLegacySettings() ?? DEFAULT_STORED
    console.error("[kunDraw] AI 设置读取失败，本次会话不会保存渠道配置", error)
  }

  window.addEventListener("pagehide", flushAiSettings)
}

function sanitizeStoredSettings(raw: unknown): StoredAiSettings {
  const stored = (raw ?? {}) as Partial<Record<keyof StoredAiSettings, unknown>>

  return {
    channels: sanitizeChannels(stored.channels),
    activeChannelId: typeof stored.activeChannelId === "string" ? stored.activeChannelId : "",
    settings: sanitizeSettings(stored.settings),
    promptDraft:
      typeof stored.promptDraft === "string" ? stored.promptDraft.slice(0, PROMPT_MAX_LENGTH) : "",
  }
}

export function loadChannels() {
  return cache.channels
}

export function saveChannels(channels: Channel[]) {
  cache = { ...cache, channels }
  persist()
}

export function loadActiveChannelId() {
  return cache.activeChannelId
}

export function saveActiveChannelId(id: string) {
  cache = { ...cache, activeChannelId: id }
  persist()
}

export function loadSettings() {
  return cache.settings
}

export function saveSettings(settings: GenerationSettings) {
  cache = { ...cache, settings }
  persist()
}

export function loadPromptDraft() {
  return cache.promptDraft
}

export function savePromptDraft(prompt: string) {
  cache = { ...cache, promptDraft: prompt.slice(0, PROMPT_MAX_LENGTH) }
  persistPromptDraft()
}
