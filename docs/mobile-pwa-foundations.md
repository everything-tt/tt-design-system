# Mobile/PWA interaction and navigation foundations

The design system owns browser/mobile mechanics; the application keeps router and domain state.

## App shell and mobile interaction defaults

Import the package stylesheet once and render application screens inside `AppShellPage`. The shell is a `100dvh` flex viewport, marks ordinary application chrome as non-selectable, contains page overscroll, respects device safe areas, and keeps pinch zoom untouched.

`AppPageContent` is the canonical page scroll container by default. Use `scrollable={false}` only when a screen deliberately owns another scrolling model.

```tsx
<AppShellPage>
  <AppHeader title="Leagues" />
  <AppHeaderSpacer />
  <AppPageContent>...</AppPageContent>
</AppShellPage>
```

Copyable content opts back into normal browser selection:

```tsx
<SelectableText>Registration number: 123456</SelectableText>
```

Inputs, textareas and editable content remain selectable automatically.

## Router-agnostic history restoration

Supply only the history-entry identity and navigation operation from the application's router:

```tsx
<ScrollRestorationProvider
  navigationKey={location.key}
  navigationType={navigationType}
>
  <App />
</ScrollRestorationProvider>
```

The policy is explicit:

- `PUSH` — reset a new screen to the top.
- `POP` — restore the snapshot for that history entry. This covers Back and Forward.
- `REPLACE` — preserve the current visual position and discard the superseded restoration entry.

While mounted, the provider temporarily sets `window.history.scrollRestoration = 'manual'` and restores the previous browser setting on cleanup. This prevents native and SPA restoration from fighting each other.

### Page restoration

```tsx
<AppPageContent restoreScroll restorationId="leagues">
  {leagues.map((league) => (
    <ScrollAnchor key={league.id} anchorId={`league:${league.id}`}>
      <LeagueRow league={league} />
    </ScrollAnchor>
  ))}
</AppPageContent>
```

Snapshots store both raw `scrollTop` and the first visible stable anchor plus its relative offset. Restoration prefers the anchor, falls back to the pixel position, and finally clamps safely if the old document height can no longer be reached.

### Async list restoration

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

Once `contentReady` is true, restoration runs before paint where possible and performs a bounded number of animation-frame layout retries. It never polls indefinitely.

### Nested scroll containers

Use a stable restoration id for every independently scrolling region:

```tsx
<ScrollArea restoreScroll restorationId="schedule-conflicts">
  ...
</ScrollArea>
```

The shell page and nested `ScrollArea` snapshots are independent even though they share the same router history entry.

### Window-level scrolling

Legacy screens that still use document/window scrolling can opt in without changing the router contract:

```tsx
useWindowScrollRestoration({
  restorationId: 'legacy-results',
  contentReady: !loading,
});
```

### Virtualized lists

The core does not depend on a virtualizer. Supply an adapter that makes a missing anchor mountable; the design system then retries ordinary anchor restoration:

```tsx
<ScrollArea
  restoreScroll
  restorationId="ranking"
  restorationAdapter={{
    ensureAnchorVisible: (anchorId) => {
      const index = indexByPlayerId.get(anchorId);
      if (index != null) virtualizer.scrollToIndex(index);
    },
  }}
>
  ...
</ScrollArea>
```

## Touch controls and inputs

`AppButton` uses touch-friendly pointer behaviour and a minimum 44px hit target. `IconButton` requires an accessible label and uses the preferred 48px icon target.

```tsx
<IconButton ariaLabel="More actions" onClick={openMenu}>
  <MoreHorizontal aria-hidden="true" />
</IconButton>
```

`AppInput` forwards native input properties so the application can describe the correct mobile keyboard and action instead of the design system guessing domain intent:

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

`BottomSheet` and `AppDrawer` continue to use Radix Dialog for focus trapping, inert background behaviour, Escape handling and scroll locking. Their package styles contain internal overscroll and safe-area behaviour.

The consuming router can give Android/browser Back priority to an open overlay without the design system knowing about route APIs:

```tsx
const consumeOverlayBack = useOverlayBackHandler(sheetOpen, () => setSheetOpen(false));

function onRouterBack() {
  if (consumeOverlayBack()) return;
  navigate(-1);
}
```

## Responsibility boundary

The design system owns:

- scroll position and stable scroll anchors;
- restoration lifecycle/readiness and bounded retry;
- page/nested/window scroll-container mechanics;
- browser `scrollRestoration` coordination;
- viewport, safe-area, touch, selection and overlay interaction behaviour.

The consuming application/router owns:

- route/history keys and `PUSH` / `POP` / `REPLACE` classification;
- search text, filters, selected tabs and query parameters;
- domain-specific expanded/selected state;
- the point at which async route data is ready to restore;
- optional virtualizer item-id to index lookup.

Important list state should be restored before `contentReady` becomes true. Where practical, put that state in the URL or history state so Back reconstructs the same list before the design system restores its visual position.
