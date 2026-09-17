import type { Editor, TLShape } from "tldraw"

export const FALLBACK = "—"

const shapeTypeLabels: Record<string, string> = {
  draw: "画笔",
  text: "文本",
  note: "便签",
  line: "直线",
  arrow: "箭头",
  frame: "画框",
  highlight: "高亮",
  image: "图片",
  video: "视频",
  embed: "嵌入",
  group: "分组",
  bookmark: "书签",
}

const geoLabels: Record<string, string> = {
  rectangle: "矩形",
  ellipse: "椭圆",
  triangle: "三角形",
  diamond: "菱形",
  "rhombus-2": "平行四边形",
  star: "星形",
  oval: "椭圆",
  cloud: "云形",
  heart: "心形",
  hexagon: "六边形",
  octagon: "八边形",
  pentagon: "五边形",
  trapezoid: "梯形",
  "x-box": "叉形框",
  "check-box": "勾选框",
}

const fillLabels: Record<string, string> = {
  none: "无",
  semi: "半透明",
  solid: "实心",
  pattern: "图案",
}

const colorLabels: Record<string, string> = {
  black: "黑色",
  blue: "蓝色",
  green: "绿色",
  grey: "灰色",
  "light-blue": "浅蓝",
  "light-green": "浅绿",
  "light-red": "浅红",
  "light-violet": "浅紫",
  orange: "橙色",
  red: "红色",
  violet: "紫色",
  white: "白色",
  yellow: "黄色",
}

export type SelectionInfo = {
  count: number
  type: string | null
  x: number | null
  y: number | null
  w: number | null
  h: number | null
  rotation: number | null
  opacity: number | null
  fill: string | null
  stroke: string | null
}

const EMPTY_SELECTION: SelectionInfo = {
  count: 0,
  type: null,
  x: null,
  y: null,
  w: null,
  h: null,
  rotation: null,
  opacity: null,
  fill: null,
  stroke: null,
}

function readProp(shape: TLShape, key: string) {
  return (shape.props as unknown as Record<string, unknown>)[key]
}

function getTypeLabel(shape: TLShape) {
  if (shape.type === "geo") {
    const geo = readProp(shape, "geo")
    if (typeof geo === "string") return geoLabels[geo] ?? "图形"
  }

  return shapeTypeLabels[shape.type] ?? shape.type
}

export function getSelectionInfo(editor: Editor | null): SelectionInfo {
  if (!editor) return EMPTY_SELECTION

  const shapes = editor.getSelectedShapes()
  if (shapes.length === 0) return EMPTY_SELECTION

  const bounds = editor.getSelectionPageBounds()

  const base: SelectionInfo = {
    ...EMPTY_SELECTION,
    count: shapes.length,
    x: bounds ? Math.round(bounds.x) : null,
    y: bounds ? Math.round(bounds.y) : null,
    w: bounds ? Math.round(bounds.w) : null,
    h: bounds ? Math.round(bounds.h) : null,
  }

  if (shapes.length > 1) return base

  const shape = shapes[0]
  const fill = readProp(shape, "fill")
  const color = readProp(shape, "color")

  return {
    ...base,
    type: getTypeLabel(shape),
    rotation: Math.round((shape.rotation * 180) / Math.PI),
    opacity: Math.round(shape.opacity * 100),
    fill: typeof fill === "string" ? (fillLabels[fill] ?? fill) : null,
    stroke: typeof color === "string" ? (colorLabels[color] ?? color) : null,
  }
}

export function formatValue(value: number | string | null) {
  if (value === null) return FALLBACK
  return String(value)
}
