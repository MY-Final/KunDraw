import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { TLShapeId } from "tldraw"

import { downloadImage, imageFileName } from "@/features/ai/canvas"
import { useAi } from "@/features/ai/useAi"
import { useProject } from "@/features/persistence/useProject"
import { useWorkspaceEditor } from "@/hooks/useEditor"

import {
  addDerivedImages,
  createPromptNode,
  createReferencePrompt,
  generatePromptNode,
} from "./nodeCommands"
import { ImagePreviewDialog } from "./ImagePreviewDialog"
import { InpaintDialog, type InpaintTarget } from "./InpaintDialog"
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
  const { project } = useProject()
  const [previewShapeId, setPreviewShapeId] = useState<TLShapeId | null>(null)
  const [inpaintTarget, setInpaintTarget] = useState<InpaintTarget | null>(null)

  useEffect(() => {
    if (!editor) return

    const handleAction = (action: NodeAction) => {
      if (action.type === "generate-prompt") {
        void generatePromptNode(editor, ai, action.shapeId).then((images) => {
          if (images.length > 0) toast.success(`已生成 ${images.length} 张图片并添加到画布`)
        })
        return
      }
      if (action.type === "cancel-generation") {
        ai.cancelGeneration()
        toast.info("正在取消生成…")
        return
      }
      if (action.type === "continue-from-image") {
        createReferencePrompt(editor, action.shapeId, ai.settings.model)
        return
      }
      if (action.type === "preview-image") {
        setPreviewShapeId(action.shapeId)
        return
      }
      if (action.type === "inpaint-image") {
        const image = editor.getShape<ImageShape>(action.shapeId)
        if (!image || image.type !== IMAGE_SHAPE_TYPE) return
        const source = referenceFromImageShape(editor, image)
        if (!source) {
          toast.error("无法读取这张图片", { description: "图片可能已失效，请重新生成" })
          return
        }
        setInpaintTarget({
          shapeId: image.id,
          src: source.dataUrl,
          name: source.name,
          mimeType: source.mimeType,
          prompt: image.props.prompt,
          model: image.props.model,
        })
        return
      }
      if (action.type === "crop-image") {
        const image = editor.getShape<ImageShape>(action.shapeId)
        if (!image || image.type !== IMAGE_SHAPE_TYPE) return
        editor.markHistoryStoppingPoint("kundraw:crop-image")
        editor.setCroppingShape(
          editor.getCroppingShapeId() === image.id ? null : image.id
        )
        editor.focus()
        return
      }
      if (action.type === "delete-node") {
        editor.deleteShapes([action.shapeId])
        editor.focus()
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
      }, imageFileName({
        projectName: project.name,
        prompt: image.props.prompt,
        model: image.props.model,
        createdAt: image.props.createdAt,
        mimeType: image.props.mimeType,
      }))
    }

    const unregisterActions = registerNodeActionHandler(editor, handleAction)
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
      createPromptNode(editor, { props: { model: ai.settings.model } })
    }
    window.addEventListener("keydown", onKeyDown)

    return () => {
      unregisterActions()
      unregisterDeleteHandler()
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [ai, editor, project.name])

  return editor ? (
    <>
      <ImagePreviewDialog
        editor={editor}
        shapeId={previewShapeId}
        onClose={() => setPreviewShapeId(null)}
      />
      <InpaintDialog
        target={inpaintTarget}
        onClose={() => setInpaintTarget(null)}
        onApply={(target, images) => {
          setInpaintTarget(null)
          const source = editor.getShape<ImageShape>(target.shapeId)
          if (!source || source.type !== IMAGE_SHAPE_TYPE) {
            toast.error("原图片已被删除")
            return
          }

          void addDerivedImages(editor, source, images).then((ids) => {
            if (ids.length > 0) toast.success(`已重绘 ${ids.length} 张并添加到画布`)
          })
        }}
      />
    </>
  ) : null
}
