import type { AspectRatio, ImageCount } from "./types"

export const ASPECT_RATIOS: AspectRatio[] = ["1:1", "4:3", "16:9", "3:4", "9:16"]

export const IMAGE_COUNTS: ImageCount[] = [1, 2, 4]

export const PROMPT_MAX_LENGTH = 2000

export const MAX_REFERENCES = 4

export const MAX_REFERENCE_BYTES = 8 * 1024 * 1024

export const ACCEPTED_REFERENCE_TYPES = ["image/png", "image/jpeg", "image/webp"]
