import { useCallback } from "react"
import { Sparkles } from "lucide-react"
import { Tldraw, useValue, type Editor, type TLShape, type TldrawOptions } from "tldraw"

import { Button } from "@/components/ui/button"
import { useAi } from "@/features/ai/useAi"
import { ImageShapeUtil } from "@/features/canvas/ImageShapeUtil"
import { createPromptNode } from "@/features/canvas/nodeCommands"
import { PromptShapeUtil } from "@/features/canvas/PromptShapeUtil"
import { useEditorContext, useWorkspaceEditor } from "@/hooks/useEditor"

// Defined at module scope so the editor never sees a new function identity.
function getShapeVisibility(shape: TLShape) {
  return shape.meta.hidden === true ? "hidden" : "inherit"
}

// Locked shapes stay selectable so they can be unlocked from the properties panel.
// tldraw's lock guards still block moving, resizing and deleting them.
const canvasOptions: Partial<TldrawOptions> = {
  selectLockedShapes: true,
}

const shapeUtils = [PromptShapeUtil, ImageShapeUtil]

function CanvasEmptyState() {
  const editor = useWorkspaceEditor()
  const ai = useAi()
  const isEmpty = useValue(
    "kundraw empty canvas",
    () => (editor ? editor.getCurrentPageShapes().length === 0 : false),
    [editor]
  )

  if (!editor || !isEmpty) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
      <div className="pointer-events-auto flex -translate-y-8 flex-col items-center gap-3 rounded-xl border border-border bg-background/90 px-7 py-6 text-center shadow-sm backdrop-blur">
        <span className="grid size-9 place-items-center rounded-lg bg-brand-subtle text-brand">
          <Sparkles className="size-4" />
        </span>
        <div>
          <h1 className="text-sm font-semibold">开始创作</h1>
          <p className="mt-1 text-xs text-muted-foreground">拖入图片，或创建 Prompt 开始</p>
        </div>
        <Button
          size="sm"
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          onClick={() =>
            createPromptNode(editor, { props: { model: ai.settings.model } })
          }
        >
          <Sparkles />
          创建 Prompt
        </Button>
      </div>
    </div>
  )
}

function CanvasArea() {
  const { setEditor } = useEditorContext()

  const handleMount = useCallback(
    (editor: Editor) => {
      setEditor(editor)

      return () => setEditor(null)
    },
    [setEditor]
  )

  return (
    <main className="relative min-w-0 flex-1 overflow-hidden bg-neutral-100">
      <div className="absolute inset-0">
        <Tldraw
          hideUi
          shapeUtils={shapeUtils}
          onMount={handleMount}
          getShapeVisibility={getShapeVisibility}
          options={canvasOptions}
        />
      </div>
      <CanvasEmptyState />
    </main>
  )
}

export { CanvasArea }
