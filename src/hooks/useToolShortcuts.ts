import { useEffect } from "react"
import type { Editor } from "tldraw"

// tldraw owns every canvas shortcut except P for the draw tool, so only that key
// is registered here. Adding more would duplicate bindings tldraw already handles.
const DRAW_KEYS = new Set(["p"])

function isFormField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
}

export function useToolShortcuts(editor: Editor | null) {
  useEffect(() => {
    if (!editor) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.shiftKey || isFormField(event.target)) return
      if (!DRAW_KEYS.has(event.key.toLowerCase())) return

      event.preventDefault()
      editor.setCurrentTool("draw")
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [editor])
}
