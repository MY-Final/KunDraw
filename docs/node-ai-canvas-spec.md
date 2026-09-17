# Spec: Node-based AI Canvas

## Objective

Refactor kunDraw's core workspace around a repeatable canvas-native loop:
Prompt → Generate → Image → Reference → Prompt. Prompt and image records live in
the tldraw store, remain freely transformable, and keep lightweight semantic
connections while the existing NewAPI panel remains available as a global control.

## Tech Stack

- React 19.2, TypeScript 6, Vite 8
- tldraw 5.4 custom shapes, assets, arrows, and bindings
- Tailwind CSS 4 and existing shadcn/ui primitives
- Existing browser-only NewAPI client

## Commands

- Develop: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Preview: `npm run preview`

## Project Structure

- `src/features/canvas/` — custom node shapes and canvas commands
- `src/components/workspace/` — canvas shell, toolbar, status and panels
- `src/features/ai/` — NewAPI state, generation, and result integration
- `docs/` — product and implementation specifications

## Code Style

```ts
editor.createShape<PromptShape>({
  id,
  type: PROMPT_SHAPE_TYPE,
  x,
  y,
  props: createPromptProps(),
})
```

Use the `@/` alias, keep shape mutations in canvas commands, keep shape data in
tldraw, use Simplified Chinese UI copy, and use theme utilities instead of raw
colors.

## Testing Strategy

The repository has no unit-test runner. Each vertical slice is checked with the
TypeScript production build and lint. The completed workspace is verified in an
isolated real browser for Prompt creation/editing, selection, pan/zoom,
undo/redo, local image drop, reference creation, and console cleanliness.

## Boundaries

- Always: keep tldraw as the only canvas store; use NewApiClient; create images
  through assets and `createShapeForAsset`; preserve undo/redo and selection.
- Ask first: add runtime dependencies, add a backend, or change NewAPI contracts.
- Never: add billing/credits, log API keys, create a second editor/store, or hide
  the required tldraw production license watermark.

## Success Criteria

- Prompt and image nodes are custom tldraw shapes with direct canvas controls.
- Prompt generation inserts image nodes beside the source and binds a relation.
- “作为参考图” creates a new pre-linked Prompt node.
- Local image drop creates an image node.
- Toolbar and empty state prioritize Prompt/image creation.
- Existing global AI panel, properties, NewAPI settings, zoom, pan, selection,
  undo, redo and downloads remain available.
- `npm run build` and `npm run lint` pass.

## Implementation Order

1. Prompt custom shape and data model
2. Image custom shape and data model
3. Prompt creation, editing, and keyboard/double-click entry points
4. Prompt generation and automatic image insertion
5. Bound generation/reference relations
6. Image-to-reference Prompt flow and local image drop
7. Toolbar, panel, hover actions, empty state, and visual polish

## Open Questions

None blocking. The first release uses explicit “作为参考图” as the required
reference interaction; direct thumbnail dropping into a Prompt can be added
later without changing the stored model.
