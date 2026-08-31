---
name: component-development
description: Screenshot-driven development workflow for building or significantly modifying UI components in apps/mobile using Playwright component tests. Use when asked to build, restyle, or rework a TTLive mobile component, screen section, or control — especially when a mock design is provided. Covers writing stories, focused specs, capturing and examining screenshots, and comparing against mock designs before declaring the component done.
---

# Develop a mobile component (screenshot-driven)

Primary UI app: `apps/mobile`. Component tests use the story-gallery setup:
stories in `*.story.tsx` next to the component, specs in `tests/components/`,
gallery served by the Vite dev server (`playwright/gallery/`), config
`playwright.ct.config.ts`.

## Workflow

1. **Story first.** Before or alongside the component, write
   `src/.../MyComponent.story.tsx` with **one export per scenario**
   (default, empty, loading, error, extreme data, interactive). The story owns
   all providers, mock data, and callbacks. Record observable callback effects
   into hidden inputs:
   ```tsx
   <form hidden><input data-testid="click-count" readOnly value={String(count)} /></form>
   ```
   Stories render inside the app ThemeProvider with full design-system styles.
   For full-screen layouts, add `className="gallery-fill"` to the story wrapper
   to opt out of the centered canvas.

2. **Spec.** Add `tests/components/my-component.spec.ts` asserting the states
   and interactions. Reference working example: `tests/components/number-stepper.spec.ts`.
   - Story id: path under `src/` without `.story.tsx`, plus export name —
     `mount('ui/ttlive/components/NumberStepper/Default')`; unique suffixes like
     `'NumberStepper/Default'` also work.
   - Mock network with `page.route()` **before** `mount()` (registration order).
   - For visual checks: `await expect(component).toHaveScreenshot('mock-name.png')`.

3. **Run only this spec while iterating** — never the whole suite:
   ```bash
   cd apps/mobile && pnpm exec playwright test -c playwright.ct.config.ts tests/components/my-component.spec.ts --reporter=line
   ```
   (add `--ui` or `--headed` when the user wants to watch.)

4. **Examine the screenshots yourself.** After a run, read the screenshot
   artifacts (`test-results/**/…*.png` and `*-actual.png` on failure) with the
   read tool and actively look for: layout/alignment issues, spacing rhythm vs
   the design system, overflow/clipping at the viewport size, touch target
   size, dark/light theme regressions, empty/loading/error states, text
   truncation. Fix, re-run, re-examine until clean.

5. **If a mock design was provided** (image file or URL): read it, capture the
   story screenshot at the mock's viewport, compare side by side, list
   concrete differences, fix, repeat until they match.

6. **Final regression only at the end:** `pnpm typecheck` and the focused
   suites appropriate for the change (see AGENTS.md stop rule).

## Notes

- Do not duplicate coverage already provided by existing Vitest + Testing
  Library tests; CT adds real-browser rendering, interaction, and visuals.
- Keep the gallery contract documented in `playwright/gallery/main.tsx`.
- If the playwright dev-server port clashes, set `MOBILE_DEV_PORT`.