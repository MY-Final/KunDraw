import type { Editor } from "tldraw"

/** tldraw names its first page "Page 1"; kunDraw's copy is Chinese. */
const DEFAULT_PAGE_NAME = /^Page \d+$/

export function normalizeDefaultPageName(editor: Editor) {
  const pages = editor.getPages()
  if (pages.length !== 1 || !DEFAULT_PAGE_NAME.test(pages[0].name)) return

  editor.run(
    () => {
      editor.updatePage({ id: pages[0].id, name: "页面 1" })
    },
    { history: "ignore" }
  )
}
