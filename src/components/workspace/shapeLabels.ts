import {
  DefaultColorStyle,
  DefaultFillStyle,
  DefaultFontStyle,
  DefaultSizeStyle,
  DefaultTextAlignStyle,
  type TLDefaultColorStyle,
  type TLDefaultFillStyle,
  type TLDefaultFontStyle,
  type TLDefaultSizeStyle,
  type TLDefaultTextAlignStyle,
  type TLShape,
} from "tldraw"

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
  "kundraw-prompt": "Prompt 节点",
  "kundraw-image": "图片节点",
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
  fill: "填充",
  "lined-fill": "线填充",
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

const sizeLabels: Record<string, string> = {
  s: "细",
  m: "中",
  l: "粗",
  xl: "特粗",
}

const fontLabels: Record<string, string> = {
  draw: "手写",
  sans: "无衬线",
  serif: "衬线",
  mono: "等宽",
}

const alignLabels: Record<string, string> = {
  start: "左对齐",
  middle: "居中",
  end: "右对齐",
}

export const colorOptions = DefaultColorStyle.values as TLDefaultColorStyle[]
export const fillOptions = DefaultFillStyle.values.filter(
  (value): value is TLDefaultFillStyle =>
    value === "none" || value === "semi" || value === "solid" || value === "pattern"
)
export const sizeOptions = DefaultSizeStyle.values as TLDefaultSizeStyle[]
export const fontOptions = DefaultFontStyle.values as TLDefaultFontStyle[]
export const textAlignOptions = DefaultTextAlignStyle.values as TLDefaultTextAlignStyle[]

export function shapeTypeLabel(shape: TLShape) {
  if (shape.type === "geo") {
    const geo = (shape.props as unknown as Record<string, unknown>).geo
    if (typeof geo === "string") return geoLabels[geo] ?? "图形"
  }

  return shapeTypeLabels[shape.type] ?? shape.type
}

export function colorLabel(color: string) {
  return colorLabels[color] ?? color
}

export function fillLabel(fill: string) {
  return fillLabels[fill] ?? fill
}

export function sizeLabel(size: string) {
  return sizeLabels[size] ?? size
}

export function fontLabel(font: string) {
  return fontLabels[font] ?? font
}

export function alignLabel(align: string) {
  return alignLabels[align] ?? align
}

export function formatNumber(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return FALLBACK
  }
  const rounded = Number(value.toFixed(digits))
  return String(rounded)
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return FALLBACK
  }
  return `${Math.round(value * 100)}%`
}
