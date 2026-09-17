import { createShapeId, type Editor, type TLArrowShape, type TLShapeId } from "tldraw"

import {
  IMAGE_SHAPE_TYPE,
  PROMPT_SHAPE_TYPE,
  type ImageShape,
  type PromptShape,
  type RelationMeta,
  type RelationType,
} from "./shapeTypes"

export function createRelation(
  editor: Editor,
  sourceShapeId: TLShapeId,
  targetShapeId: TLShapeId,
  relationType: RelationType
) {
  const source = editor.getShapePageBounds(sourceShapeId)
  const target = editor.getShapePageBounds(targetShapeId)
  if (!source || !target) return null

  const id = createShapeId()
  const meta: RelationMeta = { sourceShapeId, targetShapeId, relationType }

  editor.createShape<TLArrowShape>({
    id,
    type: "arrow",
    x: source.center.x,
    y: source.center.y,
    opacity: 0.55,
    isLocked: true,
    meta: { kundrawRelation: meta },
    props: {
      start: { x: 0, y: 0 },
      end: { x: target.center.x - source.center.x, y: target.center.y - source.center.y },
      color: relationType === "reference" ? "light-violet" : "light-blue",
      dash: "solid",
      size: "s",
      arrowheadEnd: "arrow",
    },
  })
  editor.createBindings([
    {
      fromId: id,
      toId: sourceShapeId,
      type: "arrow",
      props: {
        terminal: "start",
        normalizedAnchor: { x: 0.5, y: 0.5 },
        isExact: false,
        isPrecise: false,
        snap: "none",
      },
    },
    {
      fromId: id,
      toId: targetShapeId,
      type: "arrow",
      props: {
        terminal: "end",
        normalizedAnchor: { x: 0.5, y: 0.5 },
        isExact: false,
        isPrecise: false,
        snap: "none",
      },
    },
  ])
  editor.sendToBack([id])
  return id
}

export function cleanupRelationsForDeletedShape(editor: Editor, deletedId: TLShapeId) {
  const relationArrows = editor.getCurrentPageShapes().flatMap((shape) => {
    if (shape.type !== "arrow") return []
    const relation = shape.meta.kundrawRelation
    if (!relation || typeof relation !== "object") return []
    const metadata = relation as Record<string, unknown>
    return metadata.sourceShapeId === deletedId || metadata.targetShapeId === deletedId
      ? [shape.id]
      : []
  })
  if (relationArrows.length > 0) editor.deleteShapes(relationArrows)

  for (const shape of editor.getCurrentPageShapes()) {
    if (shape.type === PROMPT_SHAPE_TYPE) {
      const prompt = shape as PromptShape
      if (
        prompt.props.referenceImages.includes(deletedId) ||
        prompt.props.generatedImageIds.includes(deletedId)
      ) {
        editor.updateShape<PromptShape>({
          id: prompt.id,
          type: PROMPT_SHAPE_TYPE,
          props: {
            referenceImages: prompt.props.referenceImages.filter((id) => id !== deletedId),
            generatedImageIds: prompt.props.generatedImageIds.filter((id) => id !== deletedId),
          },
        })
      }
    } else if (shape.type === IMAGE_SHAPE_TYPE) {
      const image = shape as ImageShape
      if (image.props.sourcePromptId === deletedId) {
        editor.updateShape<ImageShape>({
          id: image.id,
          type: IMAGE_SHAPE_TYPE,
          props: { sourcePromptId: "" },
        })
      }
    }
  }
}
