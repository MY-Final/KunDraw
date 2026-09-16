import { Frame } from "lucide-react"

type CanvasAreaProps = {
  zoom: number
}

function CanvasArea({ zoom }: CanvasAreaProps) {
  return (
    <main className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-neutral-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(0 0 0 / 0.09) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div
        className="relative flex w-full max-h-full flex-col items-center"
        style={{ transform: `scale(${zoom})`, transition: "transform 150ms ease-out" }}
      >
        <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
          <span className="font-medium text-neutral-600">画布</span>
          <span className="tabular-nums">1920 × 1080</span>
        </div>

        <div className="flex aspect-video w-[min(880px,78%)] max-w-full items-center justify-center border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.16)]">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="grid size-12 place-items-center rounded-lg border border-dashed border-neutral-300 text-neutral-400">
              <Frame className="size-6" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-600">
                Canvas 占位区域
              </p>
              <p className="text-xs text-neutral-400">
                后续将在此嵌入 tldraw 画布
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export { CanvasArea }
