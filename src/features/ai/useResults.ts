import { useCallback, useEffect, useRef, useState } from "react"

import {
  MAX_STORED_RESULTS,
  clearProjectResults,
  deleteStoredResult,
  loadProjectResults,
  pruneProjectResults,
  saveResult,
} from "@/features/persistence/resultStore"

import type { GeneratedImage } from "./types"

/** Newest first, de-duplicated by id, capped for memory and storage. */
function mergeResults(primary: GeneratedImage[], extra: GeneratedImage[]) {
  const seen = new Set(primary.map((image) => image.id))
  return [...primary, ...extra.filter((image) => !seen.has(image.id))]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_STORED_RESULTS)
}

export function useResults(projectId: string) {
  const [results, setResults] = useState<GeneratedImage[]>([])
  // Results generated in this session, so a slow load cannot drop them.
  const sessionResults = useRef<GeneratedImage[]>([])

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

  const addResults = useCallback(
    (images: GeneratedImage[]) => {
      sessionResults.current = mergeResults(images, sessionResults.current)
      setResults((current) => mergeResults(images, current))

      void Promise.all(images.map((image) => saveResult(projectId, image)))
        .then(() => pruneProjectResults(projectId))
        .catch((error) => console.error("[kunDraw] 保存生成结果失败", error))
    },
    [projectId]
  )

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

  return { results, addResults, removeResult, clearResults }
}
