import { useState } from 'react';
import {
  AppButton,
  AppDrawer,
  AppHeader,
  AppHeaderSpacer,
  AppPageContent,
  AppShellPage,
  AppTabBar,
  Avatar,
  EntityHero,
  List,
  ListItem,
  MetricGrid,
  Pill,
  SectionHeader,
  SegmentedToggle,
  Surface,
  useTheme,
} from '@everything-tt/tt-players-design-system';

type DemoTabId = 'home' | 'players' | 'leagues' | 'events' | 'h2h';
type EventMode = 'upcoming' | 'completed';

interface AppShellDemoProps {
  onOpenLab: () => void;
}

const tabs = [
  { id: 'home', label: 'Home', iconClassName: 'showcase-app-icon showcase-app-icon--home' },
  { id: 'players', label: 'Players', iconClassName: 'showcase-app-icon showcase-app-icon--players' },
  { id: 'leagues', label: 'Leagues', iconClassName: 'showcase-app-icon showcase-app-icon--leagues' },
  { id: 'events', label: 'Events', iconClassName: 'showcase-app-icon showcase-app-icon--events' },
  { id: 'h2h', label: 'H2H', iconClassName: 'showcase-app-icon showcase-app-icon--h2h' },
];

const tabTitles: Record<DemoTabId, string> = {
  home: 'TT Players',
  players: 'Players',
  leagues: 'Leagues',
  events: 'Events',
  h2h: 'Head to head',
};

const playerSamples = [
  { initials: 'FL', name: 'Felix Lebrun', detail: 'France · World #4', rank: '4' },
  { initials: 'TH', name: 'Tomokazu Harimoto', detail: 'Japan · World #6', rank: '6' },
  { initials: 'AL', name: 'Alexis Lebrun', detail: 'France · World #9', rank: '9' },
];

const eventSamples = {
  upcoming: [
    { title: 'WTT Champions London', subtitle: '28–31 Aug · London', status: 'Saved' },
    { title: 'Essex Junior 2★', subtitle: '6 Sep · Chelmsford', status: 'Entries open' },
    { title: 'National Cup', subtitle: '19–20 Sep · Nottingham', status: 'Upcoming' },
  ],
  completed: [
    { title: 'WTT Event 3246', subtitle: '331 fixtures · completed', status: 'Results' },
    { title: 'County Championships', subtitle: '247 players · completed', status: 'Results' },
  ],
};

function HomeScreen({ onNavigate }: { onNavigate: (tab: DemoTabId) => void }) {
  return (
    <div className="showcase-shell-stack">
      <Surface variant="accent" padding="standard" className="showcase-shell-welcome">
        <div className="showcase-shell-kicker">APPLICATION SHELL DEMO</div>
        <h2>Everything important, one thumb away.</h2>
        <p>This is the real shared shell composition: fixed header, scrollable page content, and the exported bottom tab bar.</p>
        <MetricGrid
          ariaLabel="Home summary"
          columns={3}
          separators
          valueSize="prominent"
          metrics={[
            { value: '2', label: 'Saved events' },
            { value: '4', label: 'Following' },
            { value: '12', label: 'Recent matches' },
          ]}
        />
      </Surface>

      <SectionHeader
        title="Next match"
        description="A product-shaped example inside the shell."
        meta={<Pill tone="accent">Today</Pill>}
        emphasis="primary"
      />
      <Surface variant="raised" padding="standard" className="showcase-shell-match-card">
        <div className="showcase-shell-match-card__top">
          <div>
            <strong>Rowhedge K vs Pegasus E</strong>
            <span>Colchester & District · Division 3</span>
          </div>
          <Pill tone="success">19:30</Pill>
        </div>
        <div className="showcase-shell-match-card__venue">Rowhedge Village Hall</div>
        <AppButton size="s" onClick={() => onNavigate('leagues')}>Open league</AppButton>
      </Surface>

      <SectionHeader title="Quick access" emphasis="secondary" />
      <List divider="hairline" paginate={false}>
        <ListItem
          leading={<span className="showcase-shell-list-icon">★</span>}
          title="Saved tournaments"
          subtitle="2 upcoming events"
          trailing={<Pill tone="accent">2</Pill>}
          onClick={() => onNavigate('events')}
        />
        <ListItem
          leading={<span className="showcase-shell-list-icon">↗</span>}
          title="Recent players"
          subtitle="Jump back into player profiles"
          onClick={() => onNavigate('players')}
        />
        <ListItem
          leading={<span className="showcase-shell-list-icon">⇄</span>}
          title="Compare players"
          subtitle="Open the head-to-head workspace"
          onClick={() => onNavigate('h2h')}
        />
      </List>
    </div>
  );
}

