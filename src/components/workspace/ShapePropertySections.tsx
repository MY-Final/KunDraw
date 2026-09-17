import {
  DefaultColorStyle,
  DefaultFillStyle,
  DefaultSizeStyle,
  type Editor,
  type TLShape,
} from "tldraw"

import { ColorSwatches } from "./ColorInput"
import { OptionSelect } from "./OptionInput"
import { PropertyRow, PropertySection, PropertyStack } from "./PropertySection"
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

function ShapePropertySections({ editor, shape, styles }: ShapeSectionProps) {
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
