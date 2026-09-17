import { Settings2 } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

import { useAi } from "../useAi"
import { AiField } from "./AiField"

/**
 * Picks the NewAPI channel to generate with. Each channel is an independent
 * endpoint the user configured in settings.
 */
export function ChannelPicker({
  onOpenSettings,
  disabled,
}: {
  onOpenSettings: () => void
  disabled?: boolean
}) {
  const ai = useAi()
  const { channels, activeChannel } = ai

  return (
    <AiField
      label="渠道"
      action={
        <button
          type="button"
          onClick={onOpenSettings}
          className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          管理
        </button>
      }
    >
      {channels.length === 0 ? (
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground"
        >
          <Settings2 className="size-3.5" />
          添加渠道
        </button>
      ) : (
        <Select
          value={activeChannel?.id ?? ""}
          onValueChange={(value) => {
            if (typeof value === "string") ai.setActiveChannelId(value)
          }}
          disabled={disabled}
        >
          <SelectTrigger
            aria-label="渠道"
            className="h-8 w-full border-input bg-transparent px-2 text-xs"
          >
            <span className="truncate">
              {activeChannel?.name || "未命名渠道"}
            </span>
          </SelectTrigger>
          <SelectContent align="start" sideOffset={4} alignItemWithTrigger={false}>
            {channels.map((channel) => (
              <SelectItem key={channel.id} value={channel.id} className="text-xs">
                {channel.name || "未命名渠道"}
                {channel.baseUrl ? "" : "（未配置）"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </AiField>
  )
}
