import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { tools, type ToolId } from "./tools"

type ToolbarProps = {
  activeTool: ToolId
  onToolChange: (tool: ToolId) => void
}

function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  return (
    <TooltipProvider delay={400}>
      <aside
        aria-label="工具栏"
        className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-background py-2"
      >
        {tools.map((tool, index) => {
          const previous = tools[index - 1]
          const isActive = tool.id === activeTool
          const Icon = tool.icon

          return (
            <div
              key={tool.id}
              className="flex w-full flex-col items-center gap-1"
            >
              {previous && previous.group !== tool.group ? (
                <Separator className="my-1 w-6" />
              ) : null}

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={tool.label}
                      aria-pressed={isActive}
                      onClick={() => onToolChange(tool.id)}
                      className={cn(
                        "size-9 rounded-md text-muted-foreground hover:text-foreground",
                        isActive &&
                          "bg-foreground text-background hover:bg-foreground hover:text-background"
                      )}
                    />
                  }
                >
                  <Icon className="size-[18px]" />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {tool.label}
                  <kbd data-slot="kbd">{tool.shortcut}</kbd>
                </TooltipContent>
              </Tooltip>
            </div>
          )
        })}
      </aside>
    </TooltipProvider>
  )
}

export { Toolbar }
