import type { Editor, TLShape } from "tldraw"

import { NumberInput } from "./PropertyInput"
import { PropertyRow, PropertySection, PropertyText } from "./PropertySection"
import { shapeTypeLabel } from "./shapeLabels"
import {
  readShapeSize,
  updateBoxSize,
  updateOpacity,
  updatePosition,
  updateRotation,
} from "./shapeProps"

function OpacityField({
  value,
  onCommit,
  onConfirm,
}: {
  value: number | null
  onCommit: (value: number) => void
  onConfirm?: () => void
}) {
  return (
    <PropertyRow label="透明度" hint="%" className="col-span-2">
      <NumberInput
        ariaLabel="透明度"
        value={value}
        min={0}
        max={100}
        onConfirm={onConfirm}
        onCommit={onCommit}
      />
    </PropertyRow>
  )
}

export function OpacitySection({
  editor,
  value,
}: {
  editor: Editor
  value: number | null
}) {
  return (
    <PropertySection title="外观">
      <OpacityField
        value={value}
        onConfirm={() => editor.focus()}
        onCommit={(next) => updateOpacity(editor, next / 100)}
      />
    </PropertySection>
  )
}

export function ShapeCommonSections({
  editor,
  shape,
}: {
  editor: Editor
  shape: TLShape
}) {
  const size = readShapeSize(editor, shape)

  return (
    <>
      <PropertySection title="基本" className="grid-cols-1">
        <PropertyText label="类型" value={shapeTypeLabel(shape)} />
      </PropertySection>

      <PropertySection title="位置">
        <PropertyRow label="X">
          <NumberInput
            ariaLabel="X"
            value={shape.x}
            onConfirm={() => editor.focus()}
            onCommit={(value) => updatePosition(editor, shape, "x", value)}
          />
        </PropertyRow>
        <PropertyRow label="Y">
          <NumberInput
            ariaLabel="Y"
            value={shape.y}
            onConfirm={() => editor.focus()}
            onCommit={(value) => updatePosition(editor, shape, "y", value)}
          />
        </PropertyRow>
      </PropertySection>

      <PropertySection title="尺寸">
        <PropertyRow label="W">
          <NumberInput
            ariaLabel="W"
            value={size ? size.w : null}
            min={1}
            disabled={!size}
            onConfirm={() => editor.focus()}
            onCommit={(value) => updateBoxSize(editor, shape, { w: value })}
          />
        </PropertyRow>
        <PropertyRow label="H">
          <NumberInput
            ariaLabel="H"
            value={size ? size.h : null}
            min={1}
            disabled={!size}
            onConfirm={() => editor.focus()}
            onCommit={(value) => updateBoxSize(editor, shape, { h: value })}
          />
        </PropertyRow>
      </PropertySection>

      <PropertySection title="变换">
        <PropertyRow label="旋转" hint="°" className="col-span-2">
          <NumberInput
            ariaLabel="旋转"
            value={(shape.rotation * 180) / Math.PI}
            onConfirm={() => editor.focus()}
            onCommit={(value) => updateRotation(editor, shape, value)}
          />
        </PropertyRow>
      </PropertySection>
    </>
  )
}
