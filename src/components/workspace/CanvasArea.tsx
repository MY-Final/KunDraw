import { useCallback } from "react"
import { Tldraw, type Editor, type TLShape, type TldrawOptions } from "tldraw"

import { useEditorContext } from "@/hooks/useEditor"

// Defined at module scope so the editor never sees a new function identity.
function getShapeVisibility(shape: TLShape) {
  return shape.meta.hidden === true ? "hidden" : "inherit"
}

// Locked shapes stay selectable so they can be unlocked from the properties panel.
// tldraw's lock guards still block moving, resizing and deleting them.
const canvasOptions: Partial<TldrawOptions> = {
  selectLockedShapes: true,
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
          onMount={handleMount}
          getShapeVisibility={getShapeVisibility}
          options={canvasOptions}
        />
      </div>
    </main>
  )
}

export { CanvasArea }
