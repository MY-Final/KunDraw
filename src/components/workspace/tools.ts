import {
  Circle,
  Eraser,
  Hand,
  MousePointer2,
  Pencil,
  Square,
  Type,
  type LucideIcon,
} from "lucide-react"
import { GeoShapeGeoStyle, type Editor, type TLGeoShapeGeoStyle } from "tldraw"

export type ToolId =
  | "select"
  | "hand"
  | "draw"
  | "eraser"
  | "rectangle"
  | "ellipse"
  | "text"

export type Tool = {
  id: ToolId
  label: string
  shortcut: string
  icon: LucideIcon
  group: number
  tldrawToolId: string
  geo?: TLGeoShapeGeoStyle
}

export const tools: Tool[] = [
  { id: "select", label: "选择", shortcut: "V", icon: MousePointer2, group: 0, tldrawToolId: "select" },
  { id: "hand", label: "手型", shortcut: "H", icon: Hand, group: 0, tldrawToolId: "hand" },
  { id: "draw", label: "画笔", shortcut: "D / P", icon: Pencil, group: 1, tldrawToolId: "draw" },
  { id: "eraser", label: "橡皮", shortcut: "E", icon: Eraser, group: 1, tldrawToolId: "eraser" },
  { id: "rectangle", label: "矩形", shortcut: "R", icon: Square, group: 2, tldrawToolId: "geo", geo: "rectangle" },
  { id: "ellipse", label: "椭圆", shortcut: "O", icon: Circle, group: 2, tldrawToolId: "geo", geo: "ellipse" },
  { id: "text", label: "文本", shortcut: "T", icon: Type, group: 2, tldrawToolId: "text" },
]

export function activateTool(editor: Editor, tool: Tool) {
  if (tool.geo) {
    editor.setStyleForNextShapes(GeoShapeGeoStyle, tool.geo)
  }

  editor.setCurrentTool(tool.tldrawToolId)
}

export function getActiveToolId(editor: Editor): ToolId | null {
  const tldrawToolId = editor.getCurrentToolId()

  if (tldrawToolId === "geo") {
    const geo = editor.getStyleForNextShape(GeoShapeGeoStyle)
    return geo === "ellipse" ? "ellipse" : "rectangle"
  }

  return tools.find((tool) => tool.tldrawToolId === tldrawToolId)?.id ?? null
}
