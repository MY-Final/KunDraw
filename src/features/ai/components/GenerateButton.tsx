import { LoaderCircle, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

export function GenerateButton({
  loading,
  disabled,
  onClick,
}: {
  loading: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Button
      size="sm"
      disabled={disabled || loading}
      aria-busy={loading}
      onClick={onClick}
      className="h-8 w-full gap-1.5 bg-brand text-xs font-medium text-brand-foreground hover:bg-brand/90"
    >
      {loading ? (
        <>
          <LoaderCircle className="size-3.5 animate-spin" />
          正在生成...
        </>
      ) : (
        <>
          <Sparkles className="size-3.5" />
          生成图片
        </>
      )}
    </Button>
  )
}
