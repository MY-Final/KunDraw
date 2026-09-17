import { useCallback, useMemo, useRef, useState } from "react"

import { AiContext, type AiContextValue } from "./context"
import { MAX_REFERENCE_BYTES, MAX_REFERENCES, PROMPT_MAX_LENGTH } from "./constants"
import { buildGenerationInput, runGeneration } from "./generate"
import { resolveImageModels } from "./models"
import {
  emptyConfig,
  loadConfig,
  loadPromptDraft,
  loadSettings,
  saveConfig,
  savePromptDraft,
  saveSettings,
  type StoredConfig,
} from "./storage"
import type { GeneratedImage, GenerationSettings, ReferenceImage } from "./types"

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("读取图片失败"))
    reader.readAsDataURL(file)
  })
}

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<StoredConfig>(() => {
    const stored = loadConfig()
    return stored.baseUrl || stored.apiKey ? stored : emptyConfig
  })
  const [prompt, setPromptState] = useState(() => loadPromptDraft())
  const [settings, setSettings] = useState<GenerationSettings>(loadSettings)
  const [references, setReferences] = useState<ReferenceImage[]>([])
  const [results, setResults] = useState<GeneratedImage[]>([])
  const [status, setStatus] = useState<AiContextValue["status"]>("idle")
  const [error, setError] = useState<AiContextValue["error"]>(null)

  // Guards against overlapping generations and keeps the async handler stable.
  const generating = useRef(false)

  const models = useMemo(
    () => resolveImageModels(config.remoteModels),
    [config.remoteModels]
  )

  const setConfig = useCallback((next: StoredConfig) => {
    setConfigState(next)
    saveConfig(next)
  }, [])

  const setPrompt = useCallback((next: string) => {
    const capped = next.slice(0, PROMPT_MAX_LENGTH)
    setPromptState(capped)
    savePromptDraft(capped)
  }, [])

  const updateSettings = useCallback((patch: Partial<GenerationSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  const addReferences = useCallback(async (files: File[]) => {
    const accepted = files.filter((file) => file.type.startsWith("image/"))

    const loaded = await Promise.all(
      accepted.map(async (file) => {
        if (file.size > MAX_REFERENCE_BYTES) {
          throw new Error(`参考图过大：${file.name}`)
        }
        const dataUrl = await readFileAsDataUrl(file)
        return {
          id: createId("ref"),
          name: file.name,
          mimeType: file.type || "image/png",
          dataUrl,
          bytes: file.size,
        } satisfies ReferenceImage
      })
    )

    setReferences((current) => [...current, ...loaded].slice(0, MAX_REFERENCES))
  }, [])

  const removeReference = useCallback((id: string) => {
    setReferences((current) => current.filter((reference) => reference.id !== id))
  }, [])

  const clearReferences = useCallback(() => setReferences([]), [])

  const removeResult = useCallback((id: string) => {
    setResults((current) => current.filter((image) => image.id !== id))
  }, [])

  const clearResults = useCallback(() => setResults([]), [])
  const clearError = useCallback(() => setError(null), [])

  const generate = useCallback(
    async (overrides?: Partial<GenerationSettings> & { prompt?: string }) => {
      if (generating.current) return

      const nextSettings = { ...settings, ...overrides }
      const nextPrompt = (overrides?.prompt ?? prompt).trim()

      if (!config.baseUrl.trim()) {
        setError({
          kind: "config",
          title: "尚未配置 NewAPI 地址",
          hints: ["打开右上角设置，填写 NewAPI 地址与 API Key"],
        })
        return
      }
      if (!nextPrompt) {
        setError({ kind: "input", title: "请先输入提示词", hints: [] })
        return
      }

      setError(null)
      setStatus("generating")
      generating.current = true

      try {
        const input = buildGenerationInput({
          config,
          models,
          modelId: nextSettings.modelId,
          prompt: nextPrompt,
          aspectRatio: nextSettings.aspectRatio,
          count: nextSettings.count,
          references,
        })

        const outcome = await runGeneration(input)

        if ("error" in outcome) {
          setError(outcome.error)
          return
        }

        setResults((current) => [...outcome.images, ...current])
      } finally {
        generating.current = false
        setStatus("idle")
      }
    },
    [config, models, prompt, references, settings]
  )

  const value = useMemo<AiContextValue>(
    () => ({
      config,
      models,
      prompt,
      references,
      settings,
      results,
      status,
      error,
      isConfigured: Boolean(config.baseUrl.trim()),
      setConfig,
      setPrompt,
      addReferences,
      removeReference,
      clearReferences,
      updateSettings,
      generate,
      removeResult,
      clearResults,
      clearError,
    }),
    [
      config,
      models,
      prompt,
      references,
      settings,
      results,
      status,
      error,
      setConfig,
      setPrompt,
      addReferences,
      removeReference,
      clearReferences,
      updateSettings,
      generate,
      removeResult,
      clearResults,
      clearError,
    ]
  )

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>
}
