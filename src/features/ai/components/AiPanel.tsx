import { useCallback } from "react"
import { Image as ImageIcon, Sparkles, Type } from "lucide-react"
import { useValue } from "tldraw"

import { ChoiceGroup, type Choice } from "./ChoiceGroup"
import { ChannelPicker } from "./ChannelPicker"
import { ErrorNotice } from "./ErrorNotice"
import { GenerateButton } from "./GenerateButton"
import { ModelPicker } from "./ModelPicker"
import { PromptField } from "./PromptField"
import { ReferenceImages } from "./ReferenceImages"
import { ResultGallery } from "./ResultGallery"
import { NumberInput } from "@/components/workspace/PropertyInput"
import { PropertyRow } from "@/components/workspace/PropertySection"
import {
  ASPECT_RATIOS,
  ASPECT_RATIO_LABELS,
  BASE_RESOLUTIONS,
  MAX_COUNT,
  MIN_COUNT,
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
import type { AspectRatio, BaseResolution, GeneratedImage, GenerationMode } from "../types"

const MODE_CHOICES: Choice<GenerationMode>[] = [
  { value: "text", label: "文生图", icon: <Type /> },
  { value: "image", label: "图生图", icon: <ImageIcon /> },
]

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

  const aspectChoices: Choice<AspectRatio>[] = ASPECT_RATIOS.map((ratio) => ({
    value: ratio,
    label: ASPECT_RATIO_LABELS[ratio],
  }))

  const resolutionChoices: Choice<string>[] = BASE_RESOLUTIONS.map((value) => ({
    value: String(value),
    label: `${value}P`,
  }))

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
      <ChannelPicker onOpenSettings={onOpenSettings} disabled={loading} />

      {selectedPrompt ? (
        <div className="flex items-center gap-2 rounded-md border border-brand/25 bg-brand-subtle px-2.5 py-2 text-[11px] text-brand">
          <Sparkles className="size-3.5" />
          正在配置画布中的 Prompt 节点
        </div>
      ) : null}

      <ChoiceGroup
        ariaLabel="生成模式"
        value={panelMode}
        choices={MODE_CHOICES}
        onChange={(mode) => {
          if (!updateSelectedPrompt({ mode })) ai.updateSettings({ mode })
        }}
        disabled={loading}
      />

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

      <ModelPicker
        models={ai.models}
        value={panelModel}
        onChange={(model) => {
          if (!updateSelectedPrompt({ model })) ai.updateSettings({ model })
        }}
        disabled={loading}
      />

      <div className="space-y-2">
        <span className="text-xs font-medium text-foreground/80">比例</span>
        <ChoiceGroup
          ariaLabel="比例"
          value={panelRatio}
          choices={aspectChoices}
          onChange={(aspectRatio) => {
            if (!updateSelectedPrompt({ aspectRatio })) ai.updateSettings({ aspectRatio })
          }}
          disabled={loading}
          wrap
        />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium text-foreground/80">分辨率</span>
        <ChoiceGroup
          ariaLabel="分辨率"
          value={String(panelResolution)}
          choices={resolutionChoices}
          onChange={(value) => {
            const resolution = Number(value) as BaseResolution
            if (!updateSelectedPrompt({ resolution })) ai.updateSettings({ resolution })
          }}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium text-foreground/80">数量</span>
        <PropertyRow label="张数" hint={`≤ ${MAX_COUNT}`}>
          <NumberInput
            ariaLabel="数量"
            value={panelCount}
            min={MIN_COUNT}
            max={MAX_COUNT}
            disabled={loading}
            onCommit={(count) => {
              if (!updateSelectedPrompt({ count })) ai.updateSettings({ count })
            }}
          />
        </PropertyRow>
      </div>

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
