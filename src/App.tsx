import { useCallback, useState } from "react"

import { CanvasArea } from "@/components/workspace/CanvasArea"
import { Header } from "@/components/workspace/Header"
import { RightPanel, type RightPanelTab } from "@/components/workspace/RightPanel"
import { StatusBar } from "@/components/workspace/StatusBar"
import { Toolbar } from "@/components/workspace/Toolbar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Toaster } from "@/components/ui/sonner"
import { AiProvider } from "@/features/ai/AiProvider"
import { AiSettingsDialog } from "@/features/ai/components/AiSettingsDialog"
import { NodeCanvasController } from "@/features/canvas/NodeCanvasController"
import { EditorProvider, useWorkspaceEditor } from "@/hooks/useEditor"
import { useProjectName } from "@/hooks/useProjectName"

function ClearCanvasDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>清空画布</DialogTitle>
          <DialogDescription>
            将删除当前页面上的所有元素。此操作可以用撤销恢复。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            清空
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Workspace() {
  const editor = useWorkspaceEditor()
  const { name, rename } = useProjectName()
  const [panelOpen, setPanelOpen] = useState(true)
  const [panelTab, setPanelTab] = useState<RightPanelTab>("ai")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)

  const clearCanvas = useCallback(() => {
    if (!editor) return
    const ids = [...editor.getCurrentPageShapeIds()]
    if (ids.length === 0) return
    editor.markHistoryStoppingPoint("kundraw:clear-canvas")
    editor.deleteShapes(ids)
    editor.focus()
  }, [editor])

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <Header
        projectName={name}
        onRenameProject={rename}
        onClearCanvas={() => setClearOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((open) => !open)}
      />

      <div className="flex min-h-0 flex-1">
        <Toolbar
          onOpenAi={() => {
            setPanelOpen(true)
            setPanelTab("ai")
          }}
        />
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
      <NodeCanvasController />

      <AiSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ClearCanvasDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        onConfirm={clearCanvas}
      />
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
