import { ImageIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import type { ImageModel } from "../types"
import { AiField } from "./AiField"

function ModelName({ model }: { model: ImageModel }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="truncate">{model.name}</span>
      {model.description ? (
        <span className="truncate text-[11px] text-muted-foreground">
          （{model.description}）
        </span>
      ) : null}
    </span>
  )
}

export function ModelPicker({
  models,
  value,
  onChange,
  disabled,
}: {
  models: ImageModel[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
}) {
  const selected = models.find((model) => model.id === value) ?? models[0]

  return (
    <AiField label="模型">
      <Select
        value={value}
        onValueChange={(next) => {
          if (typeof next === "string") onChange(next)
        }}
        disabled={disabled}
      >
        <SelectTrigger
          aria-label="模型"
          className="h-8 w-full border-input bg-transparent px-2 text-xs"
        >
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" />
            {selected ? <ModelName model={selected} /> : "选择模型"}
          </span>
          {selected?.recommended ? (
            <Badge
              variant="outline"
              className="h-4 gap-1 border-brand/30 bg-brand-subtle px-1.5 text-[10px] text-brand"
            >
              <span className="size-1 rounded-full bg-brand" />
              推荐
            </Badge>
          ) : null}
        </SelectTrigger>
        <SelectContent align="start" sideOffset={4} alignItemWithTrigger={false}>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id} className="text-xs">
              <ModelName model={model} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </AiField>
  )
}
