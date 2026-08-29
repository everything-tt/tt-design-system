# TT Players Design System

Reusable React primitives for TT-branded mobile-first PWAs. The package uses shadcn source conventions and Radix behaviour beneath a stable TT semantic API. Components stay portable: no feature data fetching, route knowledge, or direct product state ownership.

## Module boundaries

- `components/AppButton.tsx` — canonical button primitives. Use `AppButton` for actions; keep `AppButtonLink` only for true link-styled navigation.
- `components/List.tsx` — current generic list primitive with slots (`leading`, `title`, `subtitle`, `trailing`). Prefer this over legacy row components for ordinary new lists.
- `components/MatchRecordRow.tsx` — canonical compact completed-result row. It owns the leading score tile, title/metadata hierarchy, primary row action, and zero to two direct secondary actions. Consumers provide an already-oriented score model and all business behaviour.
- `components/States.tsx` — `HeroCard`, `SectionHeader`, `EmptyState`, `ErrorState`.
- `components/BottomSheet.tsx` and `components/AppDrawer.tsx` — TT mobile overlays composed from the shadcn/Radix Dialog foundation. Radix owns focus, inertness, Escape handling and restoration; TT owns geometry and safe areas.
- `components/ui/` — owned shadcn-style low-level source (`Button`, `Card`, `Input`, `Switch`, `ToggleGroup`, `Dialog`). Product screens should normally use the TT wrappers above.
- `styles/index.css` — the single portable stylesheet entry point, exported as `@everything-tt/tt-players-design-system/styles.css`.
- `components/OutcomeBadge.tsx`, `Pill.tsx`, `SegmentedToggle.tsx`, `ExternalLinkButton.tsx` — small semantic controls.
- `theme/ThemeContext.tsx` — theme state only. It reads/writes the configured theme storage key and body classes, but owns no app-specific settings.
- `lib/utils.ts` — canonical shadcn-compatible `cn` helper (`clsx` + `tailwind-merge`). `utils/cx.ts` remains a compatibility alias.

## `MatchRecordRow`

Use `MatchRecordRow` for a compact completed player match or team fixture. Do not use it for standings, rankings, upcoming fixtures, form strips, fixture hero scores, or the detailed two-sided rubber scorecard.

```tsx
import { MatchRecordRow } from '@everything-tt/tt-players-design-system';

<MatchRecordRow
  score={{
    value: '3–1',
    outcome: 'win',
    ariaLabel: 'Won 3 games to 1',
  }}
  title="Lucy Elliott"
  metadata={['County Championships Junior', '11 Apr 2026']}
  onClick={openOpponent}
  actions={[
    {
      iconClassName: 'fa fa-pen',
      label: 'Quick Journal',
      onClick: openJournal,
      tone: 'accent',
    },
    {
      iconClassName: 'fa fa-calendar',
      label: 'View fixture',
      onClick: openFixture,
    },
  ]}
/>
```

The component accepts detailed values such as `3–1`, outcome-only values `W`, `L`, or `D`, and unknown `—`. The consumer must:

- put the relevant player or team score first;
- choose `win`, `loss`, or `neutral`;
- provide a complete spoken `ariaLabel`;
- decide routing and which direct actions are available.

The component deliberately does not parse result strings or know about players, teams, fixtures, tournaments, or journals.

## Legacy compatibility

These components remain exported for older mobile screens, but new work should prefer the current primitives above:

- `AppListGroup` / `AppListItem`
- `AppPlayerList`
- `AppSidebar`
- `AppTabBar`
- `AppCard` / `AppMessageCard`

Legacy components should still follow action semantics: buttons for in-app actions, anchors only for real URLs.

## Reuse rules

1. **No fake links.** Components must not render `href="#"` for actions. Use `<button type="button">` unless a real `href` is supplied.
2. **No feature coupling.** Do not import mobile queries, navigation, storage keys, or page components into this package.
3. **No duplicate semantics.** Use `MatchRecordRow` for compact completed records; do not add a separate W/L badge beside its score. Use `OutcomeBadge` for form and summary indicators, and `Pill` for compact labels.
4. **Token-first styling.** Components emit stable class hooks and rely on the package theme/tokens for visuals. Tailwind utilities are an internal implementation detail. Avoid inline styles except dimensions explicitly passed as props, such as drawer width or sheet height.
5. **Accessible defaults.** Dialogs need `role="dialog"`, `aria-modal`, focus handling, and Escape close. Match scores require complete spoken labels. Status/error states need `role="status"` or `role="alert"`.
6. **Do not style internals from product code.** App CSS may place component roots and use documented public variables, but should not target `.tt-*` descendant implementation classes. Add a bounded public prop/variable upstream when reusable configuration is missing.

## Import pattern