function PlayersScreen() {
  return (
    <div className="showcase-shell-stack">
      <SectionHeader
        title="Players"
        description="List rhythm, identity, ranking and trailing actions inside the canonical shell."
        meta={<Pill tone="neutral">Sample data</Pill>}
        emphasis="primary"
      />
      <Surface variant="raised" padding="none">
        <List divider="hairline" paginate={false}>
          {playerSamples.map((player) => (
            <ListItem
              key={player.name}
              leading={<Avatar text={player.initials} size="md" variant="subtle" />}
              title={player.name}
              subtitle={player.detail}
              trailing={<Pill tone="accent">#{player.rank}</Pill>}
              onClick={() => undefined}
            />
          ))}
        </List>
      </Surface>

      <SectionHeader title="Recently viewed" emphasis="secondary" />
      <Surface variant="subtle" padding="standard">
        <strong>Manika Batra</strong>
        <p className="showcase-shell-muted">India · opened 18 minutes ago</p>
      </Surface>
    </div>
  );
}

function LeaguesScreen() {
  return (
    <div className="showcase-shell-stack">
      <SectionHeader
        title="Your leagues"
        description="Realistic cards without importing application-specific feature code."
        meta={<Pill tone="success">2 active</Pill>}
        emphasis="primary"
      />
      <Surface variant="raised" padding="standard" className="showcase-shell-league-card">
        <div>
          <span className="showcase-shell-kicker">COLCHESTER & DISTRICT</span>
          <h2>Division Three</h2>
          <p>Rowhedge K · 6th place</p>
        </div>
        <MetricGrid
          ariaLabel="League record"
          columns={3}
          metrics={[
            { value: '8', label: 'Played' },
            { value: '5', label: 'Won' },
            { value: '15', label: 'Pts' },
          ]}
        />
      </Surface>
      <Surface variant="raised" padding="standard" className="showcase-shell-league-card">
        <div>
          <span className="showcase-shell-kicker">CHELMSFORD LEAGUE</span>
          <h2>Junior Division</h2>
          <p>Buttsbury B · 3rd place</p>
        </div>
        <MetricGrid
          ariaLabel="Junior league record"
          columns={3}
          metrics={[
            { value: '7', label: 'Played' },
            { value: '5', label: 'Won' },
            { value: '17', label: 'Pts' },
          ]}
        />
      </Surface>
    </div>
  );
}

function EventsScreen() {
  const [mode, setMode] = useState<EventMode>('upcoming');
  return (
    <div className="showcase-shell-stack">
      <div className="showcase-shell-toolbar">
        <SegmentedToggle
          ariaLabel="Event status"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'completed', label: 'Completed' },
          ]}
        />
        <Pill tone="accent">{eventSamples[mode].length}</Pill>
      </div>

      <SectionHeader
        title={mode === 'upcoming' ? 'Upcoming tournaments' : 'Completed tournaments'}
        description="The same toolbar and list pattern can live inside the shared shell."
        emphasis="primary"
      />
      <Surface variant="raised" padding="none">
        <List divider="hairline" paginate={false}>
          {eventSamples[mode].map((event) => (
            <ListItem
              key={event.title}
              leading={<span className="showcase-shell-date-tile">{mode === 'upcoming' ? 'SEP' : 'AUG'}</span>}
              title={event.title}
              subtitle={event.subtitle}
              trailing={<Pill tone={mode === 'upcoming' ? 'accent' : 'neutral'}>{event.status}</Pill>}
              onClick={() => undefined}
            />
          ))}
        </List>
      </Surface>
    </div>
  );
}

