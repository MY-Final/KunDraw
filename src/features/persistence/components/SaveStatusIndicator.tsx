import { Check, LoaderCircle, TriangleAlert } from "lucide-react"
import { cn } from "cn"

import type { SaveStatus } from "../status"
import { useSaveStatus } from "../useSaveStatus"

const LABELS: Record<SaveStatus, string> = {
  saved: "已保存",
  saving: "保存中",
  error: "保存失败",
}

const TITLES: Record<SaveStatus, string> = {
  saved: "画布与图片已保存到这个浏览器",
  saving: "正在写入本地数据库",
  error: "保存失败，请检查浏览器存储空间",
}

export function SaveStatusIndicator() {
  const status = useSaveStatus()

  return (
    <div
      title={TITLES[status]}
      className={cn(
        "hidden items-center gap-1.5 pr-1 text-xs text-muted-foreground md:flex",
        status === "error" && "text-destructive"
      )}
    >
      {status === "saving" ? (
        <LoaderCircle className="size-3.5 animate-spin" />
      ) : status === "error" ? (
        <TriangleAlert className="size-3.5" />
      ) : (
        <Check className="size-3.5" />
      )}
      <span>{LABELS[status]}</span>
    </div>
  )
}
