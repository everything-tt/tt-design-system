# Component Selection Guide

Choose semantics first. This guide is intentionally compact; verify exact props against the installed package types.

| Need | Prefer | Notes |
|---|---|---|
| Primary/secondary/destructive action | `AppButton` | Use a real button action. Use `AppButtonLink` only for true navigation/link semantics. |
| Icon-only action | `IconButton` | Requires an accessible label and uses the preferred larger touch target. |
| Unstyled/custom button interaction | `Pressable` | Use sparingly; do not recreate `AppButton` with it. |
| Persistent on/off/filter state | `AppToggleButton` | `pressed` should reflect real state and `aria-pressed`. |
| Mutually exclusive compact options | `SegmentedToggle` | Good for modes/tabs within a page, not route navigation by default. |
| Text/search/mobile keyboard input | `AppInput` | Set `type`, `inputMode`, `enterKeyHint`, and `autoComplete` from domain intent. |
| Search input plus actions | `SearchToolbar` / `AppSearchInput` | Prefer the higher-level composition already used by the product. |
| Ordinary data list | `List` or `DesignList` + `ListItem` | Use `leading`, `title`, `subtitle`, `trailing`; keep stable keys. |
| Completed match/result record | `MatchRecordRow` | Consumer supplies oriented score, outcome, metadata, routing and actions. |
| Status/short label | `Pill` | Do not duplicate an outcome already communicated by a result component. |
| Win/loss/draw/form marker | `OutcomeBadge` | Use for outcome/form semantics, not arbitrary labels. |
| Avatar/identity support | `Avatar` / `DesignAvatar` | Prefer shared sizing/treatment. |
| Content surface/card | `Surface`, `AppCard` | Pick the public semantic surface before creating page-local card CSS. |
| Section hierarchy | `PageSection`, `SectionHeader` | Keep page-specific placement in app code. |
| Entity summary/hero | `EntityHero` | Use for an entity's main identity and highlights. |
| Metrics | `MetricGrid` | Consumer owns values and business meaning. |
| Empty/error feedback | `EmptyState`, `ErrorState` | Use explicit status/error semantics. |
| Bottom mobile overlay | `BottomSheet` | Radix-backed focus/scroll behaviour is already included. |
| Navigation drawer | `AppDrawer` | Prefer over app-local drawer implementations. |
| Context/action menu | `ActionMenu` | Use when the shared menu semantics fit. |
| Confirm destructive/high-impact action | `ConfirmationModal` | Keep domain confirmation wording in the application. |
| App shell/header/content | `AppShellPage`, `AppHeader`, `AppPageContent` | Document viewport is compatibility default; contained PWA viewport is explicit. |
| Bottom navigation | `AppTabBar` | Existing compatibility component; application owns route/tab stacks. |
| Independently scrolling region | `ScrollArea` | If `restoreScroll` is enabled, always provide a stable `restorationId`. |
| Stable scroll anchor | `ListItem scrollAnchorId` or `ScrollAnchor asChild` | Avoid wrapper DOM around structure-sensitive list/grid children. |
| Copyable text inside non-selectable app chrome | `SelectableText` | Keep ordinary app chrome non-selectable. |

## Legacy exports

`AppListGroup`, `AppListItem`, `AppPlayerList`, `AppSidebar`, `AppTabBar`, `AppCard`, and related compatibility components may exist because older TT screens depend on them. Do not automatically copy their usage into new work when a current generic primitive fits better.

## When no component fits

Do not start by copying markup and `.tt-*` styles into the consumer.

1. Compose current public primitives.
2. If the gap is feature-specific, add app-owned composition around those primitives.
3. If the gap is reusable across TT products, add a bounded public API to the design-system package, with tests and showcase coverage.
