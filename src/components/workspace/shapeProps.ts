import {
  DefaultColorStyle,
  DefaultFillStyle,
  DefaultFontStyle,
  DefaultSizeStyle,
  DefaultTextAlignStyle,
  renderPlaintextFromRichText,
  renderRichTextFromHTML,
  type Editor,
  type ReadonlySharedStyleMap,
  type StyleProp,
  type TLLineShapePoint,
  type TLShape,
  type TLShapePartial,
  type VecModel,
} from "tldraw"

export type SharedValue<T> = { mixed: true } | { mixed: false; value: T }

export function readShared<T>(
  map: ReadonlySharedStyleMap,
  prop: StyleProp<T>
): SharedValue<T> | undefined {
  const entry = map.get(prop)
  if (!entry) return undefined
  return entry.type === "mixed"
    ? { mixed: true }
    : { mixed: false, value: entry.value }
}

export function stylesFor(editor: Editor) {
  const map = editor.getSharedStyles()
  return {
    color: readShared(map, DefaultColorStyle),
    fill: readShared(map, DefaultFillStyle),
    size: readShared(map, DefaultSizeStyle),
    font: readShared(map, DefaultFontStyle),
    textAlign: readShared(map, DefaultTextAlignStyle),
  }
}

export type Styles = ReturnType<typeof stylesFor>

export function readOpacity(editor: Editor): SharedValue<number> | undefined {
  const shared = editor.getSharedOpacity()
  return shared.type === "mixed"
    ? { mixed: true }
    : { mixed: false, value: shared.value }
}

export function opacityPercent(value: SharedValue<number> | undefined) {
  return value && !value.mixed ? Math.round(value.value * 100) : null
}

function readProps(shape: TLShape) {
  return shape.props as unknown as Record<string, unknown>
}

export function readBoxSize(shape: TLShape) {
  const props = readProps(shape)
  const w = props.w
  const h = props.h
  if (typeof w !== "number" || typeof h !== "number") return null
  return { w, h }
}

export function readShapeSize(editor: Editor, shape: TLShape) {
  const boxSize = readBoxSize(shape)
  if (boxSize) return boxSize

  const bounds = editor.getShapePageBounds(shape.id)
  return bounds ? { w: bounds.w, h: bounds.h } : null
}

export function readText(editor: Editor, shape: TLShape) {
  const richText = readProps(shape).richText
  if (richText === undefined) return null
  return renderPlaintextFromRichText(editor, richText as never)
}

export function readEndpoints(shape: TLShape) {
  const props = readProps(shape)

  if (shape.type === "arrow") {
    const start = props.start as VecModel | undefined
    const end = props.end as VecModel | undefined
    if (start && end) return { start, end }
    return null
  }

  if (shape.type === "line") {
    const points = Object.values(
      props.points as Record<string, TLLineShapePoint>
    )
    if (points.length < 2) return null
    return { start: points[0], end: points[points.length - 1] }
  }

  return null
}

export function mark(editor: Editor, name: string) {
  editor.markHistoryStoppingPoint(`kundraw:${name}`)
}

// Panel controls live outside the tldraw container, so interacting with them blurs
// the canvas and disables tldraw's key bindings. Panel-driven commands hand focus
// back so shortcuts like Ctrl+Z and Delete keep working right after an edit.
export function focusCanvas(editor: Editor) {
  editor.focus()
}

export function updatePosition(
  editor: Editor,
  shape: TLShape,
  axis: "x" | "y",
  value: number
) {
  mark(editor, axis)
  editor.updateShape({ id: shape.id, type: shape.type, [axis]: value })
}

export function updateRotation(editor: Editor, shape: TLShape, degrees: number) {
  mark(editor, "rotation")
  editor.updateShape({
    id: shape.id,
    type: shape.type,
    rotation: (degrees * Math.PI) / 180,
  })
}

export function updateOpacity(editor: Editor, value: number) {
  mark(editor, "opacity")
  editor.setOpacityForSelectedShapes(value)
  editor.setOpacityForNextShapes(value)
  focusCanvas(editor)
}

export function updateBoxSize(
  editor: Editor,
  shape: TLShape,
  size: { w?: number; h?: number }
) {
  const current = readShapeSize(editor, shape)
  if (!current || current.w <= 0 || current.h <= 0) return

  const scaleX = size.w === undefined ? 1 : size.w / current.w
  const scaleY = size.h === undefined ? 1 : size.h / current.h
  if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY)) return

  // Anchor the edited edge instead of the shape center so X and Y stay put.
  const localOrigin = {
    x: size.w === undefined ? current.w / 2 : 0,
    y: size.h === undefined ? current.h / 2 : 0,
  }
  const scaleOrigin = editor
    .getShapePageTransform(shape)
    .applyToPoint(localOrigin)

  mark(editor, "size")
  editor.resizeShape(shape.id, { x: scaleX, y: scaleY }, { scaleOrigin })
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export function updateText(editor: Editor, shape: TLShape, text: string) {
  mark(editor, "text")
  editor.updateShape({
    id: shape.id,
    type: shape.type,
    props: {
      richText: renderRichTextFromHTML(editor, `<p>${escapeHtml(text)}</p>`),
    },
  } as TLShapePartial<TLShape>)
}

export function updateEndpoint(
  editor: Editor,
  shape: TLShape,
  which: "start" | "end",
  value: { x?: number; y?: number }
) {
  const current = readEndpoints(shape)
  if (!current) return

  const next = { ...current[which], ...value }
  mark(editor, "endpoint")

  if (shape.type === "arrow") {
    editor.updateShape({
      id: shape.id,
      type: "arrow",
      props: which === "start" ? { start: next } : { end: next },
    })
    return
  }

  if (shape.type === "line") {
    const points = readProps(shape).points as Record<string, TLLineShapePoint>
    const list = Object.values(points)
    const target = which === "start" ? list[0] : list[list.length - 1]
    editor.updateShape({
      id: shape.id,
      type: "line",
      props: { points: { ...points, [target.id]: { ...target, ...value } } },
    })
  }
}

export function setSharedStyle<T>(
  editor: Editor,
  prop: StyleProp<T>,
  value: T,
  marker = prop.id
) {
  mark(editor, marker)
  editor.setStyleForSelectedShapes(prop, value)
  editor.setStyleForNextShapes(prop, value)
  focusCanvas(editor)
}

export function toggleLocked(editor: Editor, shapes: TLShape[]) {
  mark(editor, "lock")
  editor.toggleLock(shapes.map((shape) => shape.id))
  focusCanvas(editor)
}

export function toggleHidden(editor: Editor, shapes: TLShape[]) {
  mark(editor, "hide")
  for (const shape of shapes) {
    const hidden = editor.isShapeHidden(shape.id)
    editor.updateShape({
      id: shape.id,
      type: shape.type,
      meta: { ...shape.meta, hidden: !hidden },
    })
  }
  focusCanvas(editor)
}

export function unhideAllShapes(editor: Editor) {
  const hidden = editor
    .getCurrentPageShapes()
    .filter((shape) => editor.isShapeHidden(shape.id))
  if (hidden.length === 0) return

  mark(editor, "unhide")
  for (const shape of hidden) {
    editor.updateShape({
      id: shape.id,
      type: shape.type,
      meta: { ...shape.meta, hidden: false },
    })
  }
  focusCanvas(editor)
}

export function deleteShapes(editor: Editor, shapes: TLShape[]) {
  mark(editor, "delete")
  editor.deleteShapes(shapes.map((shape) => shape.id))
  focusCanvas(editor)
}
