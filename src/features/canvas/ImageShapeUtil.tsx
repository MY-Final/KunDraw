import {
  BaseBoxShapeUtil,
  T,
  createShapeId,
  type TLAsset,
  type TLImageAsset,
  type TLShapePartial,
  type VecModel,
} from "tldraw"

import { ImageNode } from "./ImageNode"
import { IMAGE_SHAPE_TYPE, type ImageShape } from "./shapeTypes"

export class ImageShapeUtil extends BaseBoxShapeUtil<ImageShape> {
  static override type = IMAGE_SHAPE_TYPE
  static override handledAssetTypes = ["image"] as const
  static override props = {
    w: T.number,
    h: T.number,
    assetId: T.string,
    imageUrl: T.string,
    name: T.string,
    mimeType: T.string,
    model: T.string,
    prompt: T.string,
    createdAt: T.number,
    sourcePromptId: T.string,
  }

  override getDefaultProps() {
    return {
      w: 360,
      h: 320,
      assetId: "",
      imageUrl: "",
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
        h: Math.round(imageAsset.props.h * scale) + 44,
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

  override getIndicatorPath(shape: ImageShape) {
    return new Path2D(`M0,0H${shape.props.w}V${shape.props.h}H0Z`)
  }
}
