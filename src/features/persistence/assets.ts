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

// Which live source each stored asset came from. tldraw only accepts data or
// remote urls for assets, so the live store keeps its own src and only the
// persisted snapshot is rewritten to an asset reference.
const storedSrcByAssetId = new Map<string, string>()

export function assetSrcFor(assetId: string) {
  return `${ASSET_SRC_PREFIX}${assetId}`
}

export function assetIdFromSrc(src: string | null | undefined) {
  if (!src || !src.startsWith(ASSET_SRC_PREFIX)) return null
  return src.slice(ASSET_SRC_PREFIX.length)
}

export function isStoredAssetSrc(assetId: string, src: string | null | undefined) {
  return Boolean(src) && storedSrcByAssetId.get(assetId) === src
}

export function rememberStoredAssetSrc(assetId: string, src: string) {
  storedSrcByAssetId.set(assetId, src)
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

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error("无法读取图片数据"))
    reader.readAsDataURL(blob)
  })
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

export function readStoredAsset(assetId: string) {
  return readRecord<StoredAsset>(ASSETS_STORE, assetId)
}

export async function deleteStoredAssets(assetIds: string[]) {
  await deleteRecords(ASSETS_STORE, assetIds)
  for (const assetId of assetIds) storedSrcByAssetId.delete(assetId)
}
