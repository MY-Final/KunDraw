import { hydrateAiSettings } from "@/features/ai/storage"

import { listProjects, resolveStartupProject, type Project } from "./projects"

export type StartupState = {
  project: Project
  projects: Project[]
}

let startup: StartupState | null = null

/**
 * Runs before React renders so the project name, canvas and AI settings are all
 * available synchronously. Storage failures keep kunDraw usable without saving.
 */
export async function bootPersistence() {
  await hydrateAiSettings()

  try {
    const project = await resolveStartupProject()
    startup = { project, projects: await listProjects() }
  } catch (error) {
    console.error("[kunDraw] 本地存储初始化失败，本次会话不会自动保存", error)
    startup = null
  }
}

export function getStartupState() {
  return startup
}
