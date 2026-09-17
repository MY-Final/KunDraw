import type {
  AspectRatio,
  BaseResolution,
  GenerationMode,
  GenerationSettings,
  ReferenceRole,
} from "./types"

export const ASPECT_RATIOS: AspectRatio[] = [
  "auto",
  "1:1",
  "4:3",
  "3:2",
  "16:9",
  "21:9",
  "3:4",
  "2:3",
  "9:16",
]

export const ASPECT_RATIO_LABELS: Record<AspectRatio, string> = {
  auto: "自动",
  "1:1": "1:1",
  "4:3": "4:3",
  "3:2": "3:2",
  "16:9": "16:9",
  "21:9": "21:9",
  "3:4": "3:4",
  "2:3": "2:3",
  "9:16": "9:16",
}

export const BASE_RESOLUTIONS: BaseResolution[] = [512, 1024, 1536, 2048, 3840]

export const RESOLUTION_LABELS: Record<BaseResolution, string> = {
  512: "512P",
  1024: "1024P",
  1536: "1536P",
  2048: "2048P",
  3840: "4K",
}

/** Multipliers applied to the base value, which is the long edge. */
export const ASPECT_RATIO_VALUES: Record<Exclude<AspectRatio, "auto">, [number, number]> =
  {
    "1:1": [1, 1],
    "4:3": [4, 3],
    "3:2": [3, 2],
    "16:9": [16, 9],
    "21:9": [21, 9],
    "3:4": [3, 4],
    "2:3": [2, 3],
    "9:16": [9, 16],
  }

export const PROMPT_MAX_LENGTH = 2000

export const MIN_COUNT = 1
export const MAX_COUNT = 16

export const MAX_REFERENCE_BYTES = 12 * 1024 * 1024

export const ACCEPTED_REFERENCE_TYPES = ["image/png", "image/jpeg", "image/webp"]

export const MODE_LABELS: Record<GenerationMode, string> = {
  text: "文生图",
  image: "图生图",
}

export const REFERENCE_ROLES: ReferenceRole[] = ["content", "style", "composition", "subject"]

export const REFERENCE_ROLE_LABELS: Record<ReferenceRole, string> = {
  content: "内容参考",
  style: "风格参考",
  composition: "构图参考",
  subject: "主体参考",
}

export const DEFAULT_REFERENCE_ROLE: ReferenceRole = "content"

export const DEFAULT_SETTINGS: GenerationSettings = {
  model: "",
  mode: "text",
  aspectRatio: "auto",
  resolution: 1024,
  count: 1,
}

/**
 * The concrete `size` value for a ratio/resolution pair, or undefined when the
 * ratio is `auto` and no explicit size should be sent.
 */
export function computeSize(settings: GenerationSettings): string | undefined {
  if (settings.aspectRatio === "auto") return undefined

  const [w, h] = ASPECT_RATIO_VALUES[settings.aspectRatio]
  const base = settings.resolution

  // The base value is the long edge, so the shape never grows past it.
  const scale = base / Math.max(w, h)
  return `${Math.round(w * scale)}x${Math.round(h * scale)}`
}

export function describeSize(settings: GenerationSettings) {
  return computeSize(settings) ?? "自动"
}
