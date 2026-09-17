import type { Editor, TLShapeId } from "tldraw"

export type NodeAction =
  | { type: "generate-prompt"; shapeId: TLShapeId }
  | { type: "create-reference-prompt"; shapeId: TLShapeId }
  | { type: "regenerate-image"; shapeId: TLShapeId }
  | { type: "download-image"; shapeId: TLShapeId }

type NodeActionHandler = (action: NodeAction) => void

const handlers = new WeakMap<Editor, NodeActionHandler>()

export function registerNodeActionHandler(editor: Editor, handler: NodeActionHandler) {
  handlers.set(editor, handler)
  return () => handlers.delete(editor)
}

export function dispatchNodeAction(editor: Editor, action: NodeAction) {
  handlers.get(editor)?.(action)
}
