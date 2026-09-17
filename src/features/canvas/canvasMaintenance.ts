import type { Editor, TLAssetId, TLShapePartial } from "tldraw"

import { IMAGE_SHAPE_TYPE, type ImageShape } from "./shapeTypes"

/** tldraw names its first page "Page 1"; kunDraw's copy is Chinese. */
const DEFAULT_PAGE_NAME = /^Page \d+$/

export function normalizeDefaultPageName(editor: Editor) {
  const pages = editor.getPages()
  if (pages.length !== 1 || !DEFAULT_PAGE_NAME.test(pages[0].name)) return

  editor.run(
    () => {
      editor.updatePage({ id: pages[0].id, name: "页面 1" })
    },
    { history: "ignore" }
  )
}

/**
 * Image nodes used to reserve 44px for its caption inside the shape. Captions now
 * float below the shape (so cropping covers the image only), so older nodes are
 * resized to the asset's aspect ratio once.
 */
export function normalizeImageShapes(editor: Editor) {
  const updates: TLShapePartial<ImageShape>[] = []

  for (const record of editor.store.allRecords()) {
    if (record.typeName !== "shape" || record.type !== IMAGE_SHAPE_TYPE) continue
    const shape = record as ImageShape
    if (shape.props.crop) continue

    const asset = shape.props.assetId
      ? editor.getAsset(shape.props.assetId as TLAssetId)
      : null
    if (!asset || asset.type !== "image") continue

    const aspect = asset.props.h / asset.props.w
    if (!Number.isFinite(aspect) || aspect <= 0) continue

    const height = Math.round(shape.props.w * aspect)
    if (Math.abs(height - shape.props.h) < 2) continue

    updates.push({ id: shape.id, type: IMAGE_SHAPE_TYPE, props: { h: height } })
  }

  if (updates.length === 0) return
  editor.run(() => editor.updateShapes(updates), { history: "ignore" })
}
