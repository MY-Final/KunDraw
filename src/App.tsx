import { useState } from "react"

import { CanvasArea } from "@/components/workspace/CanvasArea"
import { Header } from "@/components/workspace/Header"
import { RightPanel, type RightPanelTab } from "@/components/workspace/RightPanel"
import { StatusBar } from "@/components/workspace/StatusBar"
import { Toolbar } from "@/components/workspace/Toolbar"
import { Toaster } from "@/components/ui/sonner"
import { AiSettingsDialog } from "@/features/ai/components/AiSettingsDialog"
import { AiProvider } from "@/features/ai/AiProvider"
import { EditorProvider } from "@/hooks/useEditor"

function Workspace() {
  const [panelOpen, setPanelOpen] = useState(true)
  const [panelTab, setPanelTab] = useState<RightPanelTab>("ai")
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((open) => !open)}
      />

      <div className="flex min-h-0 flex-1">
        <Toolbar />
        <CanvasArea />
        <RightPanel
          open={panelOpen}
          tab={panelTab}
          onTabChange={setPanelTab}
          onClose={() => setPanelOpen(false)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      <StatusBar />

      <AiSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <Toaster position="bottom-right" />
    </div>
  )
}

function App() {
  return (
    <EditorProvider>
      <AiProvider>
        <Workspace />
      </AiProvider>
    </EditorProvider>
  )
}

export default App
