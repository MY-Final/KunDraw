import { exportAs, type Editor } from "tldraw"

import { sanitizeNamePart, timestampFor } from "@/lib/fileName"

/** Downloads the current page as a PNG. Returns false when there is nothing to export. */
export async function exportCanvasAsPng(editor: Editor, projectName: string) {
  const shapeIds = [...editor.getCurrentPageShapeIds()]
  if (shapeIds.length === 0) return false

  const name = [sanitizeNamePart(projectName), timestampFor(Date.now())]
    .filter(Boolean)
    .join("-")

  await exportAs(editor, shapeIds, {
    format: "png",
    name,
    background: true,
    padding: 24,
    scale: 2,
  })

  return true
}
