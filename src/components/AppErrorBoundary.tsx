import { Component, type ErrorInfo, type ReactNode } from "react"

import { Button } from "@/components/ui/button"

type State = { error: Error | null }

/** Turns a render crash into a readable message instead of a blank page. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[kunDraw] 界面渲染失败", error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="grid h-screen w-full place-items-center bg-background p-6">
        <div className="w-full max-w-md space-y-3 text-center">
          <h1 className="text-sm font-semibold">界面加载失败</h1>
          <p className="text-xs leading-relaxed text-muted-foreground">
            本地画布数据仍然保存在浏览器里，刷新页面通常可以恢复。
          </p>
          <pre className="max-h-40 overflow-auto rounded-md border border-border bg-muted/50 p-2 text-left text-[10px] break-all text-destructive">
            {this.state.error.message}
          </pre>
          <Button size="sm" onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </div>
      </div>
    )
  }
}
