import { useContext } from "react"

import { AiContext } from "./context"

export function useAi() {
  const context = useContext(AiContext)

  if (!context) {
    throw new Error("useAi 必须在 AiProvider 内部使用")
  }

  return context
}
