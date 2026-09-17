import { Sparkles, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GenerationElapsed } from "./GenerationElapsed"

export function GenerateButton({
  loading,
  disabled,
  onClick,
  onCancel,
}: {
  loading: boolean
  disabled?: boolean
  onClick: () => void
  onCancel: () => void
}) {
  if (loading) {
    return (
      <Button
        size="sm"
        variant="outline"
        aria-busy
        onClick={onCancel}
        className="h-8 w-full gap-1.5 text-xs font-medium"
      >
        <Square className="size-3.5 fill-current" />
        取消生成 · <GenerationElapsed />
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className="h-8 w-full gap-1.5 bg-brand text-xs font-medium text-brand-foreground hover:bg-brand/90"
    >
      <Sparkles className="size-3.5" />
      生成图片
    </Button>
  )
}