```tsx
import {
  AppButton,
  BottomSheet,
  List,
  ListItem,
  MatchRecordRow,
  OutcomeBadge,
} from '@everything-tt/tt-players-design-system';
```

Consumers should import the shared primitives directly from `@everything-tt/tt-players-design-system`.

## App setup

Import the package stylesheet once at the application entry point:

```tsx
import '@everything-tt/tt-players-design-system/styles.css';
```

The consuming Vite app enables Tailwind v4 through `@tailwindcss/vite`. Preflight is intentionally not loaded because TT apps own their platform reset and legacy migration boundary.

Advanced compositions may import low-level owned primitives from `@everything-tt/tt-players-design-system/primitives`, but reusable branded UI belongs in this package rather than in each app.

## PWA update policy

The PWA runtime keeps service-worker timing separate from application safety. Consumers choose the update policy while the application owns the `canReload` signal; the design system does not infer safety from route names.

```tsx
import {
  PWAProvider,
  PWAPrompts,
} from '@everything-tt/tt-players-design-system/pwa';

<PWAProvider
  updateStrategy="auto-when-safe"
  canReload={canReload}
  unsafeUpdateBehavior="prompt"
>
  <App />
  <PWAPrompts
    appName="TT Players"
    updated={{ message: 'TT Players has been updated' }}
  />
</PWAProvider>
```

Supported strategies are:

- `prompt` — backwards-compatible default. Show the update sheet and let the user decide when to reload.
- `auto` — activate the downloaded update immediately and reload the current page.
- `auto-when-safe` — update immediately when `canReload` is true. When false, `unsafeUpdateBehavior="prompt"` shows the normal update choice, while `unsafeUpdateBehavior="wait"` stays silent until the application becomes safe.

The service worker still uses the prompt-style Vite registration so runtime policy controls activation. Before activation the provider stores a session marker; after the service-worker reload, `PWAUpdateNotice` consumes that marker and shows a one-time status notice. Existing consumers that do not pass the new policy props keep the previous prompt-before-update behaviour.

Typical read-only routes can report `canReload={true}`. Forms, editors, builders, or other screens with meaningful unsaved/transient state should derive the signal from that state rather than from a route-name convention.

## Agent skill

The published package includes a package-managed coding skill for best-practice design-system usage. When dependency lifecycle scripts are permitted, `postinstall` copies it to:

```text
.agents/skills/tt-design-system/
```

The installer is idempotent and only overwrites a directory that is already marked as package-managed. If the destination is unrelated or has local edits, automatic installation leaves it untouched and prints a warning.

Some package managers or CI policies disable dependency lifecycle scripts. In that case install/update the same skill explicitly after adding the package:

```sh
pnpm exec tt-design-system install-skill
```

Or with npm:

```sh
npm exec tt-design-system -- install-skill
```

Use `--project-root <path>` when the command is run from outside the repository root. `--force` intentionally replaces an existing/local copy and should only be used when you want the package-managed version. Set `TT_DESIGN_SYSTEM_SKIP_SKILL_INSTALL=1` to disable automatic skill copying.

The upstream source is `.agents/skills/tt-design-system` in this repository. Consumer copies should be treated as generated package content; improve the upstream skill when a new reusable practice is established.

## Showcase app

The repository includes a checked-in Vite component lab at [`examples/showcase`](./examples/showcase). It consumes the package through the pnpm workspace, so local edits to `src/` are available without publishing a package version.

```sh
pnpm install
pnpm demo
```

Use `pnpm demo:typecheck` and `pnpm demo:build` for focused validation. The lab covers foundations, theme switching, controls, list composition, feedback states, and the Radix-backed bottom sheet.

## Package distribution

This is the standalone source repository for the shared TT design system. The package is published to the `everything-tt` GitHub Packages organization registry as `@everything-tt/tt-players-design-system`.

```json
{
  "dependencies": {
    "@everything-tt/tt-players-design-system": "^0.1.16"
  }
}
```

Configure the `@everything-tt` scope to use GitHub Packages:

```ini
@everything-tt:registry=https://npm.pkg.github.com
```

```sh
pnpm add @everything-tt/tt-players-design-system
```

External imports use the published package name:

```tsx
import { AppButton } from '@everything-tt/tt-players-design-system';
import '@everything-tt/tt-players-design-system/styles.css';
```

The package workflow runs tests, builds the declaration and JavaScript artifacts, inspects the tarball, and verifies a Vite consumer. Pull requests and pushes to `main` run validation; publishing an immutable version is an explicit workflow dispatch with the publish input enabled, so every releasable package change must bump the version first.

The package uses shadcn source conventions and Radix behaviour beneath a stable TT semantic API. It intentionally has no application routing, feature data fetching, or product-state ownership.
