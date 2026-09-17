import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { TLEventInfo, TLShapeId } from "tldraw"

import { downloadImage } from "@/features/ai/canvas"
import { useAi } from "@/features/ai/useAi"
import { useWorkspaceEditor } from "@/hooks/useEditor"

import {
  createPromptNode,
  createReferencePrompt,
  generatePromptNode,
} from "./nodeCommands"
import { ImagePreviewDialog } from "./ImagePreviewDialog"
import { referenceFromImageShape } from "./references"
import { cleanupRelationsForDeletedShape } from "./relations"
import { registerNodeActionHandler, type NodeAction } from "./nodeEvents"
import {
  IMAGE_SHAPE_TYPE,
  type ImageShape,
} from "./shapeTypes"

function isFormField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

export function NodeCanvasController() {
  const editor = useWorkspaceEditor()
  const ai = useAi()
  const [previewShapeId, setPreviewShapeId] = useState<TLShapeId | null>(null)

  useEffect(() => {
    if (!editor) return

    const handleAction = (action: NodeAction) => {
      if (action.type === "generate-prompt") {
        void generatePromptNode(editor, ai, action.shapeId).then((images) => {
          if (images.length > 0) toast.success(`已生成 ${images.length} 张图片并添加到画布`)
        })
        return
      }
      if (action.type === "continue-from-image") {
        createReferencePrompt(editor, action.shapeId)
        return
      }
      if (action.type === "preview-image") {
        setPreviewShapeId(action.shapeId)
        return
      }
      if (action.type === "regenerate-image") {
        const image = editor.getShape<ImageShape>(action.shapeId)
        if (image?.type === IMAGE_SHAPE_TYPE && image.props.sourcePromptId) {
          void generatePromptNode(editor, ai, image.props.sourcePromptId as TLShapeId)
        }
        return
      }

      const image = editor.getShape<ImageShape>(action.shapeId)
      if (!image || image.type !== IMAGE_SHAPE_TYPE) return
      const source = referenceFromImageShape(editor, image)
      if (!source) return
      void downloadImage({
        id: image.id,
        url: source.dataUrl,
        createdAt: image.props.createdAt,
        source: {
          prompt: image.props.prompt,
          model: image.props.model,
          channelName: "",
          mode: "text",
          count: 1,
        },
      })
    }

    const unregisterActions = registerNodeActionHandler(editor, handleAction)
    const handleEditorEvent = (event: TLEventInfo) => {
      if (
        event.type === "click" &&
        event.name === "double_click" &&
        event.phase === "up" &&
        event.target === "canvas"
      ) {
        const point = editor.screenToPage(event.point)
        createPromptNode(editor, { point: { x: point.x - 170, y: point.y - 40 } })
      }
    }
    editor.on("event", handleEditorEvent)
    const unregisterDeleteHandler = editor.sideEffects.registerAfterDeleteHandler(
      "shape",
      (shape) => cleanupRelationsForDeletedShape(editor, shape.id)
    )

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.key.toLowerCase() !== "p" ||
        isFormField(event.target)
      ) {
        return
      }
      event.preventDefault()
      createPromptNode(editor)
    }
    window.addEventListener("keydown", onKeyDown)

    return () => {
      unregisterActions()
      editor.off("event", handleEditorEvent)
      unregisterDeleteHandler()
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [ai, editor])

  return editor ? (
    <ImagePreviewDialog
      editor={editor}
      shapeId={previewShapeId}
      onClose={() => setPreviewShapeId(null)}
    />
  ) : null
}
