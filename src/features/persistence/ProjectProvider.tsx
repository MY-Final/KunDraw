import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { useWorkspaceEditor } from "@/hooks/useEditor"

import { releaseAllRuntimeUrls } from "./assets"
import { getStartupState } from "./boot"
import { clearCanvasContent, loadProjectCanvas, saveProjectCanvas } from "./canvasStorage"
import { ProjectContext, type ProjectContextValue } from "./context"
import { ASSETS_STORE, CANVASES_STORE, PROJECTS_STORE, clearRecords } from "./db"
import {
  DEFAULT_PROJECT_NAME,
  createProjectId,
  createProjectRecord,
  listProjects,
  removeProjectRecord,
  renameProjectRecord,
  touchProjectRecord,
  writeCurrentProjectId,
  type Project,
} from "./projects"
import { setSaveStatus } from "./status"

/** Long enough to batch a drag, short enough that a refresh rarely loses work. */
const SAVE_DELAY_MS = 500
const RETRY_DELAY_MS = 5000
const MAX_SAVE_RETRIES = 3

/** Used when IndexedDB is unavailable; the canvas still works, saving reports failure. */
function fallbackProject(): Project {
  const now = Date.now()
  return { id: createProjectId(), name: DEFAULT_PROJECT_NAME, createdAt: now, updatedAt: now }
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const editor = useWorkspaceEditor()
  const [project, setProject] = useState<Project>(() => getStartupState()?.project ?? fallbackProject())
  const [projects, setProjects] = useState<Project[]>(() => getStartupState()?.projects ?? [project])

  const projectIdRef = useRef(project.id)
  const switchingRef = useRef(false)
  const restoredRef = useRef(false)
  const autosaveRef = useRef<{
    flush: () => Promise<void>
    /** Resolves once an in-flight save finished, without starting a new one. */
    settle: () => Promise<void>
    cancel: () => void
  } | null>(null)

  useEffect(() => {
    if (!editor || restoredRef.current) return
    restoredRef.current = true
    switchingRef.current = true

    void loadProjectCanvas(editor, projectIdRef.current)
      .catch((error) => console.error("[kunDraw] 画布恢复失败", error))
      .finally(() => {
        switchingRef.current = false
      })
  }, [editor])

  useEffect(() => {
    if (!editor) return

    let saveTimer: number | null = null
    let retryTimer: number | null = null
    let saveChain: Promise<void> = Promise.resolve()
    let retries = 0
    let disposed = false

    const cancel = () => {
      if (saveTimer !== null) {
        window.clearTimeout(saveTimer)
        saveTimer = null
      }
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer)
        retryTimer = null
      }
    }

    const save = () => {
      const run = async () => {
        if (disposed) return
        const projectId = projectIdRef.current
        setSaveStatus("saving")

        try {
          const updatedAt = await saveProjectCanvas(editor, projectId)
          const touched = await touchProjectRecord(projectId, updatedAt)
          if (disposed) return

          retries = 0
          setSaveStatus("saved")
          if (touched) {
            setProjects((current) =>
              current.map((item) => (item.id === touched.id ? touched : item))
            )
          }
        } catch (error) {
          if (disposed) return
          console.error("[kunDraw] 画布保存失败", error)
          setSaveStatus("error")

          if (retries < MAX_SAVE_RETRIES) {
            retries += 1
            retryTimer = window.setTimeout(() => {
              retryTimer = null
              void save()
            }, RETRY_DELAY_MS)
          }
        }
      }

      const chained = saveChain.then(run, run)
      saveChain = chained.then(
        () => undefined,
        () => undefined
      )
      return chained
    }

    const flush = async () => {
      cancel()
      await save()
    }

    autosaveRef.current = { flush, settle: () => saveChain, cancel }

    const schedule = () => {
      if (switchingRef.current) return
      if (saveTimer !== null) window.clearTimeout(saveTimer)
      saveTimer = window.setTimeout(() => {
        saveTimer = null
        void save()
      }, SAVE_DELAY_MS)
    }

    const unlistenDocument = editor.store.listen(schedule, { scope: "document" })
    // The camera lives in session scope, so pans and zooms only persist when the
    // viewport itself changes (selection and pointer movement are ignored).
    const unlistenSession = editor.store.listen(
      (entry) => {
        const touched = [
          ...Object.values(entry.changes.added),
          ...Object.values(entry.changes.updated).map(([, to]) => to),
        ]
        if (touched.some((record) => record.typeName === "camera")) schedule()
      },
      { scope: "session" }
    )

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") void flush()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("pagehide", flush)

    return () => {
      disposed = true
      unlistenDocument()
      unlistenSession()
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("pagehide", flush)
      cancel()
      autosaveRef.current = null
    }
  }, [editor])

  const openProject = useCallback(
    async (next: Project) => {
      if (!editor) return
      switchingRef.current = true

      try {
        const restored = await loadProjectCanvas(editor, next.id)
        if (!restored) clearCanvasContent(editor)
        await writeCurrentProjectId(next.id)
        projectIdRef.current = next.id
        setProject(next)
      } finally {
        switchingRef.current = false
      }
    },
    [editor]
  )

  const createProject = useCallback(async () => {
    if (!editor) return
    await autosaveRef.current?.flush()
    await openProject(await createProjectRecord())
    setProjects(await listProjects())
  }, [editor, openProject])

  const switchProject = useCallback(
    async (id: string) => {
      if (!editor || id === projectIdRef.current) return
      const target = projects.find((item) => item.id === id)
      if (!target) return

      await autosaveRef.current?.flush()
      await openProject(target)
    },
    [editor, openProject, projects]
  )

  const renameProject = useCallback(async (name: string) => {
    const renamed = await renameProjectRecord(projectIdRef.current, name)
    if (!renamed) return

    setProject(renamed)
    setProjects((current) => current.map((item) => (item.id === renamed.id ? renamed : item)))
  }, [])

  const deleteProject = useCallback(
    async (id: string) => {
      if (!editor) return
      const autosave = autosaveRef.current
      const remaining = projects.filter((item) => item.id !== id)

      autosave?.cancel()

      if (id === projectIdRef.current) {
        // Let the doomed project's in-flight save finish before it is deleted.
        await autosave?.settle()
        await openProject(remaining[0] ?? (await createProjectRecord()))
      } else {
        // Keep the live project referenced before its assets are collected.
        await autosave?.flush()
      }

      await removeProjectRecord(id)
      setProjects(await listProjects())
    },
    [editor, openProject, projects]
  )

  const clearAllLocalData = useCallback(async () => {
    if (!editor) return
    const autosave = autosaveRef.current
    autosave?.cancel()
    switchingRef.current = true

    try {
      await autosave?.settle()
      await clearRecords(CANVASES_STORE)
      await clearRecords(PROJECTS_STORE)
      await clearRecords(ASSETS_STORE)
      clearCanvasContent(editor)
      releaseAllRuntimeUrls()

      const created = await createProjectRecord()
      await writeCurrentProjectId(created.id)
      projectIdRef.current = created.id
      setProject(created)
      setProjects([created])
      setSaveStatus("saved")
    } finally {
      switchingRef.current = false
    }
  }, [editor])

  const value = useMemo<ProjectContextValue>(
    () => ({
      projects,
      project,
      createProject,
      switchProject,
      renameProject,
      deleteProject,
      clearAllLocalData,
    }),
    [projects, project, createProject, switchProject, renameProject, deleteProject, clearAllLocalData]
  )

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}
