import type { Editor, TLShapeId } from "tldraw"

export type NodeAction =
  | { type: "generate-prompt"; shapeId: TLShapeId }
  | { type: "continue-from-image"; shapeId: TLShapeId }
  | { type: "preview-image"; shapeId: TLShapeId }
  | { type: "regenerate-image"; shapeId: TLShapeId }
  | { type: "inpaint-image"; shapeId: TLShapeId }
  | { type: "crop-image"; shapeId: TLShapeId }
  | { type: "download-image"; shapeId: TLShapeId }
  | { type: "delete-node"; shapeId: TLShapeId }

type NodeActionHandler = (action: NodeAction) => void

const handlers = new WeakMap<Editor, NodeActionHandler>()

export function registerNodeActionHandler(editor: Editor, handler: NodeActionHandler) {
  handlers.set(editor, handler)
  return () => handlers.delete(editor)
}

export function dispatchNodeAction(editor: Editor, action: NodeAction) {
  handlers.get(editor)?.(action)
}
