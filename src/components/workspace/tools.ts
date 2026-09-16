import {
  Eraser,
  Hand,
  Image,
  MousePointer2,
  Pencil,
  Shapes,
  Square,
  Type,
  type LucideIcon,
} from "lucide-react"

export type ToolId =
  | "select"
  | "hand"
  | "pencil"
  | "eraser"
  | "shape"
  | "text"
  | "image"
  | "element"

export type Tool = {
  id: ToolId
  label: string
  shortcut: string
  icon: LucideIcon
  group: number
}

export const tools: Tool[] = [
  { id: "select", label: "选择", shortcut: "V", icon: MousePointer2, group: 0 },
  { id: "hand", label: "手型", shortcut: "H", icon: Hand, group: 0 },
  { id: "pencil", label: "画笔", shortcut: "B", icon: Pencil, group: 1 },
  { id: "eraser", label: "橡皮", shortcut: "E", icon: Eraser, group: 1 },
  { id: "shape", label: "形状", shortcut: "R", icon: Square, group: 2 },
  { id: "text", label: "文字", shortcut: "T", icon: Type, group: 2 },
  { id: "image", label: "图片", shortcut: "I", icon: Image, group: 2 },
  { id: "element", label: "图形", shortcut: "S", icon: Shapes, group: 2 },
]
