import { useCallback, useState } from "react"

const PROJECT_NAME_KEY = "kundraw.project-name.v1"
const DEFAULT_NAME = "未命名项目"

function readName() {
  try {
    return window.localStorage.getItem(PROJECT_NAME_KEY)?.trim() || DEFAULT_NAME
  } catch {
    return DEFAULT_NAME
  }
}

/** The project name is a local label only — kunDraw has no cloud project storage. */
export function useProjectName() {
  const [name, setName] = useState(readName)

  const rename = useCallback((next: string) => {
    const value = next.trim() || DEFAULT_NAME
    setName(value)
    try {
      window.localStorage.setItem(PROJECT_NAME_KEY, value)
    } catch {
      // The name is a convenience label; ignore storage failures.
    }
  }, [])

  return { name, rename }
}
