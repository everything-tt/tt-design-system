import { useMemo, useState } from 'react';
import {
  AppButton,
  AppHeader,
  AppHeaderSpacer,
  AppInput,
  AppPageContent,
  AppShellPage,
  BottomSheet,
  List,
  ListItem,
  Pill,
  ScrollAnchor,
  ScrollArea,
  ScrollRestorationProvider,
  SelectableText,
  Surface,
  useOverlayBackHandler,
  type NavigationType,
} from '@everything-tt/tt-players-design-system';

type DemoScreen =
  | { kind: 'list'; key: 'players-list' }
  | { kind: 'detail'; key: string; player: number };

interface MobilePwaDemoProps {
  onOpenShell: () => void;
  onOpenLab: () => void;
  onOpenSkill: () => void;
}

const players = Array.from({ length: 80 }, (_, index) => ({
  id: index + 1,
  name: `Demo player ${String(index + 1).padStart(2, '0')}`,
  club: index % 3 === 0 ? 'Rowhedge' : index % 3 === 1 ? 'Chelmsford' : 'Brentwood',
}));

const notes = Array.from({ length: 24 }, (_, index) => `Operator note ${index + 1} · nested scroll item`);

export function MobilePwaDemo({ onOpenShell, onOpenLab, onOpenSkill }: MobilePwaDemoProps) {
  const [screen, setScreen] = useState<DemoScreen>({ kind: 'list', key: 'players-list' });
  const [navigationType, setNavigationType] = useState<NavigationType>('PUSH');
  const [contentReady, setContentReady] = useState(true);
  const [asyncReturn, setAsyncReturn] = useState(true);
  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const visiblePlayers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? players.filter((player) => `${player.name} ${player.club}`.toLowerCase().includes(normalized))
      : players;
  }, [query]);

  const openPlayer = (player: number) => {
    setNavigationType('PUSH');
    setContentReady(true);
    setScreen({ kind: 'detail', key: `player-${player}`, player });
  };

  const goBack = () => {
    setNavigationType('POP');
    if (asyncReturn) {
      setContentReady(false);
      setScreen({ kind: 'list', key: 'players-list' });
      window.setTimeout(() => setContentReady(true), 700);
      return;
    }
    setContentReady(true);
    setScreen({ kind: 'list', key: 'players-list' });
  };

  const consumeOverlayBack = useOverlayBackHandler(sheetOpen, () => setSheetOpen(false));
  const simulateAndroidBack = () => {
    if (consumeOverlayBack()) return;
    if (screen.kind === 'detail') goBack();
  };

  return (
    <ScrollRestorationProvider navigationKey={screen.key} navigationType={navigationType}>
      <AppShellPage id="mobile-pwa-demo" className="mobile-pwa-demo" viewport="contained">
        <AppHeader
          title={screen.kind === 'list' ? 'Mobile / PWA foundations' : `Demo player ${screen.player}`}
          heading
          leftAction={screen.kind === 'detail' ? {
            iconClassName: 'mobile-pwa-demo__back-icon',
            position: 1,
            ariaLabel: 'Back to player list',
            onClick: goBack,
          } : undefined}
          actions={[
            {
              iconClassName: 'mobile-pwa-demo__sheet-icon',
              position: 4,
              ariaLabel: 'Open overlay Back demo',
              onClick: () => setSheetOpen(true),
            },
          ]}
        />
        <AppHeaderSpacer />

        <AppPageContent
          restoreScroll
          restorationId="mobile-demo-page"
          contentReady={contentReady}
          className="mobile-pwa-demo__content"
        >
          {!contentReady ? (
            <div className="mobile-pwa-demo__loading" role="status" aria-live="polite">
              <span className="mobile-pwa-demo__loading-dot" aria-hidden="true" />
              Loading the long list before restoration…
            </div>
          ) : screen.kind === 'detail' ? (
            <div className="mobile-pwa-demo__stack">
              <Surface variant="accent" padding="standard">
                <p className="mobile-pwa-demo__eyebrow">PUSH navigation</p>
                <h2>Demo player {screen.player}</h2>
                <p>This detail screen starts at the top. Press Back to remount the list with the original history key and restore its visual working context.</p>
                <AppButton onClick={goBack}>Back to exact list position</AppButton>
              </Surface>

              <Surface variant="raised" padding="standard">
                <h3>Overlay Back priority</h3>
                <p>Open the sheet, then use “Simulate Android Back”. The router-neutral overlay handler consumes Back before page navigation.</p>
                <AppButton tone="outline" onClick={() => setSheetOpen(true)}>Open bottom sheet</AppButton>
              </Surface>
            </div>
          ) : (
            <div className="mobile-pwa-demo__stack">
              <Surface variant="accent" padding="standard">
                <p className="mobile-pwa-demo__eyebrow">Issue #6 acceptance demo</p>
                <h2>Scroll far down, open a player, then Back.</h2>
                <p>The page stores a stable player anchor plus relative offset. The List keeps its normal progressive 20-row rendering and reveals a missing deep anchor automatically during Back restoration.</p>
                <div className="mobile-pwa-demo__actions">
                  <AppButton tone={asyncReturn ? 'primary' : 'outline'} onClick={() => setAsyncReturn((value) => !value)}>
                    Async return: {asyncReturn ? 'on' : 'off'}
                  </AppButton>
                  <AppButton tone="outline" onClick={() => setSheetOpen(true)}>Overlay demo</AppButton>
                </div>
              </Surface>

              <Surface variant="raised" padding="standard">
                <h3>Selection contract</h3>
                <p className="mobile-pwa-demo__nonselectable">This ordinary app-chrome text should not trigger long-press text selection.</p>
                <p>Copyable value: <SelectableText>Registration 123456</SelectableText></p>
                <AppInput
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  aria-label="Filter demo players"
                  placeholder="Filter demo players"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </Surface>

              <Surface variant="raised" padding="standard">
                <div className="mobile-pwa-demo__section-heading">
                  <div>
                    <h3>Independent nested ScrollArea</h3>
                    <p>Scroll this region too. It has its own restoration id and is restored independently from the page.</p>
                  </div>
                  <Pill tone="accent">Nested</Pill>
                </div>
                <ScrollArea restoreScroll restorationId="operator-notes" className="mobile-pwa-demo__nested-scroll">
                  {notes.map((note, index) => (
                    <ScrollAnchor key={note} anchorId={`note:${index + 1}`} className="mobile-pwa-demo__note">
                      {note}
                    </ScrollAnchor>
                  ))}
                </ScrollArea>
              </Surface>

              <Surface variant="raised" padding="none">
                <div className="mobile-pwa-demo__list-heading">
                  <div>
                    <h3>Long progressive player list</h3>
                    <p>{visiblePlayers.length} stable anchors · 20 rows per progressive page</p>
                  </div>
                  <Pill tone="success">Restorable</Pill>
                </div>
                <List divider="hairline">
                  {visiblePlayers.map((player) => (
                    <ListItem
                      key={player.id}
                      scrollAnchorId={`player:${player.id}`}
                      title={player.name}
                      subtitle={`${player.club} · anchor player:${player.id}`}
                      trailing={<Pill tone="neutral">#{player.id}</Pill>}
                      onClick={() => openPlayer(player.id)}
                    />
                  ))}
                </List>
              </Surface>
            </div>
          )}
        </AppPageContent>

        <BottomSheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Overlay Back demo"
          description="Radix owns focus and background scroll locking; the app can let this overlay consume browser/Android Back first."
          height="auto"
          footer={<AppButton full onClick={simulateAndroidBack}>Simulate Android Back</AppButton>}
        >
          <p>If this sheet is open, the simulated Back action closes it without changing the current page history entry.</p>
        </BottomSheet>

        <div className="showcase-root-switch" aria-label="Showcase views">
          <button type="button" onClick={onOpenShell}>App shell</button>
          <button type="button" onClick={onOpenLab}>Component lab</button>
          <button type="button" onClick={onOpenSkill}>Agent skill</button>
        </div>
      </AppShellPage>
    </ScrollRestorationProvider>
  );
}
