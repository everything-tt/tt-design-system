---
name: tt-design-system
description: Implement, redesign, refactor, or review UI in applications that consume @everything-tt/tt-players-design-system. Use this skill to choose the right public primitive, keep app code within the design-system boundary, apply mobile/PWA interaction and navigation-restoration patterns correctly, avoid styling component internals, and decide when a reusable improvement belongs upstream in the design-system package.
---

# TT Design System

Use the shared design system as the default UI vocabulary for TT applications. Prefer composition of public package APIs over recreating branded controls, list rows, shell behaviour, overlays, or mobile interaction rules in product code.

## Source of truth

Use this order when the skill, application code, and package appear to disagree:

1. The installed package's public TypeScript declarations and exports.
2. The installed package README and documented public props.
3. This skill and its references.
4. Existing application usage, after checking that it is not legacy code.

In the design-system repository itself, `src/index.ts` and the component source are the public-API source of truth. In a consumer, inspect `@everything-tt/tt-players-design-system` before inventing a prop or importing an internal file.

Do not copy an internal component implementation into an app because a public API is missing. If the need is reusable across TT products, change the design system upstream and consume the new public API.

## Workflow

1. Identify the UI intent before choosing a component:
   - page/shell structure
   - action or toggle
   - list/data presentation
   - summary/metric/state
   - overlay
   - search/input
   - navigation or scroll restoration
2. Read [references/component-selection.md](references/component-selection.md) and choose the narrowest public primitive that owns the required semantics.
3. Check the package API rather than guessing props.
4. Keep product state, routing, fetching, and domain decisions in the application.
5. Implement page-specific layout by composing public components and app-owned wrappers.
6. For contained mobile shells or Back/Forward restoration, read [references/mobile-pwa-restoration.md](references/mobile-pwa-restoration.md) before coding.
7. Run the consuming project's typecheck/tests/build and inspect the affected mobile states.

## Design-system boundary

The design system owns reusable:

- component semantics and internal DOM structure;
- branded internal geometry and typography;
- design tokens and standard visual states;
- touch-target sizing and focus-visible behaviour;
- safe-area and overlay mechanics;
- reusable page/list/control composition;
- scroll-restoration mechanics when the app supplies navigation identity and readiness.

The application owns:

- feature/domain state and business rules;
- API/data fetching and mutations;
- route definitions and router calls;
- search text, filters, selected tabs, query parameters, expanded state, and selections;
- deciding when async content is ready to restore;
- page-specific placement and feature-specific composition.

### CSS rule

App CSS may style app-owned page wrappers and use documented/public CSS custom properties. Do **not** reach into shared component internals with selectors such as:

```css
.my-page .tt-list-item__title { ... }
.my-page .tt-sheet__body { ... }
```

Do not depend on the package's internal DOM hierarchy or Tailwind/shadcn implementation details. If a reusable component needs a new styling/configuration point, add a bounded prop or public CSS variable upstream.

## Prefer semantic public components

Use branded public components before low-level primitives:

- `AppButton` for ordinary actions.
- `IconButton` for icon-only actions; always provide its accessible label.
- `Pressable` only when you need a semantic button interaction that does not fit the branded `AppButton` presentation.
- `AppToggleButton` for persistent pressed/on-off state.
- `SegmentedToggle` for mutually exclusive compact choices.
- `AppInput` / `SearchToolbar` for mobile-aware text/search input.
- `List` / `DesignList` + `ListItem` for ordinary rows.
- `MatchRecordRow` for compact completed match/result records.
- `Pill` for labels/status chips and `OutcomeBadge` for outcome/form indicators.
- `Surface`, `PageSection`, `SectionHeader`, `EntityHero`, and `MetricGrid` for composition and hierarchy.
- `EmptyState` / `ErrorState` for feedback states.
- `BottomSheet`, `AppDrawer`, `ActionMenu`, and `ConfirmationModal` for overlays.

