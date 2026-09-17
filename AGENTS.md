# kunDraw — Agent Guide

kunDraw is a pure front-end AI drawing workbench: an infinite tldraw canvas whose
right panel generates images through a user-supplied NewAPI endpoint. There is no
backend — the browser talks to NewAPI directly.

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
- sonner for toasts

## UI components

shadcn/ui is the only source of interactive primitives. Never hand-roll a control
that shadcn already provides, and never fall back to an unstyled native element
(`<select>`, `<input type="color">`, `<input type="checkbox">`) — the browser
chrome breaks the workbench look.

Installed in `src/components/ui/`: `alert-dialog`, `badge`, `button`, `checkbox`,
`collapsible`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`,
`radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `slider`,
`sonner`, `switch`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`.

Add more with `npx shadcn@latest add <name>`. The generator tends to emit
`next-themes` (unused here — kunDraw is light-only) and unused `React` imports;
clean both up, and add the `react-refresh/only-export-components` disable comment
when a file exports `*Variants` alongside its component.

## Layout

Full-screen editor shell, top to bottom:

```
Header                                 (52px)
├── Toolbar (56px) │ CanvasArea │ RightPanel (300px, lg+)
StatusBar                              (32px)
```

## Where things live

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Layout composition only. Keep it short — no logic here. |
| `src/components/workspace/Header.tsx` | Brand, editable project name + menu, save state, undo/redo, export, panel toggle, settings |
| `src/components/workspace/Toolbar.tsx` | Vertical tool list; drives `editor.setCurrentTool()` |
| `src/components/workspace/CanvasArea.tsx` | Mounts `<Tldraw hideUi />`, publishes the editor instance |
| `src/components/workspace/RightPanel.tsx` | Panel shell; `AI 创作` / `属性` tabs and close button |
| `src/components/workspace/PropertiesPanel.tsx` | Properties tab: lock/hide/delete, empty + multi selection states |
| `src/components/workspace/ShapeCommonSections.tsx` | Position / size / rotation / opacity sections |
| `src/components/workspace/ShapePropertySections.tsx` | Appearance sections (fill, stroke) + per-shape-type dispatch |
| `src/components/workspace/TextPropertySections.tsx` | Text content/style and line + arrow endpoint sections |
| `src/components/workspace/PropertySection.tsx` | Section / row / read-only field layout primitives |
| `src/components/workspace/PropertyInput.tsx` | Text-entry inputs (commit on Enter/blur, cancel on Escape) |
| `src/components/workspace/OptionInput.tsx` | Enum select and segmented option inputs |
| `src/components/workspace/ColorInput.tsx` | tldraw palette swatch picker |
| `src/components/workspace/shapeProps.ts` | Reads and editor commands for shape properties |
| `src/components/workspace/shapeLabels.ts` | Chinese label maps, style option lists, number formatting |
| `src/components/workspace/StatusBar.tsx` | Active tool, selection count, zoom controls |
| `src/components/workspace/tools.ts` | Tool list + `activateTool` / `getActiveToolId` |
| `src/api/newapi/client.ts` | `NewApiClient`: base URL, auth headers, timeout, error mapping |
| `src/api/newapi/images.ts` | Images API: generations (JSON) and edits (multipart) |
| `src/api/newapi/errors.ts` | Status → `NewApiError` mapping and user-facing hints |
| `src/api/newapi/types.ts` | OpenAI-compatible request/response shapes |
| `src/features/ai/AiProvider.tsx` | AI state: channels, prompt, references, settings, results, status |
| `src/features/ai/constants.ts` | Ratios, resolutions, count bounds + `computeSize()` |
| `src/features/ai/generate.ts` | Request assembly + generation orchestration |
| `src/features/ai/canvas.ts` | `addImageToCanvas()` and image download |
| `src/features/ai/storage.ts` | App settings (channels, API key, prompt draft) in IndexedDB, hydrated at boot |
| `src/features/ai/components/` | `AiPanel`, `AiSettingsDialog`, `ResultGallery`, pickers, inputs |
| `src/hooks/useEditor.tsx` | `EditorProvider` and editor context hooks |
| `src/hooks/useSelectedShapes.ts` | Reactive current selection |
| `src/features/persistence/db.ts` | IndexedDB stores and record helpers (projects, canvases, assets, settings, meta) |
| `src/features/persistence/projects.ts` | Project records, current project id, startup resolution |
| `src/features/persistence/canvasStorage.ts` | tldraw snapshot save/restore plus asset reference rewriting |
| `src/features/persistence/assets.ts` | Image blobs in IndexedDB and their runtime object URLs |
| `src/features/persistence/ProjectProvider.tsx` | Debounced autosave, project switching, save status |
| `src/features/persistence/components/` | Project menu, save status indicator, local data section |
| `src/hooks/useToolShortcuts.ts` | Extra key bindings tldraw does not provide |
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

## Shape state

tldraw's store is the only source of truth for shape data. Never mirror shapes
into React state or a store library; read them with `useSelectedShapes()` and
write them with the commands in `shapeProps.ts`.

- React state is only for UI concerns (open panels, in-progress input text).
- Every mutation goes through the editor API (`updateShape`, `updateShapes`,
  `resizeShape`, `setStyleForSelectedShapes`, `setOpacityForSelectedShapes`,
  `toggleLock`, `deleteShapes`), wrapped by a `shapeProps.ts` command.
- Styles are read from `editor.getSharedStyles()` / `getSharedOpacity()`, which
  report `{ type: "mixed" }` when a selection disagrees — render that as `混合`
  instead of picking one shape's value.
- Lock uses `editor.toggleLock()`; the canvas enables the
  `selectLockedShapes` option so a locked shape stays selectable and can be
  unlocked (tldraw's lock guards still block moving and deleting).
- Hide stores a flag in `shape.meta.hidden` and the canvas passes
  `getShapeVisibility`, which is tldraw's supported mechanism. Because hidden
  shapes cannot be selected, the empty panel state offers `全部显示` to recover.
- Panel commands call `focusCanvas()` after mutating, because the panel sits
  outside the tldraw container and would otherwise leave the canvas blurred and
  its key bindings disabled.

## AI generation

The AI panel talks to user-supplied, OpenAI-compatible NewAPI channels. There is
no kunDraw backend, no proxying and no credits/billing concept — never add one.

- **Channels.** The user may configure several endpoints (`Channel` in
  `types.ts`), each with its own base URL, API key and discovered model list. One
  is active at a time; the panel and settings both switch it.
- All requests go through `NewApiClient`; never call `fetch` from a component.
- Text-to-image → `POST {base}/images/generations` (JSON). Image-to-image →
  `POST {base}/images/edits` (multipart, `image` for one reference, `image[]` for
  several). The mode is the user's choice, never derived from the model.
- **No model capability gating.** Any model may be used for either mode; the
  model field accepts free text because gateways often take ids `/models` does
  not list. Do not reintroduce per-model restrictions.
- References are unlimited in count (only a per-file size guard); several are
  sent as group references.
- `size` comes from `computeSize()` in `constants.ts` — aspect ratio × base
  resolution. `auto` ratio sends no `size` at all.
- API keys live in IndexedDB (app settings record, never project data) and must
  never be hard-coded, logged, or written into a canvas snapshot.
- Raw errors stay in the console; the UI shows `describeNewApiError()` output.

## Canvas image insertion

`addImageToCanvas()` in `src/features/ai/canvas.ts` is the only path from a
generated image to the canvas:

```ts
AssetRecordType.create(...)                      // asset
editor.createAssets([asset])
editor.getShapeUtil("image").createShapeForAsset(asset, point)
editor.createShape(partial)
editor.select(id)
```

Never construct image shapes by hand — `createShapeForAsset` is what keeps the
asset id, aspect ratio and props correct.

## Conventions

- Don't add comments unless they explain non-obvious intent.
- UI copy is Simplified Chinese; code, identifiers, and comments are English.
- Keep components small and single-purpose. If a file grows past ~150 lines,
  extract pure data/helpers into a sibling module (see `shapeProps.ts`).
- Import via the `@/` alias, not relative `../..` paths.
- Use `cn` from `@/lib/utils` for conditional class names.
- Style with Tailwind utilities and the theme CSS variables (`bg-background`,
  `border-border`, `text-muted-foreground`). Don't hard-code hex colors.
- Use shadcn/ui components and lucide icons; match the existing icon sizing
  (`size-[18px]` in the Toolbar, `size-3.5`/`size-4` elsewhere).
- Small square buttons carry both `aria-label` and `title`.

## Property editing rules

- Number and text fields commit on Enter and blur, cancel on Escape, and fall
  back to the editor value when the input cannot be parsed — never write `NaN`.
- Swatch pickers use the tldraw palette from `editor.getCurrentTheme()`; a
  shape's color is a style enum, not an arbitrary hex value.
- Label text is edited as rich text via `renderRichTextFromHTML` /
  `renderPlaintextFromRichText`, escaping the plain text first.

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
  Line and arrow have no Toolbar button yet but are reachable via tldraw's `l`
  and `a` shortcuts, and the properties panel styles them.
- Geo shapes share the `geo` tool; set `GeoShapeGeoStyle` before switching:

```ts
editor.setStyleForNextShapes(GeoShapeGeoStyle, "rectangle")
editor.setCurrentTool("geo")
```

- `getCurrentToolId()` reflects tldraw semantics (e.g. `geo` for both rectangle
  and ellipse), so map it back to a kunDraw tool id via `getActiveToolId()`.
- Keyboard shortcuts belong to tldraw: `v`, `h`, `d`/`b`/`x`, `e`, `r`, `o`, `t`,
  undo/redo, clipboard, and delete are all already bound. `useToolShortcuts`
  only adds `p` for the draw tool — check tldraw's bindings before adding more.
- The Toolbar reads active state from the editor rather than owning it, so
  keyboard and click tool switching stay in sync.
- `editor.resizeShape(id, scale, { scaleOrigin })` resizes every shape type
  correctly (rotation, autoSize, draw segments); anchor the edited edge with
  `scaleOrigin` so X and Y do not drift.
- API details: read the type definitions in `node_modules/tldraw` and
  `node_modules/@tldraw/editor` before implementing. Do not guess from older
  tldraw versions.
- The "Get a license for production" watermark is required by the tldraw license
  and must stay visible until a license key is purchased.

## Testing UI changes

Run `npm run dev`, then verify in the browser: pan/zoom, tool switching, shape
creation, selection, undo/redo, and the zoom readout in the StatusBar. Check the
browser console for errors.

To exercise AI generation without a real gateway, stub NewAPI with a small local
server that answers `/v1/models` with `{ data: [{ id }] }` and
`/v1/images/generations` / `/v1/images/edits` with
`{ data: [{ b64_json }] }`, then point the settings dialog at it.

## Out of scope (unless explicitly requested)

Backend, a proxy for NewAPI, accounts/billing, cloud project saving, a layer
system, and any state-management library.
