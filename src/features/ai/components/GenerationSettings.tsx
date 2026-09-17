import { useState } from "react"
import { ChevronDown, Image as ImageIcon, Minus, Plus, SlidersHorizontal, Type } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  ASPECT_RATIOS,
  ASPECT_RATIO_LABELS,
  BASE_RESOLUTIONS,
  MAX_COUNT,
  MIN_COUNT,
} from "../constants"
import type { AspectRatio, BaseResolution, GenerationMode } from "../types"
import { ChannelPicker } from "./ChannelPicker"
import { ChoiceGroup, type Choice } from "./ChoiceGroup"
import { ModelPicker } from "./ModelPicker"

const MODE_CHOICES: Choice<GenerationMode>[] = [
  { value: "text", label: "文生图", icon: <Type /> },
  { value: "image", label: "图生图", icon: <ImageIcon /> },
]

const ASPECT_CHOICES: Choice<AspectRatio>[] = ASPECT_RATIOS.map((value) => ({
  value,
  label: ASPECT_RATIO_LABELS[value],
}))

const RESOLUTION_CHOICES: Choice<string>[] = BASE_RESOLUTIONS.map((value) => ({
  value: String(value),
  label: `${value}P`,
}))

export function GenerationSettings({
  mode,
  model,
  models,
  aspectRatio,
  resolution,
  count,
  disabled,
  onOpenSettings,
  onModeChange,
  onModelChange,
  onAspectRatioChange,
  onResolutionChange,
  onCountChange,
}: {
  mode: GenerationMode
  model: string
  models: string[]
  aspectRatio: AspectRatio
  resolution: BaseResolution
  count: number
  disabled: boolean
  onOpenSettings: () => void
  onModeChange: (value: GenerationMode) => void
  onModelChange: (value: string) => void
  onAspectRatioChange: (value: AspectRatio) => void
  onResolutionChange: (value: BaseResolution) => void
  onCountChange: (value: number) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border">
      <CollapsibleTrigger
        render={<Button type="button" variant="ghost" className="h-auto w-full justify-between rounded-lg px-3 py-2.5" />}
      >
        <span className="flex min-w-0 items-center gap-2">
          <SlidersHorizontal className="size-3.5 text-muted-foreground" />
          <span className="text-xs">生成设置</span>
          <span className="truncate text-[10px] font-normal text-muted-foreground">
            {model || "未选择模型"} · {ASPECT_RATIO_LABELS[aspectRatio]} · {count} 张
          </span>
        </span>
        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4 border-t border-border px-3 pt-3 pb-3">
        <ChannelPicker onOpenSettings={onOpenSettings} disabled={disabled} />

        <ChoiceGroup ariaLabel="生成模式" value={mode} choices={MODE_CHOICES} onChange={onModeChange} disabled={disabled} />

        <ModelPicker models={models} value={model} onChange={onModelChange} disabled={disabled} />

        <div className="space-y-2">
          <span className="text-xs font-medium text-foreground/80">比例</span>
          <ChoiceGroup ariaLabel="比例" value={aspectRatio} choices={ASPECT_CHOICES} onChange={onAspectRatioChange} disabled={disabled} wrap />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium text-foreground/80">分辨率</span>
          <ChoiceGroup ariaLabel="分辨率" value={String(resolution)} choices={RESOLUTION_CHOICES} onChange={(value) => onResolutionChange(Number(value) as BaseResolution)} disabled={disabled} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-foreground/80">生成数量</p>
            <p className="text-[10px] text-muted-foreground">每次生成的结果张数</p>
          </div>
          <div className="flex items-center rounded-md border border-border bg-background p-0.5">
            <Button type="button" variant="ghost" size="icon-xs" aria-label="减少生成数量" title="减少生成数量" disabled={disabled || count <= MIN_COUNT} onClick={() => onCountChange(Math.max(MIN_COUNT, count - 1))}><Minus /></Button>
            <span className="w-12 text-center text-xs font-medium tabular-nums">{count} 张</span>
            <Button type="button" variant="ghost" size="icon-xs" aria-label="增加生成数量" title="增加生成数量" disabled={disabled || count >= MAX_COUNT} onClick={() => onCountChange(Math.min(MAX_COUNT, count + 1))}><Plus /></Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
