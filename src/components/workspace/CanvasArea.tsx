import { useCallback } from "react"
import { Tldraw, type Editor } from "tldraw"

import { useEditorContext } from "@/hooks/useEditor"

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
        <Tldraw hideUi onMount={handleMount} />
      </div>
    </main>
  )
}

export { CanvasArea }
