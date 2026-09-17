import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { NewApiClient } from "@/api/newapi/client"
import {
  MAX_STORED_RESULTS,
  clearProjectResults,
  deleteStoredResult,
  loadProjectResults,
  pruneProjectResults,
  saveResult,
} from "@/features/persistence/resultStore"
import { useProject } from "@/features/persistence/useProject"

import { AiContext, type AiContextValue, type GenerationOutcome } from "./context"
import {
  DEFAULT_REFERENCE_ROLE,
  MAX_COUNT,
  MAX_REFERENCE_BYTES,
  MIN_COUNT,
  PROMPT_MAX_LENGTH,
} from "./constants"
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
import type {
  Channel,
  GeneratedImage,
  GenerationSettings,
  ReferenceImage,
  ReferenceRole,
} from "./types"

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("读取图片失败"))
    reader.readAsDataURL(file)
  })
}

/** Newest first, de-duplicated by id, capped for memory and storage. */
function mergeResults(primary: GeneratedImage[], extra: GeneratedImage[]) {
  const seen = new Set(primary.map((image) => image.id))
  return [...primary, ...extra.filter((image) => !seen.has(image.id))]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_STORED_RESULTS)
}

export function AiProvider({ children }: { children: React.ReactNode }) {
  const { project } = useProject()
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
  // Aborted when the user cancels the in-flight generation.
  const controllerRef = useRef<AbortController | null>(null)
  // Results generated in this session, so a slow load cannot drop them.
  const sessionResults = useRef<GeneratedImage[]>([])

  const projectId = project.id

  // The gallery is stored per project, so switching projects swaps the results.
  useEffect(() => {
    let cancelled = false
    sessionResults.current = []

    void loadProjectResults(projectId)
      .then((stored) => {
        if (cancelled) return
        setResults(mergeResults(stored, sessionResults.current))
      })
      .catch((error) => console.error("[kunDraw] 读取生成结果失败", error))

    return () => {
      cancelled = true
    }
  }, [projectId])

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

  const refreshModels = useCallback(async () => {
    const channel = activeChannel
    if (!channel?.baseUrl.trim()) return []

    const discovered = await new NewApiClient(channel).listModels()
    setChannelsState((current) => {
      const next = current.map((item) =>
        item.id === channel.id ? { ...item, models: discovered } : item
      )
      saveChannels(next)
      return next
    })
    return discovered
  }, [activeChannel])

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
          role: DEFAULT_REFERENCE_ROLE,
        } satisfies ReferenceImage
      })
    )

    setReferences((current) => [...current, ...loaded])
  }, [])

  const removeReference = useCallback((id: string) => {
    setReferences((current) => current.filter((reference) => reference.id !== id))
  }, [])

  const updateReferenceRole = useCallback((id: string, role: ReferenceRole) => {
    setReferences((current) =>
      current.map((reference) => (reference.id === id ? { ...reference, role } : reference))
    )
  }, [])

  const clearReferences = useCallback(() => setReferences([]), [])

  const cancelGeneration = useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  const removeResult = useCallback((id: string) => {
    setResults((current) => current.filter((image) => image.id !== id))
    void deleteStoredResult(id).catch((error) =>
      console.error("[kunDraw] 删除生成结果失败", error)
    )
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    void clearProjectResults(projectId).catch((error) =>
      console.error("[kunDraw] 清空生成结果失败", error)
    )
  }, [projectId])
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

        sessionResults.current = mergeResults(outcome.images, sessionResults.current)
        setResults((current) => mergeResults(outcome.images, current))

        void Promise.all(outcome.images.map((image) => saveResult(projectId, image)))
          .then(() => pruneProjectResults(projectId))
          .catch((error) => console.error("[kunDraw] 保存生成结果失败", error))

        return { images: outcome.images, status: "ok" } satisfies GenerationOutcome
      } finally {
        generating.current = false
        controllerRef.current = null
        setStatus("idle")
      }
    },
    [activeChannel, projectId, prompt, references, settings]
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
