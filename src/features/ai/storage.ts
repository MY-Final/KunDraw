import type { ImageResponseFormat, NewApiConfig } from "@/api/newapi/types"

import { ASPECT_RATIOS, IMAGE_COUNTS, PROMPT_MAX_LENGTH } from "./constants"
import { DEFAULT_MODEL_ID } from "./models"
import type { GenerationSettings } from "./types"

const CONFIG_KEY = "kundraw.ai.config.v1"
const DRAFT_KEY = "kundraw.ai.draft.v1"
const SETTINGS_KEY = "kundraw.ai.settings.v1"

export type StoredConfig = NewApiConfig & { remoteModels: string[] }

export const emptyConfig: StoredConfig = {
  baseUrl: "",
  apiKey: "",
  responseFormat: "b64_json",
  remoteModels: [],
}

export const defaultSettings: GenerationSettings = {
  modelId: DEFAULT_MODEL_ID,
  aspectRatio: "1:1",
  count: 1,
}

function readObject<T extends object>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return fallback
    return { ...fallback, ...(parsed as object) }
  } catch {
    return fallback
  }
}

function writeObject(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode, quota); kunDraw still works in memory.
  }
}

export function loadConfig(): StoredConfig {
  const stored = readObject(CONFIG_KEY, emptyConfig)

  return {
    baseUrl: typeof stored.baseUrl === "string" ? stored.baseUrl : "",
    apiKey: typeof stored.apiKey === "string" ? stored.apiKey : "",
    responseFormat:
      stored.responseFormat === "url" ? ("url" as ImageResponseFormat) : "b64_json",
    remoteModels: Array.isArray(stored.remoteModels)
      ? stored.remoteModels.filter((id): id is string => typeof id === "string")
      : [],
  }
}

export function saveConfig(config: StoredConfig) {
  writeObject(CONFIG_KEY, config)
}

export function loadSettings(): GenerationSettings {
  const stored = readObject(SETTINGS_KEY, defaultSettings)

  return {
    modelId: typeof stored.modelId === "string" && stored.modelId
      ? stored.modelId
      : defaultSettings.modelId,
    aspectRatio: ASPECT_RATIOS.includes(stored.aspectRatio)
      ? stored.aspectRatio
      : defaultSettings.aspectRatio,
    count: IMAGE_COUNTS.includes(stored.count) ? stored.count : defaultSettings.count,
  }
}

export function saveSettings(settings: GenerationSettings) {
  writeObject(SETTINGS_KEY, settings)
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
