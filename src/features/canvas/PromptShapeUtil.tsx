import { BaseBoxShapeUtil, T } from "tldraw"

import { PromptNode } from "./PromptNode"
import { PROMPT_SHAPE_TYPE, type PromptShape, type PromptShapeProps } from "./shapeTypes"

const DEFAULT_PROPS: PromptShapeProps = {
  w: 340,
  h: 430,
  prompt: "",
  model: "images-2.5",
  mode: "text",
  aspectRatio: "1:1",
  resolution: 1024,
  count: 1,
  referenceImages: [],
  status: "idle",
  generatedImageIds: [],
}

export class PromptShapeUtil extends BaseBoxShapeUtil<PromptShape> {
  static override type = PROMPT_SHAPE_TYPE
  static override props = {
    w: T.number,
    h: T.number,
    prompt: T.string,
    model: T.string,
    mode: T.literalEnum("text", "image"),
    aspectRatio: T.literalEnum("auto", "1:1", "4:3", "3:2", "16:9", "21:9", "3:4", "2:3", "9:16"),
    resolution: T.literalEnum(512, 1024, 1536, 2048),
    count: T.number,
    referenceImages: T.arrayOf(T.string),
    status: T.literalEnum("idle", "generating", "error"),
    generatedImageIds: T.arrayOf(T.string),
  }

  override getDefaultProps() {
    return { ...DEFAULT_PROPS }
  }

  override component(shape: PromptShape) {
    return <PromptNode shape={shape} editor={this.editor} />
  }

  override getIndicatorPath(shape: PromptShape) {
    return new Path2D(`M0,0H${shape.props.w}V${shape.props.h}H0Z`)
  }
}
