import { useRef } from "react"
import { cn } from "cn"

import { Textarea } from "@/components/ui/textarea"
import { PROMPT_MAX_LENGTH } from "../constants"
import { AiField } from "./AiField"

export function PromptField({
  prompt,
  onChange,
  onSubmit,
  disabled,
}: {
  prompt: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <AiField
      label="描述你想生成的图片"
      action={
        prompt ? (
          <button
            type="button"
            onClick={() => {
              onChange("")
              areaRef.current?.focus()
            }}
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            清空
          </button>
        ) : null
      }
    >
      <div
        className={cn(
          "rounded-md border border-input transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          disabled && "opacity-60"
        )}
      >
        <Textarea
          ref={areaRef}
          value={prompt}
          disabled={disabled}
          aria-label="提示词"
          placeholder="描述你想生成的图片，例如：海边小镇，女孩和猫咪，阳光明媚，日系动漫风格"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault()
              onSubmit()
            }
          }}
          className="max-h-40 min-h-20 resize-none border-0 bg-transparent px-2.5 py-2 text-xs shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-end px-2.5 pb-1.5">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {prompt.length}/{PROMPT_MAX_LENGTH}
          </span>
        </div>
      </div>
    </AiField>
  )
}
