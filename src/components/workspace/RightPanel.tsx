import { LayoutGrid, Sparkles, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AiPanel } from "@/features/ai/components/AiPanel"

import { PropertiesPanel } from "./PropertiesPanel"

export type RightPanelTab = "ai" | "properties"

function TabPanel({
  active,
  children,
}: {
  active: boolean
  children: React.ReactNode
}) {
  if (!active) return null
  return <div className="flex min-h-full flex-col">{children}</div>
}

export function RightPanel({
  open,
  tab,
  onTabChange,
  onClose,
  onOpenSettings,
}: {
  open: boolean
  tab: RightPanelTab
  onTabChange: (tab: RightPanelTab) => void
  onClose: () => void
  onOpenSettings: () => void
}) {
  if (!open) return null

  return (
    <aside
      aria-label="右侧面板"
      className="hidden w-[300px] shrink-0 flex-col border-l border-border bg-background lg:flex"
    >
      <Tabs
        value={tab}
        onValueChange={(value) => onTabChange(value as RightPanelTab)}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border px-2">
          <TabsList variant="line" className="flex-1 justify-start">
            <TabsTrigger value="ai" className="gap-1.5 px-2 text-xs">
              <Sparkles className="size-3.5" />
              AI 创作
            </TabsTrigger>
            <TabsTrigger value="properties" className="gap-1.5 px-2 text-xs">
              <LayoutGrid className="size-3.5" />
              属性
            </TabsTrigger>
          </TabsList>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="收起面板"
            title="收起面板"
            onClick={onClose}
            className="shrink-0 text-muted-foreground"
          >
            <X />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <TabPanel active={tab === "ai"}>
            <AiPanel onOpenSettings={onOpenSettings} />
          </TabPanel>
          <TabPanel active={tab === "properties"}>
            <PropertiesPanel />
          </TabPanel>
        </div>
      </Tabs>
    </aside>
  )
}
