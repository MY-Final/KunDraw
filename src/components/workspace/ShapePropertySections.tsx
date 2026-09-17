import {
  DefaultColorStyle,
  DefaultFillStyle,
  DefaultSizeStyle,
  type Editor,
  type TLShape,
} from "tldraw"

import { IMAGE_SHAPE_TYPE, type ImageShape } from "@/features/canvas/shapeTypes"

import { ColorSwatches } from "./ColorInput"
import { OptionSelect } from "./OptionInput"
import { PropertyRow, PropertySection, PropertyStack, PropertyText } from "./PropertySection"
import { fillLabel, fillOptions, sizeLabel, sizeOptions } from "./shapeLabels"
import { EndpointSection, TextSection } from "./TextPropertySections"
import { setSharedStyle, type Styles } from "./shapeProps"

type StyleSectionProps = {
  editor: Editor
  styles: Styles
}

type ShapeSectionProps = StyleSectionProps & {
  shape: TLShape
}

function known<T>(shared: { mixed: boolean; value?: T } | undefined) {
  return shared && !shared.mixed ? (shared.value as T) : null
}

function FillSection({ editor, styles }: StyleSectionProps) {
  if (!styles.fill) return null

  const current = known(styles.fill)
  const options =
    current && !fillOptions.includes(current) ? [current, ...fillOptions] : fillOptions

  return (
    <PropertySection title="填充" className="grid-cols-1">
      <PropertyRow label="样式">
        <OptionSelect
          ariaLabel="填充样式"
          value={current}
          options={options}
          getLabel={fillLabel}
          onSelect={(value) => setSharedStyle(editor, DefaultFillStyle, value)}
        />
      </PropertyRow>
    </PropertySection>
  )
}

function StrokeSection({ editor, styles }: StyleSectionProps) {
  if (!styles.color) return null

  return (
    <PropertySection title="描边">
      <PropertyStack label="颜色" className="col-span-2">
        <ColorSwatches
          ariaLabel="描边颜色"
          value={known(styles.color)}
          onSelect={(value) => setSharedStyle(editor, DefaultColorStyle, value)}
        />
      </PropertyStack>
      {styles.size ? (
        <div className="col-span-2">
          <PropertyRow label="宽度">
            <OptionSelect
              ariaLabel="描边宽度"
              value={known(styles.size)}
              options={sizeOptions}
              getLabel={sizeLabel}
              onSelect={(value) => setSharedStyle(editor, DefaultSizeStyle, value)}
            />
          </PropertyRow>
        </div>
      ) : null}
    </PropertySection>
  )
}

function ImageInfoSection({ shape }: { shape: ImageShape }) {
  const { model, prompt, createdAt } = shape.props
  const date = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" })

  return (
    <PropertySection title="生成信息" className="grid-cols-1">
      <PropertyText label="模型" value={model || "本地图片"} />
      <PropertyText label="时间" value={date.format(createdAt)} />
      {prompt ? (
        <PropertyStack label="提示词">
          <p className="max-h-28 overflow-auto rounded-md border border-border bg-muted/40 px-2 py-1.5 text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/80">
            {prompt}
          </p>
        </PropertyStack>
      ) : null}
    </PropertySection>
  )
}

function ShapePropertySections({ editor, shape, styles }: ShapeSectionProps) {
  if (shape.type === IMAGE_SHAPE_TYPE) {
    return <ImageInfoSection shape={shape as ImageShape} />
  }

  if (shape.type === "geo") {
    return (
      <>
        <FillSection editor={editor} styles={styles} />
        <StrokeSection editor={editor} styles={styles} />
      </>
    )
  }

  if (shape.type === "text") {
    return <TextSection editor={editor} shape={shape} styles={styles} />
  }

  if (shape.type === "arrow" || shape.type === "line") {
    return (
      <>
        <StrokeSection editor={editor} styles={styles} />
        <EndpointSection editor={editor} shape={shape} styles={styles} />
      </>
    )
  }

  return <StrokeSection editor={editor} styles={styles} />
}

export { FillSection, ShapePropertySections, StrokeSection }
