import {
  BaseBoxShapeUtil,
  T,
  createShapeId,
  createShapePropsMigrationIds,
  createShapePropsMigrationSequence,
  getUncroppedSize,
  type TLAsset,
  type TLImageAsset,
  type TLShapePartial,
  type VecModel,
} from "tldraw"

import { ImageNode } from "./ImageNode"
import { dispatchNodeAction } from "./nodeEvents"
import { IMAGE_SHAPE_TYPE, type ImageShape } from "./shapeTypes"

const imageShapeVersions = createShapePropsMigrationIds(IMAGE_SHAPE_TYPE, { AddCrop: 1 })

const cropValidator = T.nullable(
  T.object({
    topLeft: T.object({ x: T.number, y: T.number }),
    bottomRight: T.object({ x: T.number, y: T.number }),
  })
)

export class ImageShapeUtil extends BaseBoxShapeUtil<ImageShape> {
  static override type = IMAGE_SHAPE_TYPE
  static override handledAssetTypes = ["image"] as const
  static override props = {
    w: T.number,
    h: T.number,
    assetId: T.string,
    imageUrl: T.string,
    crop: cropValidator,
    name: T.string,
    mimeType: T.string,
    model: T.string,
    prompt: T.string,
    createdAt: T.number,
    sourcePromptId: T.string,
  }

  static override migrations = createShapePropsMigrationSequence({
    sequence: [
      {
        id: imageShapeVersions.AddCrop,
        up: (props) => {
          props.crop = null
        },
        down: (props) => {
          delete props.crop
        },
      },
    ],
  })

  override getDefaultProps() {
    return {
      w: 360,
      h: 320,
      assetId: "",
      imageUrl: "",
      crop: null,
      name: "kunDraw image",
      mimeType: "image/png",
      model: "",
      prompt: "",
      createdAt: Date.now(),
      sourcePromptId: "",
    }
  }

  override isAspectRatioLocked() {
    return true
  }

  override canCrop() {
    return true
  }

  override createShapeForAsset(asset: TLAsset, position: VecModel): TLShapePartial<ImageShape> | null {
    if (asset.type !== "image") return null
    const imageAsset = asset as TLImageAsset
    const scale = Math.min(1, 480 / Math.max(imageAsset.props.w, imageAsset.props.h))

    return {
      id: createShapeId(),
      type: IMAGE_SHAPE_TYPE,
      x: position.x,
      y: position.y,
      props: {
        w: Math.round(imageAsset.props.w * scale),
        h: Math.round(imageAsset.props.h * scale),
        assetId: imageAsset.id,
        imageUrl: imageAsset.props.src ?? "",
        name: imageAsset.props.name,
        mimeType: imageAsset.props.mimeType ?? "image/png",
        model: "",
        prompt: "",
        createdAt: Date.now(),
        sourcePromptId: "",
      },
    }
  }

  override component(shape: ImageShape) {
    return <ImageNode shape={shape} editor={this.editor} />
  }

  override onDoubleClick(shape: ImageShape) {
    if (this.editor.getCroppingShapeId() === shape.id) {
      const crop = shape.props.crop
      const { w, h } = getUncroppedSize(shape.props, crop)
      const offset = {
        x: (crop?.topLeft.x ?? 0) * w,
        y: (crop?.topLeft.y ?? 0) * h,
      }

      this.editor.updateShapes([
        {
          id: shape.id,
          type: shape.type,
          x: shape.x + offset.x,
          y: shape.y + offset.y,
          props: { crop: null, w, h },
        },
      ])
      this.editor.setCroppingShape(null)
      return
    }
    dispatchNodeAction(this.editor, { type: "preview-image", shapeId: shape.id })
  }

  override getIndicatorPath(shape: ImageShape) {
    if (this.editor.getCroppingShapeId() === shape.id) return undefined
    return new Path2D(`M0,0H${shape.props.w}V${shape.props.h}H0Z`)
  }
}
