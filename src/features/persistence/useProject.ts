import { useContext } from "react"

import { ProjectContext } from "./context"

export function useProject() {
  const context = useContext(ProjectContext)

  if (!context) {
    throw new Error("useProject 必须在 ProjectProvider 内部使用")
  }

  return context
}
