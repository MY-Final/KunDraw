import { useMemo, useState } from "react"
import { Check, ChevronDown, LoaderCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "cn"

import { AiField, controlClass } from "./AiField"

/**
 * Combobox: pick a discovered model or type any name. NewAPI gateways often
 * accept model ids that `/models` does not list, so free text is allowed.
 */
export function ModelPicker({
  models,
  value,
  onChange,
  onRefresh,
  disabled,
}: {
  models: string[]
  value: string
  onChange: (model: string) => void
  onRefresh?: () => Promise<void>
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return models
    return models.filter((model) => model.toLowerCase().includes(term))
  }, [models, query])

  const trimmed = query.trim()
  const canUseTyped = trimmed.length > 0 && !models.includes(trimmed)

  const select = (model: string) => {
    onChange(model)
    setQuery("")
    setOpen(false)
  }

  const refresh = async () => {
    if (!onRefresh || refreshing) return
    setRefreshing(true)
    setNotice(null)
    try {
      await onRefresh()
    } catch {
      setNotice("渠道未开放模型列表，可继续手动输入")
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <AiField label="模型">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          aria-label="模型"
          className={cn(controlClass, "flex items-center justify-between gap-2 text-left")}
        >
          <span
            className={cn("truncate", !value && "text-muted-foreground")}
          >
            {value || "输入或选择模型"}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </PopoverTrigger>

        <PopoverContent align="start" sideOffset={4} className="w-[var(--anchor-width)] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              placeholder="搜索或输入模型名称"
              onValueChange={setQuery}
            />
            <div className="flex items-center justify-between gap-2 border-b border-border px-2 py-1.5">
              <span className="text-[10px] text-muted-foreground">
                {notice ??
                  (models.length > 0
                    ? `已获取 ${models.length} 个模型`
                    : "尚未获取模型列表")}
              </span>
              {onRefresh ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={refreshing}
                  onClick={() => void refresh()}
                  className="h-6 text-[10px] text-muted-foreground"
                >
                  {refreshing ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}
                  {refreshing ? "获取中" : "刷新列表"}
                </Button>
              ) : null}
            </div>
            <CommandList>
              <CommandEmpty>
                {trimmed
                  ? `使用 “${trimmed}”`
                  : "可直接输入模型名称，或点击刷新列表"}
              </CommandEmpty>
              <CommandGroup>
                {canUseTyped ? (
                  <CommandItem value={trimmed} onSelect={() => select(trimmed)}>
                    <span className="truncate">使用 “{trimmed}”</span>
                  </CommandItem>
                ) : null}
                {filtered.map((model) => (
                  <CommandItem
                    key={model}
                    value={model}
                    onSelect={() => select(model)}
                  >
                    <span className="truncate">{model}</span>
                    {model === value ? (
                      <Check className="ml-auto size-3.5" />
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </AiField>
  )
}
