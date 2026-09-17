import { useMemo, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

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
  disabled,
}: {
  models: string[]
  value: string
  onChange: (model: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

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
            <CommandList>
              <CommandEmpty>
                {trimmed ? `使用 “${trimmed}”` : "没有模型，请先在设置中测试连接"}
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
