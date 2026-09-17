import { useValue, type Editor, type TLShapeId } from "tldraw"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { referenceFromImageShape } from "./references"
import { IMAGE_SHAPE_TYPE, type ImageShape } from "./shapeTypes"

export function ImagePreviewDialog({
  editor,
  shapeId,
  onClose,
}: {
  editor: Editor
  shapeId: TLShapeId | null
  onClose: () => void
}) {
  const preview = useValue(
    "kundraw image preview",
    () => {
      if (!shapeId) return null
      const shape = editor.getShape<ImageShape>(shapeId)
      if (!shape || shape.type !== IMAGE_SHAPE_TYPE) return null
      const reference = referenceFromImageShape(editor, shape)
      return reference ? { shape, src: reference.dataUrl } : null
    },
    [editor, shapeId]
  )

  return (
    <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-[min(90vh,900px)] max-w-[calc(100vw-2rem)] grid-rows-[auto_minmax(0,1fr)] p-3 sm:max-w-5xl">
        <DialogHeader className="min-w-0 gap-1 pr-10">
          <DialogTitle className="truncate">图片预览</DialogTitle>
          <DialogDescription className="truncate">
            {preview?.shape.props.prompt || preview?.shape.props.name || "按 Esc 或点击外部关闭预览"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 items-center justify-center overflow-hidden rounded-lg bg-muted/50">
          {preview ? (
            <img
              src={preview.src}
              alt={preview.shape.props.prompt || preview.shape.props.name}
              className="max-h-full max-w-full object-contain"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
