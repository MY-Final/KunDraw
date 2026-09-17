import { createContext } from "react"

import type {
  AiError,
  Channel,
  GeneratedImage,
  GenerationSettings,
  ReferenceImage,
  ReferenceRole,
} from "./types"

export type AiState = {
  channels: Channel[]
  activeChannel: Channel | null
  /** Built-in model ids plus the active channel's discovered models. */
  models: string[]
  prompt: string
  references: ReferenceImage[]
  settings: GenerationSettings
  results: GeneratedImage[]
  status: "idle" | "generating"
  error: AiError | null
}

export type AiContextValue = AiState & {
  isConfigured: boolean
  setChannels: (channels: Channel[]) => void
  setActiveChannelId: (id: string) => void
  refreshModels: () => Promise<string[]>
  setPrompt: (prompt: string) => void
  addReferences: (files: File[]) => Promise<void>
  removeReference: (id: string) => void
  updateReferenceRole: (id: string, role: ReferenceRole) => void
  clearReferences: () => void
  updateSettings: (patch: Partial<GenerationSettings>) => void
  generate: (
    overrides?: Partial<GenerationSettings> & {
      prompt?: string
      references?: ReferenceImage[]
    }
  ) => Promise<GeneratedImage[]>
  removeResult: (id: string) => void
  clearResults: () => void
  clearError: () => void
}

export const AiContext = createContext<AiContextValue | null>(null)
