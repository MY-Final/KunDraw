import type { GeneratedImage, GeneratedImageSource } from "@/features/ai/types"

import { blobFromImageSrc, blobToDataUrl } from "./assets"
import {
  RESULTS_STORE,
  deleteRecord,
  deleteRecords,
  readRecords,
  writeRecord,
} from "./db"

export type StoredResult = {
  id: string
  projectId: string
  blob: Blob
  mimeType: string
  createdAt: number
  source: GeneratedImageSource
  revisedPrompt?: string
}

/** The gallery is capped so the local database cannot grow without bound. */
export const MAX_STORED_RESULTS = 24

function compareNewestFirst(a: StoredResult, b: StoredResult) {
  return b.createdAt - a.createdAt
}

async function readProjectResults(projectId: string) {
  const records = await readRecords<StoredResult>(RESULTS_STORE)
  return records.filter((record) => record.projectId === projectId).sort(compareNewestFirst)
}

export async function saveResult(projectId: string, image: GeneratedImage) {
  const blob = await blobFromImageSrc(image.url)
  if (!blob) return false

  await writeRecord(RESULTS_STORE, {
    id: image.id,
    projectId,
    blob,
    mimeType: blob.type || "image/png",
    createdAt: image.createdAt,
    source: image.source,
    revisedPrompt: image.revisedPrompt,
  } satisfies StoredResult)

  return true
}

export async function loadProjectResults(
  projectId: string,
  limit = MAX_STORED_RESULTS
): Promise<GeneratedImage[]> {
  const records = (await readProjectResults(projectId)).slice(0, limit)
  const images: GeneratedImage[] = []

  for (const record of records) {
    images.push({
      id: record.id,
      url: await blobToDataUrl(record.blob),
      createdAt: record.createdAt,
      source: record.source,
      revisedPrompt: record.revisedPrompt,
    })
  }

  return images
}

export async function deleteStoredResult(id: string) {
  await deleteRecord(RESULTS_STORE, id)
}

export async function clearProjectResults(projectId: string) {
  const records = await readProjectResults(projectId)
  await deleteRecords(
    RESULTS_STORE,
    records.map((record) => record.id)
  )
}

export async function pruneProjectResults(projectId: string, keep = MAX_STORED_RESULTS) {
  const records = await readProjectResults(projectId)
  await deleteRecords(
    RESULTS_STORE,
    records.slice(keep).map((record) => record.id)
  )
}
