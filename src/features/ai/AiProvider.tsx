import { useCallback, useMemo, useRef, useState } from "react"

import { AiContext, type AiContextValue } from "./context"
import { MAX_COUNT, MAX_REFERENCE_BYTES, MIN_COUNT, PROMPT_MAX_LENGTH } from "./constants"
import { buildGenerationInput, runGeneration } from "./generate"
import {
  createId,
  findChannel,
  loadActiveChannelId,
  loadChannels,
  loadPromptDraft,
  loadSettings,
  modelsForChannel,
  saveActiveChannelId,
  saveChannels,
  savePromptDraft,
  saveSettings,
} from "./storage"
import type { Channel, GeneratedImage, GenerationSettings, ReferenceImage } from "./types"

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("读取图片失败"))
    reader.readAsDataURL(file)
  })
}

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [channels, setChannelsState] = useState<Channel[]>(loadChannels)
  const [activeChannelId, setActiveChannelIdState] = useState<string>(() => {
    const stored = loadActiveChannelId()
    if (stored) return stored
    const [first] = loadChannels()
    return first?.id ?? ""
  })
  const [prompt, setPromptState] = useState(() => loadPromptDraft())
  const [settings, setSettings] = useState<GenerationSettings>(loadSettings)
  const [references, setReferences] = useState<ReferenceImage[]>([])
  const [results, setResults] = useState<GeneratedImage[]>([])
  const [status, setStatus] = useState<AiContextValue["status"]>("idle")
  const [error, setError] = useState<AiContextValue["error"]>(null)

  // Guards against overlapping generations.
  const generating = useRef(false)

  const activeChannel = useMemo(
    () => findChannel(channels, activeChannelId),
    [activeChannelId, channels]
  )

  const models = useMemo(() => modelsForChannel(activeChannel), [activeChannel])

  const setChannels = useCallback((next: Channel[]) => {
    setChannelsState(next)
    saveChannels(next)
  }, [])

  const setActiveChannelId = useCallback((id: string) => {
    setActiveChannelIdState(id)
    saveActiveChannelId(id)
  }, [])

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

  /** Appends files; there is no fixed limit, only a per-file size guard. */
  const addReferences = useCallback(async (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith("image/"))
    if (images.length === 0) return

    const tooLarge = images.find((file) => file.size > MAX_REFERENCE_BYTES)
    if (tooLarge) {
      throw new Error(`参考图过大（上限 ${Math.round(MAX_REFERENCE_BYTES / 1024 / 1024)}MB）：${tooLarge.name}`)
    }

    const loaded = await Promise.all(
      images.map(async (file) => {
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

    setReferences((current) => [...current, ...loaded])
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
    async (
      overrides?: Partial<GenerationSettings> & {
        prompt?: string
        references?: ReferenceImage[]
      }
    ) => {
      if (generating.current) return []

      const nextSettings: GenerationSettings = { ...settings, ...overrides }
      const nextPrompt = (overrides?.prompt ?? prompt).trim()
      const channel = activeChannel
      const model = (nextSettings.model || models[0] || "").trim()

      if (!channel?.baseUrl.trim()) {
        setError({
          kind: "config",
          title: "尚未配置 NewAPI 渠道",
          hints: ["打开右上角设置，添加一个渠道并填写地址与 API Key"],
        })
        return []
      }
      if (!model) {
        setError({ kind: "input", title: "请选择或输入模型名称", hints: [] })
        return []
      }
      if (!nextPrompt) {
        setError({ kind: "input", title: "请先输入提示词", hints: [] })
        return []
      }

      setError(null)
      setStatus("generating")
      generating.current = true

      try {
        const input = buildGenerationInput({
          channel,
          model,
          settings: nextSettings,
          prompt: nextPrompt,
          references:
            nextSettings.mode === "image" ? (overrides?.references ?? references) : [],
        })

        const outcome = await runGeneration(input)

        if ("error" in outcome) {
          setError(outcome.error)
          return []
        }

        setResults((current) => [...outcome.images, ...current])
        return outcome.images
      } finally {
        generating.current = false
        setStatus("idle")
      }
    },
    [activeChannel, models, prompt, references, settings]
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
