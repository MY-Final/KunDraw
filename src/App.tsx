import { CanvasArea } from "@/components/workspace/CanvasArea"
import { Header } from "@/components/workspace/Header"
import { PropertiesPanel } from "@/components/workspace/PropertiesPanel"
import { StatusBar } from "@/components/workspace/StatusBar"
import { Toolbar } from "@/components/workspace/Toolbar"
import { EditorProvider } from "@/hooks/useEditor"

function App() {
  return (
    <EditorProvider>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
        <Header />

        <div className="flex min-h-0 flex-1">
          <Toolbar />
          <CanvasArea />
          <PropertiesPanel />
        </div>

        <StatusBar />
      </div>
    </EditorProvider>
  )
}

export default App
