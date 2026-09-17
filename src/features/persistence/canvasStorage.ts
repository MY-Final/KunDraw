import type {
  Editor,
  TLAssetId,
  TLAssetPartial,
  TLImageAsset,
  TLRecord,
  TLSessionStateSnapshot,
  TLShapeId,
  TLShapePartial,
  TLStoreSnapshot,
} from "tldraw"

import { IMAGE_SHAPE_TYPE, type ImageShape } from "@/features/canvas/shapeTypes"

import {
  assetIdForRuntimeUrl,
  assetIdFromSrc,
  assetSrcFor,
  blobFromImageSrc,
  ensureRuntimeUrl,
  runtimeUrlForAsset,
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

function imageShapesForAsset(editor: Editor, assetId: string) {
  return editor.store
    .allRecords()
    .filter(
      (record): record is ImageShape =>
        record.typeName === "shape" &&
        record.type === IMAGE_SHAPE_TYPE &&
        record.props.assetId === assetId
    )
}

/**
 * Moves image sources into IndexedDB and points the live store at the runtime
 * object URL, so canvas data never depends on a temporary remote URL.
 */
async function externalizeImageAssets(editor: Editor) {
  const assetUpdates: TLAssetPartial[] = []
  const shapeUpdates: TLShapePartial<ImageShape>[] = []

  for (const asset of editor.store.allRecords().filter(isImageAsset)) {
    const src = asset.props.src
    if (!src || assetIdForRuntimeUrl(src)) continue

    const blob = await blobFromImageSrc(src)
    if (!blob) continue

    await storeImageAsset({
      id: asset.id,
      blob,
      mimeType: asset.props.mimeType ?? blob.type,
      width: asset.props.w,
      height: asset.props.h,
    })

    const runtimeUrl = runtimeUrlForAsset(asset.id, blob)
    assetUpdates.push({ id: asset.id, type: "image", props: { src: runtimeUrl } })
    for (const shape of imageShapesForAsset(editor, asset.id)) {
      shapeUpdates.push({ id: shape.id, type: IMAGE_SHAPE_TYPE, props: { imageUrl: runtimeUrl } })
    }
  }

  if (assetUpdates.length === 0) return

  editor.run(
    () => {
      editor.updateAssets(assetUpdates)
      if (shapeUpdates.length > 0) editor.updateShapes(shapeUpdates)
    },
    { history: "ignore" }
  )
}

function withStoredAssetSources(record: TLRecord): TLRecord {
  if (isImageAsset(record)) {
    const assetId = assetIdForRuntimeUrl(record.props.src)
    return assetId ? { ...record, props: { ...record.props, src: assetSrcFor(assetId) } } : record
  }

  if (record.typeName === "shape" && record.type === IMAGE_SHAPE_TYPE) {
    const shape = record as ImageShape
    const assetId = assetIdForRuntimeUrl(shape.props.imageUrl)
    return assetId
      ? { ...shape, props: { ...shape.props, imageUrl: assetSrcFor(assetId) } }
      : record
  }

  return record
}

async function withRuntimeAssetSources(record: TLRecord): Promise<TLRecord> {
  const readAssetSrc = (src: string | null | undefined) => {
    const assetId = assetIdFromSrc(src)
    return assetId ? ensureRuntimeUrl(assetId) : null
  }

  if (isImageAsset(record)) {
    const runtimeUrl = await readAssetSrc(record.props.src)
    return runtimeUrl === null ? record : { ...record, props: { ...record.props, src: runtimeUrl } }
  }

  if (record.typeName === "shape" && record.type === IMAGE_SHAPE_TYPE) {
    const shape = record as ImageShape
    const runtimeUrl = await readAssetSrc(shape.props.imageUrl)
    return runtimeUrl === null
      ? record
      : { ...shape, props: { ...shape.props, imageUrl: runtimeUrl } }
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
