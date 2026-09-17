import { TextAlignCenter, TextAlignEnd, TextAlignStart } from "lucide-react"
import {
  DefaultColorStyle,
  DefaultFontStyle,
  DefaultSizeStyle,
  DefaultTextAlignStyle,
  type Editor,
  type TLShape,
} from "tldraw"

import { ColorSwatches } from "./ColorInput"
import { OptionSelect, SegmentedInput } from "./OptionInput"
import { NumberInput, TextField } from "./PropertyInput"
import { PropertyRow, PropertySection, PropertyStack } from "./PropertySection"
import { alignLabel, fontLabel, fontOptions, sizeLabel, sizeOptions, textAlignOptions } from "./shapeLabels"
import {
  readEndpoints,
  readText,
  setSharedStyle,
  updateEndpoint,
  updateText,
  type Styles,
} from "./shapeProps"

type ShapeSectionProps = {
  editor: Editor
  shape: TLShape
  styles: Styles
}

function known<T>(shared: { mixed: boolean; value?: T } | undefined) {
  return shared && !shared.mixed ? (shared.value as T) : null
}

function TextSection({ editor, shape, styles }: ShapeSectionProps) {
  return (
    <>
      <PropertySection title="文本" className="grid-cols-1">
        <PropertyRow label="内容">
          <TextField
            ariaLabel="文本内容"
            value={readText(editor, shape) ?? ""}
            placeholder="输入文本"
            onConfirm={() => editor.focus()}
            onCommit={(value) => updateText(editor, shape, value)}
          />
        </PropertyRow>
      </PropertySection>

      <PropertySection title="文字">
        {styles.size ? (
          <PropertyRow label="字号">
            <OptionSelect
              ariaLabel="字号"
              value={known(styles.size)}
              options={sizeOptions}
              getLabel={sizeLabel}
              onSelect={(value) => setSharedStyle(editor, DefaultSizeStyle, value)}
            />
          </PropertyRow>
        ) : null}
        {styles.font ? (
          <PropertyRow label="字体">
            <OptionSelect
              ariaLabel="字体"
              value={known(styles.font)}
              options={fontOptions}
              getLabel={fontLabel}
              onSelect={(value) => setSharedStyle(editor, DefaultFontStyle, value)}
            />
          </PropertyRow>
        ) : null}
        {styles.textAlign ? (
          <div className="col-span-2">
            <PropertyRow label="对齐">
              <SegmentedInput
                ariaLabel="文字对齐"
                value={known(styles.textAlign)}
                options={textAlignOptions}
                getLabel={alignLabel}
                getIcon={(option) =>
                  option === "middle" ? (
                    <TextAlignCenter className="size-3.5" />
                  ) : option === "end" ? (
                    <TextAlignEnd className="size-3.5" />
                  ) : (
                    <TextAlignStart className="size-3.5" />
                  )
                }
                onSelect={(value) =>
                  setSharedStyle(editor, DefaultTextAlignStyle, value)
                }
              />
            </PropertyRow>
          </div>
        ) : null}
        {styles.color ? (
          <PropertyStack label="颜色" className="col-span-2">
            <ColorSwatches
              ariaLabel="文字颜色"
              value={known(styles.color)}
              onSelect={(value) => setSharedStyle(editor, DefaultColorStyle, value)}
            />
          </PropertyStack>
        ) : null}
      </PropertySection>
    </>
  )
}

function EndpointSection({ editor, shape }: ShapeSectionProps) {
  const endpoints = readEndpoints(shape)
  if (!endpoints) return null

  const fields = [
    { key: "start", axis: "x", label: "起点 X" },
    { key: "start", axis: "y", label: "起点 Y" },
    { key: "end", axis: "x", label: "终点 X" },
    { key: "end", axis: "y", label: "终点 Y" },
  ] as const

  return (
    <PropertySection title="端点">
      {fields.map((field) => (
        <PropertyRow key={field.label} label={field.label}>
          <NumberInput
            ariaLabel={field.label}
            value={endpoints[field.key][field.axis]}
            onConfirm={() => editor.focus()}
            onCommit={(value) =>
              updateEndpoint(editor, shape, field.key, { [field.axis]: value })
            }
          />
        </PropertyRow>
      ))}
    </PropertySection>
  )
}

export { EndpointSection, TextSection }
