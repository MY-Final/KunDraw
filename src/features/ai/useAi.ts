import { useContext } from "react"

import { AiContext } from "./context"

export function useAi() {
  const context = useContext(AiContext)

  if (!context) {
    throw new Error("useAi 必须在 AiProvider 内部使用")
  }

  return context
}

/**
 * For components that also render outside the app tree — tldraw renders shapes
 * in a detached root while exporting, where AiProvider does not exist.
 */
export function useOptionalAi() {
  return useContext(AiContext)
}
