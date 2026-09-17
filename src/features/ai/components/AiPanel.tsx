import { useCallback } from "react"
import { Image, Sparkles, Type } from "lucide-react"

import { getImageModel } from "../models"
import { ASPECT_RATIOS, IMAGE_COUNTS } from "../constants"
import { useAi } from "../useAi"
import type { AspectRatio, GeneratedImage, ImageCount } from "../types"
import { AiField } from "./AiField"
import { ChoiceGroup, type Choice } from "./ChoiceGroup"
import { ErrorNotice } from "./ErrorNotice"
import { GenerateButton } from "./GenerateButton"
import { ModelPicker } from "./ModelPicker"
import { PromptField } from "./PromptField"
import { ReferenceImages } from "./ReferenceImages"
import { ResultGallery } from "./ResultGallery"

const MODE_CHOICES: Choice<"text" | "image">[] = [
  { value: "text", label: "文生图", icon: <Type /> },
  { value: "image", label: "图生图", icon: <Image /> },
]

export function AiPanel({ onOpenSettings }: { onOpenSettings: () => void }) {
  const ai = useAi()

  const model = getImageModel(ai.models, ai.settings.modelId)
  const useReferences = ai.references.length > 0 && model.capabilities.imageToImage

  const aspectChoices: Choice<AspectRatio>[] = ASPECT_RATIOS.filter((ratio) =>
    model.capabilities.supportedAspectRatios.includes(ratio)
  ).map((ratio) => ({ value: ratio, label: ratio }))

  const countChoices: Choice<string>[] = IMAGE_COUNTS.filter((count) =>
    model.capabilities.supportedCounts.includes(count)
  ).map((count) => ({ value: String(count), label: String(count) }))

  const loading = ai.status === "generating"

  const handleGenerate = useCallback(() => {
    void ai.generate()
  }, [ai])

  const handleRegenerate = useCallback(
    (image: GeneratedImage) => {
      void ai.generate({
        prompt: image.source.prompt,
        modelId: image.source.modelId,
        aspectRatio: image.source.aspectRatio,
      })
    },
    [ai]
  )

  const switchMode = useCallback(
    (next: "text" | "image") => {
      if (next === "text") {
        ai.clearReferences()
        return
      }
      // 图生图 needs at least one reference; the uploader is the way to add it.
      if (ai.references.length === 0) return
    },
    [ai]
  )

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="space-y-4 p-3">
        <ChoiceGroup
          ariaLabel="生成模式"
          value={useReferences ? "image" : "text"}
          choices={MODE_CHOICES}
          onChange={switchMode}
          disabled={loading}
        />

        <PromptField
          prompt={ai.prompt}
          onChange={ai.setPrompt}
          onSubmit={handleGenerate}
          disabled={loading}
        />

        {model.capabilities.imageToImage ? (
          <ReferenceImages
            references={ai.references}
            model={model}
            onAdd={ai.addReferences}
            onRemove={ai.removeReference}
            onClear={ai.clearReferences}
          />
        ) : null}

        <ModelPicker
          models={ai.models}
          value={ai.settings.modelId}
          onChange={(modelId) => ai.updateSettings({ modelId })}
          disabled={loading}
        />

        {aspectChoices.length > 0 ? (
          <AiField label="比例">
            <ChoiceGroup
              ariaLabel="比例"
              value={ai.settings.aspectRatio}
              choices={aspectChoices}
              onChange={(aspectRatio) => ai.updateSettings({ aspectRatio })}
              disabled={loading}
            />
          </AiField>
        ) : null}

        {countChoices.length > 0 && !useReferences ? (
          <AiField label="数量">
            <ChoiceGroup
              ariaLabel="数量"
              value={String(ai.settings.count)}
              choices={countChoices}
              onChange={(value) =>
                ai.updateSettings({ count: Number(value) as ImageCount })
              }
              disabled={loading}
            />
          </AiField>
        ) : null}

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

        {ai.error ? (
          <ErrorNotice error={ai.error} onDismiss={ai.clearError} />
        ) : null}

        <GenerateButton
          loading={loading}
          disabled={!ai.isConfigured || !ai.prompt.trim()}
          onClick={handleGenerate}
        />

        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Sparkles className="size-3 shrink-0" />
          {model.capabilities.imageToImage
            ? "生成后可直接添加到画布，参考图会随请求一起发送"
            : "该模型仅支持文生图，参考图不会发送"}
        </p>

        <ResultGallery
          results={ai.results}
          onRegenerate={handleRegenerate}
          onRemove={ai.removeResult}
          onClear={ai.clearResults}
        />
      </div>
    </div>
  )
}
