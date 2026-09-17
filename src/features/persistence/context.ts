import { createContext } from "react"

import type { Project } from "./projects"

export type ProjectContextValue = {
  projects: Project[]
  project: Project
  /** False while another tab holds the project's writer lock. */
  canEdit: boolean
  createProject: () => Promise<void>
  switchProject: (id: string) => Promise<void>
  renameProject: (name: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  clearAllLocalData: () => Promise<void>
}

export const ProjectContext = createContext<ProjectContextValue | null>(null)
