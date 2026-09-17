import { useCallback, useState } from "react"
import { Check, Eye, EyeOff, LoaderCircle, Plus, ScanSearch, Trash } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { cn } from "cn"

import { createChannel } from "../storage"
import type { Channel } from "../types"
import { useAi } from "../useAi"

type TestState =
  | { status: "idle" }
  | { status: "testing" }
  | { status: "ok"; models: string[] }
  | { status: "error"; title: string; hints: string[] }

/** Rendered inside DialogContent, which unmounts while closed, so drafts re-init on open. */
function ChannelsForm({ onClose }: { onClose: () => void }) {
  const ai = useAi()
  const [channels, setChannels] = useState<Channel[]>(ai.channels)
  const [activeId, setActiveId] = useState(ai.activeChannel?.id ?? "")
  const [showKey, setShowKey] = useState(false)
  const [test, setTest] = useState<TestState>({ status: "idle" })

  const active = channels.find((channel) => channel.id === activeId) ?? channels[0] ?? null

  const patch = useCallback((id: string, changes: Partial<Channel>) => {
    setChannels((current) =>
      current.map((channel) => (channel.id === id ? { ...channel, ...changes } : channel))
    )
    setTest({ status: "idle" })
  }, [])

  const addChannel = useCallback(() => {
    const channel = createChannel({ name: `渠道 ${channels.length + 1}` })
    setChannels((current) => [...current, channel])
    setActiveId(channel.id)
    setTest({ status: "idle" })
  }, [channels.length])

  const removeChannel = useCallback(
    (id: string) => {
      setChannels((current) => {
        const next = current.filter((channel) => channel.id !== id)
        if (id === activeId) setActiveId(next[0]?.id ?? "")
        return next
      })
      setTest({ status: "idle" })
    },
    [activeId]
  )

  const handleTest = useCallback(async () => {
    if (!active) return
    setTest({ status: "testing" })
    try {
      const client = new NewApiClient(active)
      const models = await client.listModels()
      patch(active.id, { models })
      setTest({ status: "ok", models })
    } catch (error) {
      console.error("[kunDraw] 连接测试失败", error)
      const info = describeNewApiError(toNewApiError(error), "models")
      setTest({ status: "error", title: info.title, hints: info.hints })
    }
  }, [active, patch])

  const handleSave = useCallback(() => {
    const cleaned = channels.map((channel) => ({
      ...channel,
      name: channel.name.trim() || channel.baseUrl.trim() || "未命名渠道",
      baseUrl: channel.baseUrl.trim().replace(/\/+$/, ""),
      apiKey: channel.apiKey.trim(),
    }))

    ai.setChannels(cleaned)
    const nextActive = cleaned.find((channel) => channel.id === activeId) ?? cleaned[0]
    if (nextActive) ai.setActiveChannelId(nextActive.id)
    onClose()
  }, [activeId, ai, channels, onClose])

  return (
    <>
      <DialogHeader>
        <DialogTitle>AI 设置</DialogTitle>
        <DialogDescription>
          配置一个或多个 NewAPI 渠道。密钥只保存在这个浏览器里，不会发送到 kunDraw
          之外的任何服务。
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">渠道</Label>
          <div className="flex gap-2">
            <Select
              value={active?.id ?? ""}
              onValueChange={(value) => {
                if (typeof value === "string") {
                  setActiveId(value)
                  setTest({ status: "idle" })
                }
              }}
            >
              <SelectTrigger aria-label="渠道" className="h-8 flex-1 text-xs">
                <span className="truncate">
                  {active
                    ? `${active.name || "未命名渠道"}${active.baseUrl ? "" : "（未配置）"}`
                    : "尚未添加渠道"}
                </span>
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id} className="text-xs">
                    {channel.name || "未命名渠道"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon-sm"
              aria-label="新增渠道"
              title="新增渠道"
              onClick={addChannel}
              className="size-8"
            >
              <Plus />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="删除渠道"
              title="删除渠道"
              disabled={!active || channels.length <= 1}
              onClick={() => active && removeChannel(active.id)}
              className="size-8 text-destructive"
            >
              <Trash />
            </Button>
          </div>
        </div>

        {active ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="channel-name" className="text-xs">
                渠道名称
              </Label>
              <Input
                id="channel-name"
                value={active.name}
                placeholder="例如：主力渠道"
                onChange={(event) => patch(active.id, { name: event.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="channel-url" className="text-xs">
                API Base URL
              </Label>
              <Input
                id="channel-url"
                value={active.baseUrl}
                spellCheck={false}
                autoComplete="off"
                placeholder="https://your-newapi.example.com/v1"
                onChange={(event) => patch(active.id, { baseUrl: event.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="channel-key" className="text-xs">
                API Key
              </Label>
              <div className="relative">
                <Input
                  id="channel-key"
                  type={showKey ? "text" : "password"}
                  value={active.apiKey}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="sk-xxxxxxxx"
                  onChange={(event) => patch(active.id, { apiKey: event.target.value })}
                  className="h-8 pr-8 text-xs"
                />
                <button
                  type="button"
                  aria-label={showKey ? "隐藏密钥" : "显示密钥"}
                  title={showKey ? "隐藏" : "显示"}
                  onClick={() => setShowKey((value) => !value)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showKey ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={test.status === "testing" || !active.baseUrl.trim()}
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

              {test.status === "idle" && active.models.length > 0 ? (
                <span className="text-xs text-muted-foreground">
                  已缓存 {active.models.length} 个模型
                </span>
              ) : null}
            </div>

            {test.status === "error" && test.hints.length > 0 ? (
              <ul className={cn("space-y-0.5 text-[11px] text-muted-foreground")}>
                {test.hints.map((hint) => (
                  <li key={hint}>· {hint}</li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-[11px] text-muted-foreground">
            还没有渠道，点击右上角 + 新增一个。
          </p>
        )}
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
        <ChannelsForm onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
