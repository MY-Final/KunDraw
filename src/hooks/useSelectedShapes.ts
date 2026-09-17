import { useValue, type TLShape } from "tldraw"

import { useWorkspaceEditor } from "./useEditor"

const EMPTY: TLShape[] = []

export function useSelectedShapes(): TLShape[] {
  const editor = useWorkspaceEditor()

  return useValue(
    "kundraw selected shapes",
    () => (editor ? editor.getSelectedShapes() : EMPTY),
    [editor]
  )
}
