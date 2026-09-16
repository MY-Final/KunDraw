import { useState } from "react"

import { CanvasArea } from "@/components/workspace/CanvasArea"
import { Header } from "@/components/workspace/Header"
import { PropertiesPanel } from "@/components/workspace/PropertiesPanel"
import { StatusBar } from "@/components/workspace/StatusBar"
import { Toolbar } from "@/components/workspace/Toolbar"
import type { ToolId } from "@/components/workspace/tools"

const MIN_ZOOM = 0.25
const MAX_ZOOM = 2
const ZOOM_STEP = 0.1

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100))
}

function App() {
  const [activeTool, setActiveTool] = useState<ToolId>("select")
  const [zoom, setZoom] = useState(1)

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <Header />

      <div className="flex min-h-0 flex-1">
        <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />
        <CanvasArea zoom={zoom} />
        <PropertiesPanel />
      </div>

      <StatusBar
        activeTool={activeTool}
        zoom={zoom}
        onZoomIn={() => setZoom((value) => clampZoom(value + ZOOM_STEP))}
        onZoomOut={() => setZoom((value) => clampZoom(value - ZOOM_STEP))}
        onZoomReset={() => setZoom(1)}
      />
    </div>
  )
}

export default App
