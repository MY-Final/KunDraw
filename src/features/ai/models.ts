import { ASPECT_RATIOS, IMAGE_COUNTS } from "./constants"
import type { AspectRatio, ImageCount, ImageModel } from "./types"

// Aspect ratios are translated to the API's `size` field with a 1024px base.
// Models that only accept a fixed set of sizes should override `sizeMap`.
const SQUARE_SIZES: Record<AspectRatio, string> = {
  "1:1": "1024x1024",
  "4:3": "1024x768",
  "16:9": "1024x576",
  "3:4": "768x1024",
  "9:16": "576x1024",
}

const ALL_COUNTS: ImageCount[] = IMAGE_COUNTS

/**
 * Built-in models. These are kunDraw's defaults; any model returned by NewAPI's
 * `/models` endpoint is appended with conservative capabilities, and this list is
 * the only place capability assumptions live.
 */
export const builtInImageModels: ImageModel[] = [
  {
    id: "images-2.5",
    name: "images-2.5",
    description: "通用高质量",
    recommended: true,
    capabilities: {
      textToImage: true,
      imageToImage: true,
      multipleReferences: true,
      maxReferences: 4,
      supportedAspectRatios: ASPECT_RATIOS,
      supportedCounts: ALL_COUNTS,
    },
    sizeMap: SQUARE_SIZES,
  },
  {
    id: "banner",
    name: "banner",
    description: "横版海报",
    capabilities: {
      textToImage: true,
      imageToImage: true,
      multipleReferences: false,
      maxReferences: 1,
      supportedAspectRatios: ["16:9", "4:3", "1:1"],
      supportedCounts: [1, 2],
    },
    sizeMap: SQUARE_SIZES,
  },
  {
    id: "agens",
    name: "agens",
    description: "创意风格化",
    capabilities: {
      textToImage: true,
      imageToImage: false,
      multipleReferences: false,
      supportedAspectRatios: ASPECT_RATIOS,
      supportedCounts: ALL_COUNTS,
    },
    sizeMap: SQUARE_SIZES,
  },
]

export const DEFAULT_MODEL_ID = builtInImageModels[0].id

/** Used for models discovered from NewAPI that we have no config for. */
function fallbackModel(id: string): ImageModel {
  return {
    id,
    name: id,
    description: "来自 NewAPI",
    capabilities: {
      textToImage: true,
      imageToImage: true,
      multipleReferences: false,
      maxReferences: 1,
      supportedAspectRatios: ASPECT_RATIOS,
      supportedCounts: ALL_COUNTS,
    },
    sizeMap: SQUARE_SIZES,
  }
}

function findBuiltIn(id: string) {
  return builtInImageModels.find((model) => model.id === id)
}

/** Built-in models first, then whatever else the gateway reports. */
export function resolveImageModels(remoteModelIds: string[]): ImageModel[] {
  const remote = remoteModelIds
    .filter((id) => !findBuiltIn(id))
    .map((id) => fallbackModel(id))

  return [...builtInImageModels, ...remote]
}

export function getImageModel(models: ImageModel[], id: string): ImageModel {
  return models.find((model) => model.id === id) ?? models[0] ?? fallbackModel(id)
}

export function isAspectRatioSupported(model: ImageModel, ratio: AspectRatio) {
  return model.capabilities.supportedAspectRatios.includes(ratio)
}

/** The `size` value for a model/ratio pair, or undefined when the model takes none. */
export function resolveSize(model: ImageModel, ratio: AspectRatio) {
  return model.sizeMap?.[ratio]
}
