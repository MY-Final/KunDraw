# kunDraw — Agent Guide

kunDraw is a pure front-end infinite-canvas painting/design workbench. The visual
layout is kunDraw's own; tldraw is used only for canvas + editor core.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build  (must pass)
npm run lint      # eslint .
npm run preview   # preview the production build
```

Always run `npm run build` and `npm run lint` before considering a task done.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (`@import "tailwindcss"` in `src/index.css`, no config file)
- shadcn/ui (`base-nova` style, Base UI primitives) in `src/components/ui/`
- lucide-react for icons
- tldraw 5 for the canvas/editor

## Layout

Full-screen editor shell, top to bottom:

```
Header                                 (52px)
├── Toolbar (56px) │ CanvasArea │ PropertiesPanel (280px, lg+)
StatusBar                              (32px)
```

## Where things live

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Layout composition only. Keep it short — no logic here. |
| `src/components/workspace/Header.tsx` | Brand, file name, save state, undo/redo, export, settings |
| `src/components/workspace/Toolbar.tsx` | Vertical tool list; drives `editor.setCurrentTool()` |
| `src/components/workspace/CanvasArea.tsx` | Mounts `<Tldraw hideUi />`, publishes the editor instance |
| `src/components/workspace/PropertiesPanel.tsx` | Read-only selection properties UI |
| `src/components/workspace/StatusBar.tsx` | Active tool, selection count, zoom controls |
| `src/components/workspace/tools.ts` | Tool list + `activateTool` / `getActiveToolId` |
| `src/components/workspace/selectionInfo.ts` | Label maps + selection snapshot reader |
| `src/hooks/useEditor.tsx` | `EditorProvider` and editor context hooks |
| `src/components/ui/` | shadcn/ui components; generated, edit sparingly |

## Editor access

There is exactly one `Editor` instance. `CanvasArea` receives it from tldraw's
`onMount` and stores it via `EditorProvider`. Every other component reads it with
`useWorkspaceEditor()`.

Never create a second editor or re-implement pointer/drawing logic — delegate to
tldraw.

Reactive reads must go through `useValue(...)` from tldraw so components re-render
on editor state changes:

```tsx
const zoom = useValue("kundraw zoom", () => editor?.getZoomLevel() ?? 1, [editor])
```

## Conventions

- Don't add comments unless they explain non-obvious intent.
- UI copy is Simplified Chinese; code, identifiers, and comments are English.
- Keep components small and single-purpose. If a file grows past ~150 lines,
  extract pure data/helpers into a sibling module (see `selectionInfo.ts`).
- Import via the `@/` alias, not relative `../..` paths.
- Use `cn` from `@/lib/utils` for conditional class names.
- Style with Tailwind utilities and the theme CSS variables (`bg-background`,
  `border-border`, `text-muted-foreground`). Don't hard-code hex colors.
- Use shadcn/ui components and lucide icons; match the existing icon sizing
  (`size-[18px]` in the Toolbar, `size-3.5`/`size-4` elsewhere).
- Small square buttons carry both `aria-label` and `title`.

## Visual rules

The design is a tool-like editor, not a dashboard or marketing page:

- White / light neutral surfaces, thin borders to separate regions.
- No gradients, no large rounded cards, no sidebar navigation, no dashboards.
- Canvas is the visual center; keep chrome restrained and sparingly padded.
- Preserve existing hover / active states and region sizes.

## tldraw specifics

- `<Tldraw hideUi />` — kunDraw supplies its own Header/Toolbar/StatusBar, so the
  default tldraw UI (toolbar, style panel, menus) must stay hidden.
- Current tools: select, hand, draw, eraser, rectangle, ellipse, text.
- Geo shapes share the `geo` tool; set `GeoShapeGeoStyle` before switching:

```ts
editor.setStyleForNextShapes(GeoShapeGeoStyle, "rectangle")
editor.setCurrentTool("geo")
```

- `getCurrentToolId()` reflects tldraw semantics (e.g. `geo` for both rectangle
  and ellipse), so map it back to a kunDraw tool id via `getActiveToolId()`.
- Keyboard shortcuts are tldraw's; the Toolbar reads active state from the editor
  rather than owning it, so shortcuts and clicks stay in sync.
- API details: read the type definitions in `node_modules/tldraw` and
  `node_modules/@tldraw/editor` before implementing. Do not guess from older
  tldraw versions.
- The "Get a license for production" watermark is required by the tldraw license
  and must stay visible until a license key is purchased.

## Testing UI changes

Run `npm run dev`, then verify in the browser: pan/zoom, tool switching, shape
creation, selection, undo/redo, and the zoom readout in the StatusBar. Check the
browser console for errors.

## Out of scope (unless explicitly requested)

Backend, APIs, file saving, export flows, a layer system, property editing, and
any state-management library.
