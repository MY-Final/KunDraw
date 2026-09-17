import { useCallback } from "react"
import { Image as ImageIcon, Sparkles, Type } from "lucide-react"

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
import type { AspectRatio, BaseResolution, GeneratedImage, GenerationMode } from "../types"

const MODE_CHOICES: Choice<GenerationMode>[] = [
  { value: "text", label: "文生图", icon: <Type /> },
  { value: "image", label: "图生图", icon: <ImageIcon /> },
]

export function AiPanel({ onOpenSettings }: { onOpenSettings: () => void }) {
  const ai = useAi()
  const { settings } = ai

  const aspectChoices: Choice<AspectRatio>[] = ASPECT_RATIOS.map((ratio) => ({
    value: ratio,
    label: ASPECT_RATIO_LABELS[ratio],
  }))

  const resolutionChoices: Choice<string>[] = BASE_RESOLUTIONS.map((value) => ({
    value: String(value),
    label: `${value}P`,
  }))

  const size = computeSize(settings)
  const loading = ai.status === "generating"
  const usesReferences = settings.mode === "image"

  const handleGenerate = useCallback(() => {
    void ai.generate()
  }, [ai])

  const handleRegenerate = useCallback(
    (image: GeneratedImage) => {
      void ai.generate({
        prompt: image.source.prompt,
        model: image.source.model,
        mode: image.source.mode,
        count: image.source.count,
      })
    },
    [ai]
  )

  return (
    <div className="space-y-4 p-3">
      <ChannelPicker onOpenSettings={onOpenSettings} disabled={loading} />

      <ChoiceGroup
        ariaLabel="生成模式"
        value={settings.mode}
        choices={MODE_CHOICES}
        onChange={(mode) => ai.updateSettings({ mode })}
        disabled={loading}
      />

      <PromptField
        prompt={ai.prompt}
        onChange={ai.setPrompt}
        onSubmit={handleGenerate}
        disabled={loading}
      />

      <ReferenceImages
        references={ai.references}
        onAdd={ai.addReferences}
        onRemove={ai.removeReference}
        onClear={ai.clearReferences}
      />

      {usesReferences && ai.references.length === 0 ? (
        <p className="rounded-md border border-border bg-muted/50 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
          图生图需要至少一张参考图，也可以直接切回文生图。
        </p>
      ) : null}

      <ModelPicker
        models={ai.models}
        value={settings.model}
        onChange={(model) => ai.updateSettings({ model })}
        disabled={loading}
      />

      <div className="space-y-2">
        <span className="text-xs font-medium text-foreground/80">比例</span>
        <ChoiceGroup
          ariaLabel="比例"
          value={settings.aspectRatio}
          choices={aspectChoices}
          onChange={(aspectRatio) => ai.updateSettings({ aspectRatio })}
          disabled={loading}
          wrap
        />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium text-foreground/80">分辨率</span>
        <ChoiceGroup
          ariaLabel="分辨率"
          value={String(settings.resolution)}
          choices={resolutionChoices}
          onChange={(value) =>
            ai.updateSettings({ resolution: Number(value) as BaseResolution })
          }
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium text-foreground/80">数量</span>
        <PropertyRow label="张数" hint={`≤ ${MAX_COUNT}`}>
          <NumberInput
            ariaLabel="数量"
            value={settings.count}
            min={MIN_COUNT}
            max={MAX_COUNT}
            disabled={loading}
            onCommit={(count) => ai.updateSettings({ count })}
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
        disabled={!ai.isConfigured || !ai.prompt.trim()}
        onClick={handleGenerate}
      />

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Sparkles className="size-3 shrink-0" />
        {usesReferences
          ? `将附带 ${ai.references.length} 张参考图，尺寸 ${size ?? "自动"}`
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
