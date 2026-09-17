import { useCallback, useState } from "react"
import { Check, Eye, EyeOff, LoaderCircle, ScanSearch } from "lucide-react"

import { NewApiClient } from "@/api/newapi/client"
import { describeNewApiError, toNewApiError } from "@/api/newapi/errors"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useAi } from "../useAi"

type TestState =
  | { status: "idle" }
  | { status: "testing" }
  | { status: "ok"; models: string[] }
  | { status: "error"; title: string; hints: string[] }

/**
 * Rendered inside `DialogContent`, which Base UI unmounts while closed, so the
 * draft fields re-initialise from stored config on every open.
 */
function SettingsForm({ onClose }: { onClose: () => void }) {
  const ai = useAi()
  const [baseUrl, setBaseUrl] = useState(ai.config.baseUrl)
  const [apiKey, setApiKey] = useState(ai.config.apiKey)
  const [showKey, setShowKey] = useState(false)
  const [test, setTest] = useState<TestState>({ status: "idle" })

  const handleTest = useCallback(async () => {
    setTest({ status: "testing" })
    try {
      const client = new NewApiClient({ baseUrl, apiKey })
      const models = await client.listModels()
      setTest({ status: "ok", models })
    } catch (error) {
      console.error("[kunDraw] 连接测试失败", error)
      const info = describeNewApiError(toNewApiError(error), "models")
      setTest({ status: "error", title: info.title, hints: info.hints })
    }
  }, [apiKey, baseUrl])

  const handleSave = useCallback(() => {
    const remoteModels = test.status === "ok" ? test.models : ai.config.remoteModels
    ai.setConfig({
      ...ai.config,
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      remoteModels,
    })
    onClose()
  }, [ai, apiKey, baseUrl, onClose, test])

  return (
    <>
      <DialogHeader>
        <DialogTitle>AI 设置</DialogTitle>
        <DialogDescription>
          配置你自己的 NewAPI 接口。密钥只保存在这个浏览器里，不会发送到 kunDraw。
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="ai-base-url" className="text-xs">
            API Base URL
          </Label>
          <Input
            id="ai-base-url"
            value={baseUrl}
            spellCheck={false}
            autoComplete="off"
            placeholder="https://your-newapi.example.com/v1"
            onChange={(event) => setBaseUrl(event.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ai-api-key" className="text-xs">
            API Key
          </Label>
          <div className="relative">
            <Input
              id="ai-api-key"
              type={showKey ? "text" : "password"}
              value={apiKey}
              spellCheck={false}
              autoComplete="off"
              placeholder="sk-xxxxxxxx"
              onChange={(event) => setApiKey(event.target.value)}
              className="h-8 pr-8 text-xs"
            />
            <button
              type="button"
              aria-label={showKey ? "隐藏密钥" : "显示密钥"}
              title={showKey ? "隐藏" : "显示"}
              onClick={() => setShowKey((value) => !value)}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={test.status === "testing" || !baseUrl.trim()}
            onClick={() => void handleTest()}
          >
            {test.status === "testing" ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <ScanSearch className="size-3.5" />
            )}
            测试连接
          </Button>

          {test.status === "ok" ? (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Check className="size-3.5" />
              连接成功
              <span className="text-muted-foreground">
                （{test.models.length} 个模型）
              </span>
            </span>
          ) : null}

          {test.status === "error" ? (
            <span className="text-xs text-destructive">{test.title}</span>
          ) : null}
        </div>

        {test.status === "error" && test.hints.length > 0 ? (
          <ul className="space-y-0.5 text-[11px] text-muted-foreground">
            {test.hints.map((hint) => (
              <li key={hint}>· {hint}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose}>
          取消
        </Button>
        <Button size="sm" onClick={handleSave}>
          保存
        </Button>
      </DialogFooter>
    </>
  )
}

export function AiSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <SettingsForm onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
