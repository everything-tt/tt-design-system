# Mobile/PWA interaction and navigation foundations

The design system owns reusable browser/mobile mechanics; the application keeps router and domain state.

## Compatibility-safe viewport migration

Import the package stylesheet once and render application screens inside `AppShellPage`.

Existing consumers keep **document/window scrolling by default**. This is deliberate: TT apps that already use `window.scrollY` / `window.scrollTo()` do not change behaviour merely by upgrading the package.

Opt into the owned mobile viewport when the app is ready to migrate its navigation integration:

```tsx
<AppShellPage viewport="contained">
  <AppHeader title="Players" />
  <AppHeaderSpacer />
  <AppPageContent restoreScroll restorationId="players">
    ...
  </AppPageContent>
</AppShellPage>
```

`viewport="contained"` creates the `100dvh` flex viewport. `AppPageContent` becomes the canonical contained scroller when `restoreScroll` is enabled, or when `scrollable` is explicitly true.

Legacy screens that still scroll the document can use `useWindowScrollRestoration` without adopting contained mode.

## Mobile interaction defaults

Inside `AppShellPage`, ordinary application chrome is non-selectable and suppresses touch callout/tap flash. Inputs, textareas, selects and editable content remain selectable. Copyable text opts in explicitly:

```tsx
<SelectableText>Registration number: 123456</SelectableText>
```

The package keeps pinch zoom untouched, uses safe-area helpers, prevents unintended image dragging, contains overscroll in owned scrollers, and preserves visible `:focus-visible` treatment.

`Pressable` is the low-level native-button primitive. `AppButton`, segmented controls, toggle controls and external-link actions meet the 44px touch-target baseline; `IconButton` uses a 48px target and requires an accessible name.

## Router-agnostic history restoration

Wrap the application once:

```tsx
<ScrollRestorationProvider
  navigationKey={location.key}
  navigationType={logicalNavigationType}
>
  <App />
</ScrollRestorationProvider>
```

The provider intentionally knows nothing about React Router or another router. `navigationType` is the **logical navigation operation**, not necessarily the raw router event:

- `PUSH` — new entry; reset the target to the top.
- `POP` — Back or Forward; restore that history entry.
- `REPLACE` — same logical history entry with a new key; migrate the existing visual snapshot to the replacement key and restore/preserve it without creating a duplicate entry.

React Router's `useNavigationType()` is sufficient when browser history operations map directly to product navigation. Custom per-tab stacks must classify their own semantics. For example, if a product implements visible “Back” with `navigate(previousPath, { replace: true })`, report that operation to this provider as `POP`, because it is logically Back even though React Router reports `REPLACE`.

While mounted, the provider temporarily sets `window.history.scrollRestoration = 'manual'` and restores the previous setting on cleanup.

## Stable anchors and relative offsets

Use stable logical identities rather than relying only on raw pixels. `ListItem` has a first-class `scrollAnchorId` so list structure remains unchanged:

```tsx
<List>
  {players.map((player) => (
    <ListItem
      key={player.id}
      scrollAnchorId={`player:${player.id}`}
      title={player.name}
    />
  ))}
</List>
```

For arbitrary elements, use `ScrollAnchor`. When the child must remain a direct list/grid child, use `asChild` so no wrapper is added:

```tsx
<ScrollAnchor anchorId={`fixture:${fixture.id}`} asChild>
  <FixtureRow fixture={fixture} />
</ScrollAnchor>
```

The child must forward normal DOM attributes for `asChild` to work.

Snapshots store raw `scrollTop` plus the first visible stable anchor and its relative viewport offset. Restoration prefers the logical anchor, then falls back to pixels and finally clamps safely if content has become shorter.

## Progressive and virtualized lists

The package's progressively rendered `List` remains paginated by default. During restoration, it registers with the surrounding `AppPageContent` / `ScrollArea` and automatically expands far enough to mount a requested `scrollAnchorId`. The restoration loop then retries the ordinary anchor calculation on the next animation frame.

Server-paged or virtualized lists can provide their own adapter:

```tsx
<AppPageContent
  restoreScroll
  restorationId="ranking"
  restorationAdapter={{
    ensureAnchorVisible: (anchorId) => {
      const index = indexByPlayerId.get(anchorId);
      if (index == null) return false;
      virtualizer.scrollToIndex(index);
      return true;
    },
  }}
>
  ...
</AppPageContent>
```

Return `false` if the adapter cannot reveal that anchor; this allows immediate pixel fallback. A void/true return means reveal work was requested and bounded retries should continue.

## Async readiness

Do not report content as ready while only a short loading skeleton is mounted:

```tsx
<AppPageContent
  restoreScroll
  restorationId="players"
  contentReady={!playersQuery.isLoading}
>
  {playersQuery.isLoading ? <PlayersSkeleton /> : <PlayersList />}
</AppPageContent>
```

Important search/filter/tab/domain state must be reconstructed before `contentReady` becomes true. Once ready, restoration runs before paint where possible and performs only a bounded number of layout retries.

## Nested scroll containers

Use a stable id for every independently restorable region:

```tsx
<ScrollArea restoreScroll restorationId="schedule-conflicts">
  ...
</ScrollArea>
```

Nested areas own independent snapshots even when they share the same router history entry.

## Window-level scrolling

For a legacy document-scrolling screen:

```tsx
useWindowScrollRestoration({
  restorationId: 'legacy-results',
  contentReady: !loading,
});
```

This makes migration incremental instead of forcing the new contained viewport on every existing screen at once.

## Inputs

`AppInput` forwards native input properties so each product can request the correct mobile keyboard/action:

```tsx
<AppInput
  type="search"
  inputMode="search"
  enterKeyHint="search"
  autoComplete="off"
/>
```

Numeric scores, email addresses and telephone inputs should set their own semantic `type`, `inputMode`, `enterKeyHint` and autocomplete policy.

## Overlay Back integration

`BottomSheet` and `AppDrawer` use Radix Dialog for focus trapping, inert-background behaviour, Escape handling and scroll locking. The consuming navigation layer can let an open overlay consume Android/browser Back before page navigation:

```tsx
const consumeOverlayBack = useOverlayBackHandler(sheetOpen, () => setSheetOpen(false));

function onProductBack() {
  if (consumeOverlayBack()) return;
  goBackInActiveTab();
}
```

The design system deliberately does not import or control a router.

## Responsibility boundary

The design system owns scroll snapshots, stable anchors, progressive-list reveal, readiness/retry, browser restoration coordination, viewport/safe-area mechanics, touch interaction defaults, and overlay primitives.

The application owns history keys, logical PUSH/POP/REPLACE classification, search/filter/tab/domain state, the point at which route data is ready, and any server-paging or virtualizer item-id lookup.

## Runnable acceptance demo

The showcase `#mobile` mode uses the real contained viewport and the real default progressive `List` behaviour. Scroll beyond the first 20 rows, open a player, then Back. With async return enabled, the route first renders a loading state; once ready, the list expands to mount the saved deep anchor and restores the same logical row plus relative offset. The same screen also demonstrates nested restoration, selectable text, mobile input semantics, and overlay Back consumption.