Use `@everything-tt/tt-players-design-system/primitives` only when building or extending reusable design-system-level behaviour. Product pages should rarely need the low-level shadcn/Radix exports directly.

## Mobile and accessibility defaults

Preserve the package's interaction defaults instead of reimplementing them in app CSS:

- interactive touch targets should remain at least 44px; icon-only controls use the 48px target where provided;
- keep `:focus-visible` behaviour;
- use native button/link semantics instead of clickable `div`s;
- do not disable pinch zoom;
- do not add app-wide `user-select`, touch-callout, overscroll, or viewport hacks when the shell already owns them;
- use `SelectableText` when app chrome contains text that users should be able to copy;
- give icon-only actions an accessible name;
- pass meaningful `type`, `inputMode`, `enterKeyHint`, and `autoComplete` values to `AppInput` rather than forcing one keyboard policy globally.

## Lists and stable context

Use stable React keys based on domain identity. For restorable long lists, give the row itself a stable anchor:

```tsx
<ListItem
  key={player.id}
  scrollAnchorId={`player:${player.id}`}
  title={player.name}
  onClick={() => openPlayer(player.id)}
/>
```

Prefer `scrollAnchorId` on `ListItem` over wrapping rows. If another structure-sensitive composition needs an anchor, use `ScrollAnchor asChild` so direct-child list/grid selectors remain intact.

Keep the default progressive rendering for large in-memory `List`s unless the app is already server-paging or virtualizing the data. Use `paginate={false}` for server-paged lists where the server owns incremental loading.

## Navigation restoration

Do not blindly map router implementation details to user intent. `ScrollRestorationProvider` expects a stable history-entry key and the product's **logical** navigation operation:

- `PUSH`: a new forward entry; reset the new page to top.
- `POP`: Back or Forward to an existing entry; restore its context.
- `REPLACE`: replace the current entry while preserving its visual context.

A custom tab stack may implement a user-visible Back with `navigate(..., { replace: true })`. That is still logical `POP` for restoration purposes.

Adopt the contained viewport intentionally. Existing apps may remain on document/window scrolling until migrated. Do not switch a shared shell to contained scrolling without also integrating its scroll consumers, header behaviour, and navigation restoration.

## Overlays

Prefer the shared Radix-backed overlays. They already own focus containment, Escape handling, background inertness/scroll locking, safe-area geometry, and shared mobile presentation.

If browser/Android Back should close an open overlay before leaving the page, integrate `useOverlayBackHandler` at the app/router boundary. Keep the design-system component router-neutral.

## Reuse decision

Before adding new UI code in an application, ask:

1. Does a public design-system component already cover the semantics?
2. Can two or more public components be composed without styling their internals?
3. Is the requested behaviour product-specific or generally useful across TT apps?

If it is generally useful and the current API cannot express it cleanly, implement it in `tt-design-system`, add tests/showcase coverage there, publish a new package version, then consume it from the app.

Do not create parallel app-local variants such as `MyButton`, `MobileListRow`, `CustomBottomSheet`, or copied `.tt-*` CSS unless the behaviour is genuinely feature-specific.

## Verification checklist

Before declaring a UI change complete:

- imports come from the package's public entry points;
- package styles are imported once at the app entry point;
- no app CSS targets shared component internals;
- buttons/links/toggles use correct semantics and accessible names;
- touch targets and focus-visible states remain intact;
- loading/empty/error states use shared patterns where applicable;
- long-list anchors use stable domain IDs;
- contained scrolling is intentional rather than accidental;
- Back/Forward restoration uses logical navigation semantics and correct `contentReady` timing;
- overlays close and restore focus correctly;
- the consuming project's typecheck, tests, and production build pass;
- significant reusable behaviour has tests/showcase coverage in the design-system repository.

## Package-managed copy

When this skill is installed into a consuming project's `.agents/skills/tt-design-system`, it is managed by `@everything-tt/tt-players-design-system`. Do not edit the generated copy to establish a new design-system rule. Change the upstream skill in the design-system repository so the rule ships with the package and remains consistent across consumers.
