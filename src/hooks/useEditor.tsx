import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import type { Editor } from "tldraw"

type EditorContextValue = {
  editor: Editor | null
  setEditor: (editor: Editor | null) => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

function EditorProvider({ children }: { children: ReactNode }) {
  const [editor, setEditor] = useState<Editor | null>(null)

  const value = useMemo(() => ({ editor, setEditor }), [editor])

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}

function useEditorContext() {
  const context = useContext(EditorContext)

  if (!context) {
    throw new Error("useEditorContext 必须在 EditorProvider 内部使用")
  }

  return context
}

function useWorkspaceEditor() {
  return useEditorContext().editor
}

// The provider and its hooks live together so the editor context stays in one place,
// matching the shadcn components in this project that export alongside a component.
// eslint-disable-next-line react-refresh/only-export-components
export { EditorProvider, useEditorContext, useWorkspaceEditor }
