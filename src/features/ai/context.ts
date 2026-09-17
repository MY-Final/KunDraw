import { createContext } from "react"

import type {
  AiError,
  GeneratedImage,
  GenerationSettings,
  ImageModel,
  ReferenceImage,
} from "./types"
import type { StoredConfig } from "./storage"

export type AiState = {
  config: StoredConfig
  models: ImageModel[]
  prompt: string
  references: ReferenceImage[]
  settings: GenerationSettings
  results: GeneratedImage[]
  status: "idle" | "generating"
  error: AiError | null
}

export type AiContextValue = AiState & {
  isConfigured: boolean
  setConfig: (config: StoredConfig) => void
  setPrompt: (prompt: string) => void
  addReferences: (files: File[]) => Promise<void>
  removeReference: (id: string) => void
  clearReferences: () => void
  updateSettings: (patch: Partial<GenerationSettings>) => void
  generate: (overrides?: Partial<GenerationSettings> & { prompt?: string }) => Promise<void>
  removeResult: (id: string) => void
  clearResults: () => void
  clearError: () => void
}

export const AiContext = createContext<AiContextValue | null>(null)
