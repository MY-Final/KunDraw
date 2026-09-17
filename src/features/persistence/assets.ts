import { ASSETS_STORE, deleteRecords, readRecord, writeRecord } from "./db"

export type StoredAsset = {
  id: string
  blob: Blob
  mimeType: string
  width: number
  height: number
  createdAt: number
}

/** Stored snapshots point at this prefix instead of a runtime-only URL. */
const ASSET_SRC_PREFIX = "kundraw-asset:"

// Object URLs live only for this session; the maps let a save find the stored
// asset again instead of writing a `blob:` URL into IndexedDB.
const objectUrlByAssetId = new Map<string, string>()
const assetIdByObjectUrl = new Map<string, string>()

export function assetSrcFor(assetId: string) {
  return `${ASSET_SRC_PREFIX}${assetId}`
}

export function assetIdFromSrc(src: string | null | undefined) {
  if (!src || !src.startsWith(ASSET_SRC_PREFIX)) return null
  return src.slice(ASSET_SRC_PREFIX.length)
}

export function assetIdForRuntimeUrl(src: string | null | undefined) {
  if (!src) return null
  return assetIdByObjectUrl.get(src) ?? null
}

export function dataUrlToBlob(dataUrl: string) {
  const [header, base64] = dataUrl.split(",")
  const mimeType = /:(.*?);/.exec(header ?? "")?.[1] ?? "image/png"
  const binary = window.atob(base64 ?? "")
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType })
}

/** Reads a data / object / remote image source into a Blob, or null when it cannot be read. */
export async function blobFromImageSrc(src: string): Promise<Blob | null> {
  try {
    if (src.startsWith("data:")) return dataUrlToBlob(src)
    if (src.startsWith("blob:") || src.startsWith("http")) {
      const response = await fetch(src)
      return response.ok ? await response.blob() : null
    }
  } catch (error) {
    console.warn("[kunDraw] 无法读取图片数据，将跳过这张图片的本地存储", error)
  }
  return null
}

export async function storeImageAsset(asset: {
  id: string
  blob: Blob
  mimeType: string
  width: number
  height: number
}) {
  await writeRecord(ASSETS_STORE, { ...asset, createdAt: Date.now() } satisfies StoredAsset)
}

export function runtimeUrlForAsset(assetId: string, blob: Blob) {
  const existing = objectUrlByAssetId.get(assetId)
  if (existing) return existing

  const url = URL.createObjectURL(blob)
  objectUrlByAssetId.set(assetId, url)
  assetIdByObjectUrl.set(url, assetId)
  return url
}

export async function ensureRuntimeUrl(assetId: string) {
  const existing = objectUrlByAssetId.get(assetId)
  if (existing) return existing

  const stored = await readRecord<StoredAsset>(ASSETS_STORE, assetId)
  return stored ? runtimeUrlForAsset(stored.id, stored.blob) : null
}

export function releaseRuntimeUrl(assetId: string) {
  const url = objectUrlByAssetId.get(assetId)
  if (!url) return

  URL.revokeObjectURL(url)
  objectUrlByAssetId.delete(assetId)
  assetIdByObjectUrl.delete(url)
}

export function releaseAllRuntimeUrls() {
  for (const url of objectUrlByAssetId.values()) URL.revokeObjectURL(url)
  objectUrlByAssetId.clear()
  assetIdByObjectUrl.clear()
}

export async function deleteStoredAssets(assetIds: string[]) {
  await deleteRecords(ASSETS_STORE, assetIds)
  for (const assetId of assetIds) releaseRuntimeUrl(assetId)
}
