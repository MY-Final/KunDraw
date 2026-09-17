import { useCallback } from "react"
import { Image as ImageIcon, Sparkles } from "lucide-react"
import { useValue } from "tldraw"

import { ErrorNotice } from "./ErrorNotice"
import { GenerationSettings } from "./GenerationSettings"
import { GenerateButton } from "./GenerateButton"
import { PromptField } from "./PromptField"
import { ReferenceImages } from "./ReferenceImages"
import { ResultGallery } from "./ResultGallery"
import {
  computeSize,
} from "../constants"
import { useAi } from "../useAi"
import { addImageToCanvas } from "../canvas"
import { generatePromptNode } from "@/features/canvas/nodeCommands"
import {
  addReferenceFilesToPrompt,
  removePromptReferences,
  referencesForPrompt,
} from "@/features/canvas/references"
import {
  PROMPT_SHAPE_TYPE,
  type PromptShape,
} from "@/features/canvas/shapeTypes"
import { useWorkspaceEditor } from "@/hooks/useEditor"
import type { GeneratedImage } from "../types"

export function AiPanel({ onOpenSettings }: { onOpenSettings: () => void }) {
  const ai = useAi()
  const editor = useWorkspaceEditor()
  const { settings } = ai

  const selectedPrompt = useValue(
    "kundraw selected prompt",
    () => {
      const shape = editor?.getOnlySelectedShape()
      return shape?.type === PROMPT_SHAPE_TYPE ? (shape as PromptShape) : null
    },
    [editor]
  )

  const loading = ai.status === "generating"
  const panelMode = selectedPrompt?.props.mode ?? settings.mode
  const usesReferences = panelMode === "image"

  const handleGenerate = useCallback(() => {
    if (editor && selectedPrompt) {
      void generatePromptNode(editor, ai, selectedPrompt.id)
      return
    }

    void ai.generate().then(async (images) => {
      if (!editor) return
      for (const image of images) {
        await addImageToCanvas(editor, image)
      }
    })
  }, [ai, editor, selectedPrompt])

  const handleRegenerate = useCallback(
    (image: GeneratedImage) => {
      void ai
        .generate({
          prompt: image.source.prompt,
          model: image.source.model,
          mode: image.source.mode,
          count: image.source.count,
        })
        .then(async (images) => {
          if (!editor) return
          for (const next of images) await addImageToCanvas(editor, next)
        })
    },
    [ai, editor]
  )

  const panelPrompt = selectedPrompt?.props.prompt ?? ai.prompt
  const panelModel = selectedPrompt?.props.model ?? settings.model
  const panelRatio = selectedPrompt?.props.aspectRatio ?? settings.aspectRatio
  const panelResolution = selectedPrompt?.props.resolution ?? settings.resolution
  const panelCount = selectedPrompt?.props.count ?? settings.count
  const panelReferences = useValue(
    "kundraw selected prompt references",
    () => (editor && selectedPrompt ? referencesForPrompt(editor, selectedPrompt) : ai.references),
    [ai.references, editor, selectedPrompt]
  )
  const size = computeSize({
    ...settings,
    mode: panelMode,
    model: panelModel,
    aspectRatio: panelRatio,
    resolution: panelResolution,
    count: panelCount,
  })

  const updateSelectedPrompt = (props: Partial<PromptShape["props"]>) => {
    if (!editor || !selectedPrompt) return false
    editor.updateShape<PromptShape>({
      id: selectedPrompt.id,
      type: PROMPT_SHAPE_TYPE,
      props,
    })
    return true
  }

  return (
    <div className="space-y-4 p-3">
      {selectedPrompt ? (
        <div className="flex items-center gap-2 rounded-md border border-brand/25 bg-brand-subtle px-2.5 py-2 text-brand">
          {selectedPrompt.props.mode === "image" ? <ImageIcon className="size-3.5" /> : <Sparkles className="size-3.5" />}
          <div className="min-w-0">
            <p className="text-xs font-medium">正在编辑画布中的{selectedPrompt.props.mode === "image" ? "图生图" : "文生图"}节点</p>
            <p className="truncate text-[10px] text-brand/75">右侧修改会实时同步到当前节点{selectedPrompt.props.mode === "image" ? ` · ${panelReferences.length} 张参考图` : ""}</p>
          </div>
        </div>
      ) : null}

      <PromptField
        prompt={panelPrompt}
        onChange={(prompt) => {
          if (!updateSelectedPrompt({ prompt })) ai.setPrompt(prompt)
        }}
        onSubmit={handleGenerate}
        disabled={loading}
      />

      <ReferenceImages
        references={panelReferences}
        onAdd={(files) =>
          editor && selectedPrompt
            ? addReferenceFilesToPrompt(editor, selectedPrompt, files)
            : ai.addReferences(files)
        }
        onRemove={(id) => {
          if (!selectedPrompt) {
            ai.removeReference(id)
            return
          }
          const imageId = selectedPrompt.props.referenceImages.find(
            (shapeId) => `ref_${shapeId}` === id
          )
          if (editor && imageId) removePromptReferences(editor, selectedPrompt, [imageId])
        }}
        onClear={() => {
          if (editor && selectedPrompt) {
            removePromptReferences(editor, selectedPrompt, selectedPrompt.props.referenceImages)
          } else {
            ai.clearReferences()
          }
        }}
      />

      {usesReferences && panelReferences.length === 0 ? (
        <p className="rounded-md border border-border bg-muted/50 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
          图生图需要至少一张参考图，也可以直接切回文生图。
        </p>
      ) : null}

      <GenerationSettings
        mode={panelMode}
        model={panelModel}
        models={ai.models}
        aspectRatio={panelRatio}
        resolution={panelResolution}
        count={panelCount}
        disabled={loading}
        onOpenSettings={onOpenSettings}
        onModeChange={(mode) => {
          if (!updateSelectedPrompt({ mode })) ai.updateSettings({ mode })
        }}
        onModelChange={(model) => {
          if (!updateSelectedPrompt({ model })) ai.updateSettings({ model })
        }}
        onAspectRatioChange={(aspectRatio) => {
          if (!updateSelectedPrompt({ aspectRatio })) ai.updateSettings({ aspectRatio })
        }}
        onResolutionChange={(resolution) => {
          if (!updateSelectedPrompt({ resolution })) ai.updateSettings({ resolution })
        }}
        onCountChange={(count) => {
          if (!updateSelectedPrompt({ count })) ai.updateSettings({ count })
        }}
      />

      {!ai.isConfigured ? (
        <p className="flex flex-wrap items-center gap-x-1 gap-y-0.5 rounded-md border border-border bg-muted/50 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
          尚未配置 NewAPI。
          <button
            type="button"
            onClick={onOpenSettings}
            className="font-medium text-brand transition-colors hover:text-brand/80"
          >
            打开设置
          </button>
        </p>
      ) : null}

      {ai.error ? <ErrorNotice error={ai.error} onDismiss={ai.clearError} /> : null}

      <GenerateButton
        loading={loading}
        disabled={!ai.isConfigured || !panelPrompt.trim()}
        onClick={handleGenerate}
      />

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Sparkles className="size-3 shrink-0" />
        {usesReferences
          ? `将附带 ${panelReferences.length} 张参考图，尺寸 ${size ?? "自动"}`
          : `文生图，尺寸 ${size ?? "自动"}`}
      </p>

      <ResultGallery
        results={ai.results}
        onRegenerate={handleRegenerate}
        onRemove={ai.removeResult}
        onClear={ai.clearResults}
      />
    </div>
  )
}
