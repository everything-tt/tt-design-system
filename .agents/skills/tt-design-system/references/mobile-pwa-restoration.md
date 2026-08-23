# Mobile/PWA and Navigation Restoration

Use this reference when a task involves app-shell scrolling, long lists, list → detail → Back, nested scrollers, custom tab stacks, async data, virtualized lists, or overlays that should consume system/browser Back.

## Viewport migration

`AppShellPage` keeps the legacy document/window scrolling model by default so existing consumers that use `window.scrollY` / `window.scrollTo()` continue to work.

Use contained mode only when the route/app intentionally adopts the design-system-owned viewport:

```tsx
<AppShellPage viewport="contained">
  <AppHeader title="Players" />
  <AppHeaderSpacer />
  <AppPageContent restoreScroll restorationId="players" contentReady={ready}>
    {content}
  </AppPageContent>
</AppShellPage>
```

Do not turn on contained mode without checking existing scroll listeners, collapsible headers, tab navigation and application restoration code.

## Provider contract

Wrap the routed application once and pass a stable history-entry identity plus the **logical** navigation operation:

```tsx
<ScrollRestorationProvider
  navigationKey={location.key}
  navigationType={logicalNavigationType}
>
  <App />
</ScrollRestorationProvider>
```

Policy:

- `PUSH` → new context, start at top.
- `POP` → Back/Forward to an existing context, restore it.
- `REPLACE` → move/preserve the current visual context under the replacement entry.

Do not assume `useNavigationType()` is always the logical operation. TT apps with per-tab stacks may implement logical Back through router `replace`; translate that operation to `POP` for the restoration provider.

## Async readiness

The application owns filters, search, selected tabs and domain state. Reconstruct that state before reporting content ready.

```tsx
<AppPageContent
  restoreScroll
  restorationId="league-results"
  contentReady={!query.isLoading && filtersRestored}
>
  {query.isLoading ? <ResultsSkeleton /> : <ResultsList />}
</AppPageContent>
```

Do not set `contentReady=true` while only a short skeleton or incomplete filtered list is mounted. The restoration layer uses bounded retries; readiness should mean the real logical content can be restored.

## Long lists

Give restorable rows stable domain anchors:

```tsx
<List>
  {players.map((player) => (
    <ListItem
      key={player.id}
      scrollAnchorId={`player:${player.id}`}
      title={player.name}
      onClick={() => openPlayer(player.id)}
    />
  ))}
</List>
```

The design-system `List` can progressively reveal a saved deep anchor before restoration. Keep stable keys and anchor IDs even when the visible order can change.

For a structure-sensitive element that is not `ListItem`, prefer:

```tsx
<ScrollAnchor anchorId={`fixture:${fixture.id}`} asChild>
  <FixtureRow fixture={fixture} />
</ScrollAnchor>
```

The child must accept the cloned DOM attributes needed by the anchor. Otherwise expose a stable anchor prop on the reusable component rather than adding a wrapper that breaks parent selectors/layout.

## Nested scrollers

Every independently restorable nested region needs a stable ID:

```tsx
<ScrollArea restoreScroll restorationId="schedule-conflicts">
  ...
</ScrollArea>
```

Do not generate restoration IDs from array position or transient render order.

## Virtualized/server-driven lists

Use a `ScrollRestorationAdapter` when the saved logical anchor may not be mounted. `ensureAnchorVisible(anchorId)` should make the item renderable and return `true`/`undefined` when a retry is meaningful. Return `false` when the adapter cannot reveal that anchor so restoration can use its pixel fallback immediately.

The application owns the domain-ID → virtual index/server page lookup; the design system owns the retry and final scroll positioning.

## Overlay Back priority

Shared overlays remain router-neutral. At the app boundary:

```tsx
const consumeOverlayBack = useOverlayBackHandler(sheetOpen, closeSheet);

function onBack() {
  if (consumeOverlayBack()) return;
  goBackInActiveTab();
}
```

Do not put router imports into `BottomSheet`, `AppDrawer`, or other shared components to solve product navigation.

## Restoration review checks

- history entry key is stable and unique;
- logical navigation type is correct for custom tab stacks;
- app state is reconstructed before `contentReady=true`;
- row anchors use stable domain identity;
- no anchor wrapper breaks direct-child list/grid styling;
- nested `ScrollArea` has an explicit stable restoration ID;
- virtual/server adapters can reveal missing anchors or explicitly return `false`;
- existing window-scroll code is removed/migrated before enabling contained mode;
- overlay Back closes the overlay before page navigation where required.
