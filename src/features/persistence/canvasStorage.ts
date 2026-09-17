import type {
  Editor,
  TLAssetId,
  TLImageAsset,
  TLRecord,
  TLSessionStateSnapshot,
  TLShapeId,
  TLStoreSnapshot,
} from "tldraw"

import { IMAGE_SHAPE_TYPE, type ImageShape } from "@/features/canvas/shapeTypes"

import {
  assetIdFromSrc,
  assetSrcFor,
  blobToDataUrl,
  blobFromImageSrc,
  isStoredAssetSrc,
  readStoredAsset,
  rememberStoredAssetSrc,
  storeImageAsset,
} from "./assets"
import { CANVASES_STORE, deleteRecord, readRecord, readRecords, writeRecord } from "./db"

export type StoredCanvas = {
  projectId: string
  updatedAt: number
  /** Asset sources are stored as `kundraw-asset:<id>` references, never runtime URLs. */
  document: TLStoreSnapshot
  session: TLSessionStateSnapshot
}

function isImageAsset(record: TLRecord): record is TLImageAsset {
  return record.typeName === "asset" && (record as TLImageAsset).type === "image"
}

/** Copies image bytes into IndexedDB so a project never depends on a temporary URL. */
async function externalizeImageAssets(editor: Editor) {
  for (const asset of editor.store.allRecords().filter(isImageAsset)) {
    const src = asset.props.src
    if (!src || isStoredAssetSrc(asset.id, src) || assetIdFromSrc(src)) continue

    const blob = await blobFromImageSrc(src)
    if (!blob) continue

    await storeImageAsset({
      id: asset.id,
      blob,
      mimeType: asset.props.mimeType ?? blob.type,
      width: asset.props.w,
      height: asset.props.h,
    })

    rememberStoredAssetSrc(asset.id, src)
  }
}

function withStoredAssetSources(record: TLRecord): TLRecord {
  if (isImageAsset(record)) {
    return isStoredAssetSrc(record.id, record.props.src)
      ? { ...record, props: { ...record.props, src: assetSrcFor(record.id) } }
      : record
  }

  if (record.typeName === "shape" && record.type === IMAGE_SHAPE_TYPE) {
    const shape = record as ImageShape
    return isStoredAssetSrc(shape.props.assetId, shape.props.imageUrl)
      ? { ...shape, props: { ...shape.props, imageUrl: assetSrcFor(shape.props.assetId) } }
      : record
  }

  return record
}

async function withRuntimeAssetSources(record: TLRecord): Promise<TLRecord> {
  // Stored blobs come back as data urls: tldraw only accepts data or remote
  // sources for assets. A missing blob becomes an empty source so the node
  // shows its placeholder instead of a reference the browser cannot load.
  const readAssetSrc = async (assetId: string) => {
    const stored = await readStoredAsset(assetId)
    if (!stored) return ""
    const dataUrl = await blobToDataUrl(stored.blob)
    rememberStoredAssetSrc(assetId, dataUrl)
    return dataUrl
  }

  if (isImageAsset(record)) {
    const assetId = assetIdFromSrc(record.props.src)
    if (!assetId) return record
    const src = await readAssetSrc(assetId)
    return src === record.props.src ? record : { ...record, props: { ...record.props, src } }
  }

  if (record.typeName === "shape" && record.type === IMAGE_SHAPE_TYPE) {
    const shape = record as ImageShape
    const assetId = assetIdFromSrc(shape.props.imageUrl)
    if (!assetId) return record
    const imageUrl = await readAssetSrc(assetId)
    return imageUrl === shape.props.imageUrl
      ? record
      : { ...shape, props: { ...shape.props, imageUrl } }
  }

  return record
}

async function mapRecords(
  document: TLStoreSnapshot,
  map: (record: TLRecord) => TLRecord | Promise<TLRecord>
) {
  const store: Record<string, TLRecord> = {}

  for (const [id, record] of Object.entries(document.store)) {
    store[id] = await map(record)
  }

  return { ...document, store }
}

export async function saveProjectCanvas(editor: Editor, projectId: string) {
  await externalizeImageAssets(editor)

  const snapshot = editor.getSnapshot()
  const record: StoredCanvas = {
    projectId,
    updatedAt: Date.now(),
    document: await mapRecords(snapshot.document, withStoredAssetSources),
    session: snapshot.session,
  }

  await writeRecord(CANVASES_STORE, record)
  return record.updatedAt
}

/** Restores a project's canvas. Returns false when it has nothing stored yet. */
export async function loadProjectCanvas(editor: Editor, projectId: string) {
  const stored = await readRecord<StoredCanvas>(CANVASES_STORE, projectId)
  if (!stored) return false

  const document = await mapRecords(stored.document, withRuntimeAssetSources)

  editor.run(
    () => {
      editor.loadSnapshot({ document, session: stored.session }, { forceOverwriteSessionState: true })
      editor.clearHistory()
    },
    { history: "ignore" }
  )

  return true
}

export function clearCanvasContent(editor: Editor) {
  const records = editor.store.allRecords()
  const shapeIds = records.filter((record) => record.typeName === "shape").map((shape) => shape.id)
  const assetIds = records.filter((record) => record.typeName === "asset").map((asset) => asset.id)
  if (shapeIds.length === 0 && assetIds.length === 0) return

  editor.run(
    () => {
      if (shapeIds.length > 0) editor.deleteShapes(shapeIds as TLShapeId[])
      if (assetIds.length > 0) editor.deleteAssets(assetIds as TLAssetId[])
    },
    { history: "ignore" }
  )
}

export async function deleteProjectCanvas(projectId: string) {
  await deleteRecord(CANVASES_STORE, projectId)
}

/** Asset ids still referenced by stored snapshots; everything else can be collected. */
export async function collectReferencedAssetIds() {
  const canvases = await readRecords<StoredCanvas>(CANVASES_STORE)
  const referenced = new Set<string>()

  for (const canvas of canvases) {
    for (const record of Object.values(canvas.document.store)) {
      const src = isImageAsset(record)
        ? record.props.src
        : record.typeName === "shape" && record.type === IMAGE_SHAPE_TYPE
          ? (record as ImageShape).props.imageUrl
          : ""
      const assetId = assetIdFromSrc(src)
      if (assetId) referenced.add(assetId)
    }
  }

  return referenced
}
