import { collectReferencedAssetIds, deleteProjectCanvas } from "./canvasStorage"
import { deleteStoredAssets } from "./assets"
import {
  ASSETS_STORE,
  META_STORE,
  PROJECTS_STORE,
  deleteRecord,
  readRecord,
  readRecords,
  writeRecord,
} from "./db"

export type Project = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export const DEFAULT_PROJECT_NAME = "未命名项目"

const CURRENT_PROJECT_KEY = "currentProjectId"
const LEGACY_PROJECT_NAME_KEY = "kundraw.project-name.v1"

export function createProjectId() {
  return `pj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export async function listProjects() {
  const projects = await readRecords<Project>(PROJECTS_STORE)
  return projects.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function createProjectRecord(name = DEFAULT_PROJECT_NAME) {
  const now = Date.now()
  const project: Project = {
    id: createProjectId(),
    name: name.trim() || DEFAULT_PROJECT_NAME,
    createdAt: now,
    updatedAt: now,
  }

  await writeRecord(PROJECTS_STORE, project)
  return project
}

export function readProject(id: string) {
  return readRecord<Project>(PROJECTS_STORE, id)
}

export async function renameProjectRecord(id: string, name: string) {
  const project = await readProject(id)
  if (!project) return null

  const renamed = { ...project, name: name.trim() || DEFAULT_PROJECT_NAME, updatedAt: Date.now() }
  await writeRecord(PROJECTS_STORE, renamed)
  return renamed
}

export async function touchProjectRecord(id: string, updatedAt: number) {
  const project = await readProject(id)
  if (!project) return null

  const touched = { ...project, updatedAt }
  await writeRecord(PROJECTS_STORE, touched)
  return touched
}

async function collectOrphanAssets() {
  const referenced = await collectReferencedAssetIds()
  const stored = await readRecords<{ id: string }>(ASSETS_STORE)
  await deleteStoredAssets(stored.map((asset) => asset.id).filter((id) => !referenced.has(id)))
}

export async function removeProjectRecord(id: string) {
  await deleteProjectCanvas(id)
  await deleteRecord(PROJECTS_STORE, id)
  await collectOrphanAssets()
}

export async function readCurrentProjectId() {
  const record = await readRecord<{ key: string; value: string }>(META_STORE, CURRENT_PROJECT_KEY)
  return record?.value ?? null
}

export function writeCurrentProjectId(id: string) {
  return writeRecord(META_STORE, { key: CURRENT_PROJECT_KEY, value: id })
}

/** A project name typed before projects existed, reused for the very first project. */
function takeLegacyProjectName() {
  try {
    const name = window.localStorage.getItem(LEGACY_PROJECT_NAME_KEY)?.trim() ?? ""
    if (name) window.localStorage.removeItem(LEGACY_PROJECT_NAME_KEY)
    return name
  } catch {
    return ""
  }
}

/** Opens the most recent project, creating the first one when storage is empty. */
export async function resolveStartupProject() {
  const projects = await listProjects()
  const currentId = await readCurrentProjectId()
  const current = projects.find((project) => project.id === currentId) ?? projects[0]

  if (current) {
    await writeCurrentProjectId(current.id)
    return current
  }

  const created = await createProjectRecord(takeLegacyProjectName())
  await writeCurrentProjectId(created.id)
  return created
}