function H2HScreen() {
  return (
    <div className="showcase-shell-stack">
      <EntityHero
        eyebrow="HEAD TO HEAD"
        title="Felix Lebrun vs Tomokazu Harimoto"
        subtitle="A composed detail surface inside the same persistent navigation shell."
        highlights={(
          <MetricGrid
            ariaLabel="Head to head record"
            columns={3}
            separators
            valueSize="prominent"
            metrics={[
              { value: '4', label: 'Lebrun wins' },
              { value: '7', label: 'Meetings' },
              { value: '3', label: 'Harimoto wins' },
            ]}
          />
        )}
        highlightsSeparated
      />
      <SectionHeader title="Latest meetings" emphasis="secondary" />
      <Surface variant="raised" padding="none">
        <List divider="hairline" paginate={false}>
          <ListItem title="WTT Champions" subtitle="Lebrun won 4–2 · 14 Jul 2026" trailing={<Pill tone="success">W</Pill>} />
          <ListItem title="World Cup" subtitle="Harimoto won 4–3 · 21 Apr 2026" trailing={<Pill tone="danger">L</Pill>} />
          <ListItem title="Singapore Smash" subtitle="Lebrun won 3–1 · 8 Feb 2026" trailing={<Pill tone="success">W</Pill>} />
        </List>
      </Surface>
    </div>
  );
}

export function AppShellDemo({ onOpenLab }: AppShellDemoProps) {
  const { isDarkMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<DemoTabId>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = (tab: DemoTabId) => {
    setActiveTab(tab);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const screen = {
    home: <HomeScreen onNavigate={navigate} />,
    players: <PlayersScreen />,
    leagues: <LeaguesScreen />,
    events: <EventsScreen />,
    h2h: <H2HScreen />,
  }[activeTab];

  return (
    <AppShellPage className="showcase-shell-demo" id="showcase-app-shell">
      <AppHeader
        title={tabTitles[activeTab]}
        heading
        leftAction={{
          iconClassName: 'showcase-header-icon showcase-header-icon--menu',
          position: 1,
          ariaLabel: 'Open navigation menu',
          onClick: () => setDrawerOpen(true),
        }}
        actions={[
          {
            iconClassName: `showcase-header-icon ${isDarkMode ? 'showcase-header-icon--sun' : 'showcase-header-icon--moon'}`,
            position: 3,
            ariaLabel: isDarkMode ? 'Use light theme' : 'Use dark theme',
            onClick: () => toggleTheme(),
          },
          {
            iconClassName: 'showcase-header-icon showcase-header-icon--lab',
            position: 4,
            ariaLabel: 'Open component lab',
            onClick: onOpenLab,
          },
        ]}
      />

      <AppHeaderSpacer size="medium" />
      <AppPageContent className="showcase-shell-content">
        {screen}
      </AppPageContent>

      <AppTabBar
        items={tabs}
        activeItemId={activeTab}
        onItemClick={(id) => navigate(id as DemoTabId)}
        className="showcase-shell-tabbar"
        ariaLabel="Demo application navigation"
      />

      <AppDrawer
        id="showcase-shell-drawer"
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="TT Players"
        subtitle="Application shell demo"
        width="min(88vw, 360px)"
      >
        <div className="showcase-shell-drawer-content">
          <Pill tone="accent">App shell</Pill>
          <List divider="hairline" paginate={false}>
            {tabs.map((tab) => (
              <ListItem
                key={tab.id}
                title={tab.label}
                trailing={activeTab === tab.id ? <Pill tone="success">Current</Pill> : undefined}
                onClick={() => navigate(tab.id as DemoTabId)}
              />
            ))}
          </List>
          <AppButton full tone="outline" onClick={onOpenLab}>Open component lab</AppButton>
        </div>
      </AppDrawer>
    </AppShellPage>
  );
}
