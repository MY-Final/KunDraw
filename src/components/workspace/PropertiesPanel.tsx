import type { ReactNode } from "react"
import { cn } from "cn"
import { useValue } from "tldraw"

import { useWorkspaceEditor } from "@/hooks/useEditor"

import { FALLBACK, formatValue, getSelectionInfo } from "./selectionInfo"

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-border px-3 py-3.5">
      <h3 className="mb-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </section>
  )
}

function Field({
  label,
  value,
  suffix,
  className,
}: {
  label: string
  value?: string
  suffix?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2",
        className
      )}
    >
      <span className="shrink-0 text-[11px] text-muted-foreground">
        {label}
      </span>
      <span className="flex-1 truncate text-right text-xs text-foreground/80 tabular-nums">
        {value ?? FALLBACK}
      </span>
      {suffix ? (
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  )
}

function ColorField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="col-span-2 flex h-7 items-center justify-between rounded-md border border-border bg-muted/40 px-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="size-4 rounded-sm border border-border bg-muted" />
        <span className="text-xs text-foreground/80">{value ?? FALLBACK}</span>
      </span>
    </div>
  )
}

function PropertiesPanel() {
  const editor = useWorkspaceEditor()
  const selection = useValue(
    "kundraw selection",
    () => getSelectionInfo(editor),
    [editor]
  )

  const statusText =
    selection.count === 0
      ? "未选择"
      : selection.count === 1
        ? "已选择 1 个元素"
        : `已选择 ${selection.count} 个元素`

  return (
    <aside
      aria-label="属性面板"
      className="hidden w-[280px] shrink-0 flex-col border-l border-border bg-background lg:flex"
    >
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3">
        <h2 className="text-sm font-medium">属性</h2>
        <span className="text-[11px] text-muted-foreground">{statusText}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selection.count === 0 ? (
          <p className="border-b border-border px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            选择画布中的元素以查看其属性。
          </p>
        ) : (
          <div className="border-b border-border px-3 py-3.5">
            <Field label="类型" value={selection.type ?? FALLBACK} />
          </div>
        )}

        <Section title="位置">
          <Field label="X" value={formatValue(selection.x)} />
          <Field label="Y" value={formatValue(selection.y)} />
        </Section>

        <Section title="尺寸">
          <Field label="宽" value={formatValue(selection.w)} />
          <Field label="高" value={formatValue(selection.h)} />
        </Section>

        <Section title="变换">
          <Field
            label="旋转"
            value={formatValue(selection.rotation)}
            suffix="°"
          />
          <Field
            label="透明度"
            value={formatValue(selection.opacity)}
            suffix="%"
          />
        </Section>

        <Section title="外观">
          <ColorField label="填充" value={selection.fill} />
          <ColorField label="描边" value={selection.stroke} />
          <Field label="圆角" className="col-span-2" suffix="px" />
        </Section>
      </div>
    </aside>
  )
}

export { PropertiesPanel }
