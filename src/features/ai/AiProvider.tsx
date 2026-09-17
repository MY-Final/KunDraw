import { useCallback, useMemo, useRef, useState } from "react"

import { useProject } from "@/features/persistence/useProject"

import { AiContext, type AiContextValue, type GenerationOutcome } from "./context"
import { MAX_COUNT, MIN_COUNT, PROMPT_MAX_LENGTH } from "./constants"
import { buildGenerationInput, runGeneration } from "./generate"
import { loadPromptDraft, loadSettings, savePromptDraft, saveSettings } from "./storage"
import { useChannels } from "./useChannels"
import { useReferences } from "./useReferences"
import { useResults } from "./useResults"
import type { GenerationSettings, ReferenceImage } from "./types"

export function AiProvider({ children }: { children: React.ReactNode }) {
  const { project } = useProject()
  const { channels, activeChannel, models, setChannels, setActiveChannelId, refreshModels } =
    useChannels()
  const { references, addReferences, removeReference, updateReferenceRole, clearReferences } =
    useReferences()
  const { results, addResults, removeResult, clearResults } = useResults(project.id)

  const [prompt, setPromptState] = useState(() => loadPromptDraft())
  const [settings, setSettings] = useState<GenerationSettings>(loadSettings)
  const [status, setStatus] = useState<AiContextValue["status"]>("idle")
  const [error, setError] = useState<AiContextValue["error"]>(null)

  // Guards against overlapping generations.
  const generating = useRef(false)
  // Aborted when the user cancels the in-flight generation.
  const controllerRef = useRef<AbortController | null>(null)

  const setPrompt = useCallback((next: string) => {
    const capped = next.slice(0, PROMPT_MAX_LENGTH)
    setPromptState(capped)
    savePromptDraft(capped)
  }, [])

  const updateSettings = useCallback((patch: Partial<GenerationSettings>) => {
    setSettings((current) => {
      const next = {
        ...current,
        ...patch,
        count:
          patch.count === undefined
            ? current.count
            : Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(patch.count))),
      }
      saveSettings(next)
      return next
    })
  }, [])

  const cancelGeneration = useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const generate = useCallback(
    async (
      overrides?: Partial<GenerationSettings> & {
        prompt?: string
        references?: ReferenceImage[]
        mask?: Blob
      }
    ) => {
      if (generating.current) {
        setError({
          kind: "input",
          title: "已有生成任务正在进行",
          hints: ["等待它完成，或点击取消后再试"],
        })
        return { images: [], status: "busy" } satisfies GenerationOutcome
      }

      const nextSettings: GenerationSettings = { ...settings, ...overrides }
      const nextPrompt = (overrides?.prompt ?? prompt).trim()
      const channel = activeChannel
      const model = nextSettings.model.trim()

      if (!channel?.baseUrl.trim()) {
        setError({
          kind: "config",
          title: "尚未配置 NewAPI 渠道",
          hints: ["打开右上角设置，添加一个渠道并填写地址与 API Key"],
        })
        return { images: [], status: "error" } satisfies GenerationOutcome
      }
      if (!model) {
        setError({ kind: "input", title: "请选择或输入模型名称", hints: [] })
        return { images: [], status: "error" } satisfies GenerationOutcome
      }
      if (!nextPrompt) {
        setError({ kind: "input", title: "请先输入提示词", hints: [] })
        return { images: [], status: "error" } satisfies GenerationOutcome
      }

      setError(null)
      setStatus("generating")
      generating.current = true
      const controller = new AbortController()
      controllerRef.current = controller

      try {
        const input = buildGenerationInput({
          channel,
          model,
          settings: nextSettings,
          prompt: nextPrompt,
          references:
            nextSettings.mode === "image" ? (overrides?.references ?? references) : [],
          mask: overrides?.mask,
          signal: controller.signal,
        })

        const outcome = await runGeneration(input)

        if ("error" in outcome) {
          if (outcome.error.kind === "cancelled") {
            return { images: [], status: "cancelled" } satisfies GenerationOutcome
          }
          setError(outcome.error)
          return { images: [], status: "error" } satisfies GenerationOutcome
        }

        addResults(outcome.images)

        return { images: outcome.images, status: "ok" } satisfies GenerationOutcome
      } finally {
        generating.current = false
        controllerRef.current = null
        setStatus("idle")
      }
    },
    [activeChannel, addResults, prompt, references, settings]
  )

  const value = useMemo<AiContextValue>(
    () => ({
      channels,
      activeChannel,
      models,
      prompt,
      references,
      settings,
      results,
      status,
      error,
      isConfigured: Boolean(activeChannel?.baseUrl.trim()),
      setChannels,
      setActiveChannelId,
      refreshModels,
      setPrompt,
      addReferences,
      removeReference,
      updateReferenceRole,
      clearReferences,
      updateSettings,
      generate,
      cancelGeneration,
      removeResult,
      clearResults,
      clearError,
    }),
    [
      channels,
      activeChannel,
      models,
      prompt,
      references,
      settings,
      results,
      status,
      error,
      setChannels,
      setActiveChannelId,
      refreshModels,
      setPrompt,
      addReferences,
      removeReference,
      updateReferenceRole,
      clearReferences,
      updateSettings,
      generate,
      cancelGeneration,
      removeResult,
      clearResults,
      clearError,
    ]
  )

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>
}
