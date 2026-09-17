import { useRef } from "react"
import {
  ArrowRight,
  Circle,
  Eraser,
  Hand,
  ImagePlus,
  Minus,
  MoreHorizontal,
  MousePointer2,
  Pencil,
  Sparkles,
  Square,
  Type,
  WandSparkles,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"
import { GeoShapeGeoStyle, useValue } from "tldraw"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAi } from "@/features/ai/useAi"
import { createPromptNode } from "@/features/canvas/nodeCommands"
import { useWorkspaceEditor } from "@/hooks/useEditor"

import { getActiveToolId } from "./tools"

type ToolButtonProps = {
  label: string
  shortcut?: string
  icon: LucideIcon
  active?: boolean
  disabled?: boolean
  accent?: boolean
  onClick: () => void
}

function ToolButton({ label, shortcut, icon: Icon, active, disabled, accent, onClick }: ToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            title={label}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={cn(
              "size-9 rounded-lg text-muted-foreground hover:text-foreground",
              active && "bg-foreground text-background hover:bg-foreground hover:text-background",
              accent && "bg-brand-subtle text-brand hover:bg-brand-subtle hover:text-brand"
            )}
          />
        }
      >
        <Icon className="size-[18px]" />
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
        {shortcut ? <kbd data-slot="kbd">{shortcut}</kbd> : null}
      </TooltipContent>
    </Tooltip>
  )
}

function Toolbar({ onOpenAi }: { onOpenAi: () => void }) {
  const editor = useWorkspaceEditor()
  const ai = useAi()
  const imageInputRef = useRef<HTMLInputElement>(null)

  const activeTool = useValue(
    "kundraw active tool",
    () => (editor ? getActiveToolId(editor) : null),
    [editor]
  )

  const activateGeo = (geo: "rectangle" | "ellipse") => {
    if (!editor) return
    editor.setStyleForNextShapes(GeoShapeGeoStyle, geo)
    editor.setCurrentTool("geo")
  }

  return (
    <TooltipProvider delay={400}>
      <aside
        aria-label="工具栏"
        className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-background py-2"
      >
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])
            if (editor && files.length > 0) {
              void editor.putExternalContent({ type: "files", files })
            }
            event.target.value = ""
          }}
        />

        <ToolButton
          label="选择"
          shortcut="V"
          icon={MousePointer2}
          active={activeTool === "select"}
          disabled={!editor}
          onClick={() => editor?.setCurrentTool("select")}
        />
        <ToolButton
          label="移动"
          shortcut="H"
          icon={Hand}
          active={activeTool === "hand"}
          disabled={!editor}
          onClick={() => editor?.setCurrentTool("hand")}
        />

        <Separator className="my-1 w-6" />

        <ToolButton
          label="创建 Prompt"
          shortcut="P"
          icon={Sparkles}
          disabled={!editor}
          accent
          onClick={() =>
            editor && createPromptNode(editor, { props: { model: ai.settings.model } })
          }
        />
        <ToolButton
          label="添加图片"
          icon={ImagePlus}
          disabled={!editor}
          onClick={() => imageInputRef.current?.click()}
        />
        <ToolButton
          label="文字"
          shortcut="T"
          icon={Type}
          active={activeTool === "text"}
          disabled={!editor}
          onClick={() => editor?.setCurrentTool("text")}
        />

        <Separator className="my-1 w-6" />

        <ToolButton label="AI 创作" icon={WandSparkles} accent onClick={onOpenAi} />

        <Separator className="my-1 w-6" />

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger
              render={
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="更多工具"
                      title="更多工具"
                      className="size-9 rounded-lg text-muted-foreground"
                    />
                  }
                >
                  <MoreHorizontal className="size-[18px]" />
                </DropdownMenuTrigger>
              }
            />
            <TooltipContent side="right">更多工具</TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="right" align="start" className="w-40">
            <DropdownMenuItem onClick={() => editor?.setCurrentTool("draw")}>
              <Pencil />画笔
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.setCurrentTool("eraser")}>
              <Eraser />橡皮
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => activateGeo("rectangle")}>
              <Square />矩形
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => activateGeo("ellipse")}>
              <Circle />椭圆
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.setCurrentTool("line")}>
              <Minus />直线
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor?.setCurrentTool("arrow")}>
              <ArrowRight />箭头
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </aside>
    </TooltipProvider>
  )
}

export { Toolbar }
