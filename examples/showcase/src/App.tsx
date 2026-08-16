import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Clipboard,
  Code2,
  ExternalLink,
  FlaskConical,
  LayoutGrid,
  Menu,
  Moon,
  PackageCheck,
  Palette,
  PanelLeft,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Table2,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  AppButton,
  AppButtonLink,
  AppDrawer,
  AppMessageCard,
  AppSearchInput,
  AppSwitch,
  AppToggleButton,
  Avatar,
  BottomSheet,
  DesignList,
  EmptyState,
  EntityHero,
  ErrorState,
  IconCircle,
  List,
  ListItem,
  MatchRecordRow,
  MetricGrid,
  Pill,
  RankBadge,
  SectionHeader,
  SegmentedToggle,
  Surface,
  useTheme,
} from '@everything-tt/tt-players-design-system';

type SectionId = 'overview' | 'foundations' | 'controls' | 'lists' | 'states';
type Density = 'sm' | 'md' | 'lg';
type SurfaceMode = 'raised' | 'subtle' | 'accent';

interface NavItem {
  id: SectionId;
  label: string;
  detail: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', detail: 'Start here', icon: LayoutGrid },
  { id: 'foundations', label: 'Foundations', detail: 'Tokens and theme', icon: Palette },
  { id: 'controls', label: 'Controls', detail: 'Actions and inputs', icon: SlidersHorizontal },
  { id: 'lists', label: 'Lists', detail: 'Rows and records', icon: Table2 },
  { id: 'states', label: 'States', detail: 'Feedback and overlays', icon: Sparkles },
];

const tokenSwatches = [
  { label: 'Canvas', variable: '--canvas-parchment', color: 'var(--canvas-parchment)' },
  { label: 'Raised', variable: '--surface-strong', color: 'var(--surface-strong)' },
  { label: 'Accent', variable: '--accent', color: 'var(--accent)' },
  { label: 'Success', variable: '--state-success', color: 'var(--state-success)' },
  { label: 'Warning', variable: '--state-warning', color: 'var(--state-warning)' },
  { label: 'Ink', variable: '--ink', color: 'var(--ink)' },
];

const componentGroups = [
  { label: 'Foundations', value: 'tokens, theme, rhythm' },
  { label: 'Composition', value: 'hero, sections, surfaces' },
  { label: 'Interaction', value: 'buttons, toggles, sheets' },
  { label: 'Feedback', value: 'empty, error, loading' },
];

const playerRows = [
  { initials: 'LE', name: 'Lucy Elliott', subtitle: 'County Championships Junior', rank: '01', tone: 'accent' as const },
  { initials: 'AR', name: 'Alex Robinson', subtitle: 'Birmingham TT Academy', rank: '02', tone: 'neutral' as const },
  { initials: 'MS', name: 'Maya Shah', subtitle: 'West Midlands League', rank: '03', tone: 'success' as const },
];

const matchRows = [
  { title: 'Lucy Elliott', metadata: ['County Championships Junior', '11 Apr 2026'], score: '3–1', outcome: 'win' as const, ariaLabel: 'Won 3 games to 1' },
  { title: 'Alex Robinson', metadata: ['Birmingham TT Academy', '07 Apr 2026'], score: '1–3', outcome: 'loss' as const, ariaLabel: 'Lost 1 game to 3' },
  { title: 'Maya Shah', metadata: ['West Midlands League', '02 Apr 2026'], score: '2–2', outcome: 'neutral' as const, ariaLabel: 'Drew 2 games to 2' },
];

function scrollToSection(id: SectionId) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function DemoPanel({
  eyebrow,
  title,
  description,
  children,
  className = '',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Surface variant="raised" padding="standard" className={`showcase-panel ${className}`}>
      <div className="showcase-panel__heading">
        {eyebrow ? <span className="showcase-panel__eyebrow">{eyebrow}</span> : null}
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </Surface>
  );
}

function Navigation({
  activeSection,
  onNavigate,
}: {
  activeSection: SectionId;
  onNavigate: (id: SectionId) => void;
}) {
  return (
    <nav className="showcase-nav" aria-label="Showcase sections">
      <p className="showcase-nav__label">Explore</p>
      <div className="showcase-nav__items">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`showcase-nav__item${isActive ? ' showcase-nav__item--active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              <span className="showcase-nav__icon"><Icon size={16} strokeWidth={2.2} aria-hidden="true" /></span>
              <span className="showcase-nav__copy">
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>
              {isActive ? <ChevronRight size={15} aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
      <div className="showcase-nav__note">
        <span className="showcase-live-dot" aria-hidden="true" />
        <span><strong>Live source</strong><small>Editing <code>src/</code> updates this lab.</small></span>
      </div>
    </nav>
  );
}

export function App() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>('raised');
  const [density, setDensity] = useState<Density>('md');
  const [query, setQuery] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const visiblePlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return playerRows;
    return playerRows.filter((player) => `${player.name} ${player.subtitle}`.toLowerCase().includes(normalizedQuery));
  }, [query]);

  const navigate = (id: SectionId) => {
    setActiveSection(id);
    setMobileNavOpen(false);
    window.requestAnimationFrame(() => scrollToSection(id));
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  };

  const runLoadingDemo = () => {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      showNotice('The loading state resolved cleanly.');
    }, 900);
  };

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText('pnpm demo');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      showNotice('Copy is unavailable in this browser context.');
    }
  };

  return (
    <div className="showcase-app">
      <header className="showcase-topbar">
        <div className="showcase-topbar__inner">
          <div className="showcase-brand">
            <span className="showcase-brand__mark"><FlaskConical size={18} strokeWidth={2.3} aria-hidden="true" /></span>
            <span className="showcase-brand__copy">
              <strong>TT Players</strong>
              <small>Design system / component lab</small>
            </span>
          </div>
          <div className="showcase-topbar__tools">
            <span className="showcase-version"><PackageCheck size={14} aria-hidden="true" /> v0.1.6</span>
            <label className="showcase-theme-control">
              <span className="showcase-theme-control__icon" aria-hidden="true">{isDarkMode ? <Moon size={15} /> : <Sun size={15} />}</span>
              <span className="showcase-theme-control__label">{isDarkMode ? 'Dark' : 'Light'}</span>
              <AppSwitch
                id="showcase-theme-switch"
                checked={isDarkMode}
                onCheckedChange={() => toggleTheme()}
                aria-label="Toggle dark mode"
              />
            </label>
            <AppButton
              tone="ghost"
              size="s"
              rounded="m"
              iconOnly
              className="showcase-mobile-menu"
              aria-label="Open showcase navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={18} aria-hidden="true" />
            </AppButton>
          </div>
        </div>
      </header>

      <div className="showcase-layout">
        <aside className="showcase-sidebar">
          <Navigation activeSection={activeSection} onNavigate={navigate} />
          <div className="showcase-sidebar__footer">
            <Code2 size={16} aria-hidden="true" />
            <span>Source-first API</span>
          </div>
        </aside>

        <main className="showcase-main" id="main-content">
          <section className="showcase-section showcase-section--overview" id="overview">
            <EntityHero
              className="showcase-hero"
              leading={<span className="showcase-hero__mark"><Zap size={22} aria-hidden="true" /></span>}
              eyebrow="A working surface for the system"
              title="Build the interface in front of you."
              subtitle="A small, opinionated lab for trying components in real composition, checking interaction states, and keeping the shared UI honest."
              actions={(
                <div className="showcase-hero__actions">
                  <AppButton size="m" onClick={() => navigate('controls')}>
                    Try the controls <ArrowUpRight size={16} aria-hidden="true" />
                  </AppButton>
                  <AppButtonLink href="https://github.com/everything-tt" target="_blank" rel="noreferrer" tone="outline" size="m">
                    Source <ExternalLink size={15} aria-hidden="true" />
                  </AppButtonLink>
                </div>
              )}
              actionPlacement="below"
              highlights={(
                <MetricGrid
                  ariaLabel="Showcase facts"
                  columns={3}
                  separators
                  valueSize="prominent"
                  metrics={[
                    { value: 'React', label: 'Portable primitives' },
                    { value: '2', label: 'Theme modes' },
                    { value: '44px', label: 'Tap target baseline' },
                  ]}
                />
              )}
              highlightsSeparated
            />

            <div className="showcase-overview-grid">
              <DemoPanel eyebrow="Why it exists" title="See the contract, not just the component." description="Use realistic content and composition while you work on the package. Every example below is wired to the exported API.">
                <div className="showcase-principles">
                  <div><span className="showcase-principle__number">01</span><p>Source-first</p><small>Edit <code>src/</code>, refresh, inspect.</small></div>
                  <div><span className="showcase-principle__number">02</span><p>State-rich</p><small>Default, selected, loading, error.</small></div>
                  <div><span className="showcase-principle__number">03</span><p>Composition-ready</p><small>Patterns fit together like product UI.</small></div>
                </div>
              </DemoPanel>
              <DemoPanel eyebrow="Package surface" title="A focused set of building blocks." description="The lab deliberately stays close to the public package boundary so its examples remain useful to consumers.">
                <div className="showcase-component-list">
                  {componentGroups.map((group) => (
                    <div className="showcase-component-list__row" key={group.label}>
                      <span className="showcase-component-list__icon"><Check size={14} aria-hidden="true" /></span>
                      <span><strong>{group.label}</strong><small>{group.value}</small></span>
                    </div>
                  ))}
                </div>
              </DemoPanel>
            </div>
          </section>

          <section className="showcase-section" id="foundations">
            <SectionHeader
              title="Foundations"
              description="Token decisions stay visible while you compose components. Switch the theme or surface treatment to check the edges."
              meta={<Pill tone="accent">Theme-aware</Pill>}
              emphasis="primary"
            />
            <div className="showcase-grid showcase-grid--foundations">
              <DemoPanel eyebrow="Color roles" title="Semantic tokens" description="The palette is intentionally role-based, so components can change without rewriting the composition.">
                <div className="showcase-token-grid">
                  {tokenSwatches.map((swatch) => (
                    <div className="showcase-token" key={swatch.variable}>
                      <span className="showcase-token__color" style={{ background: swatch.color }} />
                      <span><strong>{swatch.label}</strong><code>{swatch.variable}</code></span>
                    </div>
                  ))}
                </div>
              </DemoPanel>
              <DemoPanel eyebrow="Surface laboratory" title="Choose the stage" description="This control is intentionally live. It helps catch contrast and border issues across the same content.">
                <SegmentedToggle
                  ariaLabel="Preview surface"
                  value={surfaceMode}
                  onChange={setSurfaceMode}
                  variant="chip"
                  options={[
                    { value: 'raised', label: 'Raised' },
                    { value: 'subtle', label: 'Subtle' },
                    { value: 'accent', label: 'Accent' },
                  ]}
                />
                <Surface variant={surfaceMode} padding="standard" className="showcase-live-surface">
                  <div className="showcase-live-surface__topline"><span className="showcase-live-dot" aria-hidden="true" /> Live preview <Pill tone={surfaceMode === 'accent' ? 'neutral' : 'accent'} size="xs">{surfaceMode}</Pill></div>
                  <strong>Surface composition</strong>
                  <p>Can the text, border, and action still read when the context changes?</p>
                  <AppButton size="s" tone={surfaceMode === 'accent' ? 'outline' : 'primary'} onClick={() => showNotice(`The ${surfaceMode} surface is interactive.`)}>Test action</AppButton>
                </Surface>
              </DemoPanel>
            </div>
          </section>

          <section className="showcase-section" id="controls">
            <SectionHeader
              title="Controls"
              description="A compact set of actions, inputs, and selected states. Try them before you ship them."
              meta={<Pill tone="success">Interactive</Pill>}
              emphasis="primary"
            />
            <div className="showcase-grid showcase-grid--controls">
              <DemoPanel eyebrow="Search and filter" title="Find a component" description="The native search contract keeps the input accessible and portable.">
                <AppSearchInput
                  iconClassName="showcase-search-icon"
                  aria-label="Search components"
                  placeholder="Search components…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <div className="showcase-control-row">
                  <AppToggleButton pressed={savedOnly} onClick={() => setSavedOnly((value) => !value)}>
                    {savedOnly ? 'Saved only' : 'All components'}
                  </AppToggleButton>
                  <Pill tone={query ? 'accent' : 'neutral'}>{visiblePlayers.length} matches</Pill>
                </div>
                <p className="showcase-result-note"><Search size={14} aria-hidden="true" /> {query ? `Filtering for “${query}”.` : 'Type to exercise the controlled input.'}</p>
              </DemoPanel>
              <DemoPanel eyebrow="Action vocabulary" title="Buttons under pressure" description="The same action can be checked across tone, size, loading, and disabled states.">
                <div className="showcase-button-grid">
                  <div><span>Primary</span><AppButton onClick={() => showNotice('Primary action acknowledged.')}>Continue</AppButton></div>
                  <div><span>Outline</span><AppButton tone="outline" onClick={() => showNotice('Outline action acknowledged.')}>Review</AppButton></div>
                  <div><span>Ghost</span><AppButton tone="ghost" onClick={() => showNotice('Ghost action acknowledged.')}>Dismiss</AppButton></div>
                  <div><span>Danger</span><AppButton tone="danger" onClick={() => showNotice('Danger action acknowledged.')}>Remove</AppButton></div>
                  <div><span>Loading</span><AppButton loading={loading} onClick={runLoadingDemo}>{loading ? 'Saving…' : 'Save changes'}</AppButton></div>
                  <div><span>Disabled</span><AppButton disabled>Unavailable</AppButton></div>
                </div>
              </DemoPanel>
              <DemoPanel eyebrow="Preferences" title="Persistent state" description="Selected controls should look selected and expose the same state to assistive technology.">
                <div className="showcase-preference-list">
                  <label className="showcase-preference">
                    <span><strong>Notifications</strong><small>Keep the feedback loop visible.</small></span>
                    <AppSwitch id="showcase-notifications" checked={notifications} onCheckedChange={setNotifications} aria-label="Toggle notifications" />
                  </label>
                  <label className="showcase-preference">
                    <span><strong>Density</strong><small>Compare row rhythm in context.</small></span>
                    <SegmentedToggle
                      ariaLabel="List density"
                      value={density}
                      onChange={setDensity}
                      options={[
                        { value: 'sm', label: 'Small' },
                        { value: 'md', label: 'Medium' },
                        { value: 'lg', label: 'Large' },
                      ]}
                    />
                  </label>
                </div>
              </DemoPanel>
            </div>
          </section>

          <section className="showcase-section" id="lists">
            <SectionHeader
              title="Lists and records"
              description="Rows carry hierarchy, metadata, affordances, and outcomes without needing feature data or routing."
              meta={<Pill tone="warning">Content rhythm</Pill>}
              emphasis="primary"
            />
            <div className="showcase-grid showcase-grid--lists">
              <DemoPanel eyebrow="List / ListItem" title="People and positions" description="Leading identity, compact metadata, rank, and a deliberate trailing state.">
                <List size={density} divider="hairline" paginate={false}>
                  {visiblePlayers.map((player) => (
                    <ListItem
                      key={player.name}
                      leading={<Avatar text={player.initials} size="md" variant={player.tone === 'success' ? 'solid' : 'subtle'} />}
                      title={player.name}
                      subtitle={player.subtitle}
                      trailing={<span className="showcase-list-trailing"><RankBadge>{player.rank}</RankBadge><Pill tone={player.tone}>{player.tone === 'accent' ? 'Active' : player.tone === 'success' ? 'New' : 'Ready'}</Pill></span>}
                      onClick={() => showNotice(`${player.name} row selected.`)}
                    />
                  ))}
                </List>
                {visiblePlayers.length === 0 ? <p className="showcase-no-results">No matching players. Clear the search to restore the sample.</p> : null}
              </DemoPanel>
              <DemoPanel eyebrow="MatchRecordRow" title="Completed matches" description="A score model comes in already oriented. The row owns layout and action semantics.">
                <DesignList density={density === 'sm' ? 'compact' : density === 'lg' ? 'editorial' : 'comfortable'} divider="hairline" paginate={false}>
                  {matchRows.map((match) => (
                    <MatchRecordRow
                      key={match.title}
                      score={{ value: match.score, outcome: match.outcome, ariaLabel: match.ariaLabel }}
                      title={match.title}
                      metadata={match.metadata}
                      onClick={() => showNotice(`${match.title} match opened.`)}
                      actions={[
                        { iconClassName: 'showcase-row-icon showcase-row-icon--open', label: 'Open record', onClick: () => showNotice('Record action selected.'), tone: 'accent' },
                        { iconClassName: 'showcase-row-icon showcase-row-icon--more', label: 'More actions', onClick: () => setSheetOpen(true) },
                      ]}
                    />
                  ))}
                </DesignList>
              </DemoPanel>
            </div>
          </section>

          <section className="showcase-section" id="states">
            <SectionHeader
              title="States and overlays"
              description="Feedback is part of the component contract. These examples make empty, error, loading, and overlay states easy to inspect."
              meta={<Pill tone="danger">Edge cases</Pill>}
              emphasis="primary"
            />
            <div className="showcase-grid showcase-grid--states">
              <DemoPanel eyebrow="Empty and error" title="Explain the next move" description="A state should tell the user what happened and what they can do now.">
                <div className="showcase-state-stack">
                  <EmptyState
                    iconClassName="showcase-state-icon showcase-state-icon--inbox"
                    title="No saved components"
                    message="Save a pattern here when you want to compare it later."
                    action={{ label: 'Save this pattern', onClick: () => showNotice('Pattern saved.') }}
                  />
                  <ErrorState
                    title="Preview needs attention"
                    message="The sample data could not be refreshed. The rest of the lab is still available."
                    onRetry={() => showNotice('Retry requested.')}
                  />
                </div>
              </DemoPanel>
              <DemoPanel eyebrow="Message card" title="A contained interruption" description="Use a message card when context should stay in the flow instead of opening a modal.">
                <AppMessageCard
                  title="Package source is linked"
                  message="This lab resolves the design system through the workspace, so local component edits are available immediately."
                  action={{ label: 'Copy pnpm demo', onClick: () => void copyCommand(), tone: 'highlight' }}
                />
                <div className="showcase-copy-status" aria-live="polite">
                  {copied ? <><Check size={14} aria-hidden="true" /> Command copied</> : <><Clipboard size={14} aria-hidden="true" /> pnpm demo</>}
                </div>
              </DemoPanel>
              <DemoPanel eyebrow="BottomSheet" title="Progressive disclosure" description="The overlay keeps focus and escape behaviour in the shared Radix-backed primitive.">
                <div className="showcase-overlay-preview">
                  <div className="showcase-overlay-preview__icon"><PanelLeft size={20} aria-hidden="true" /></div>
                  <div><strong>Open the action surface</strong><p>Useful for mobile-first flows and compact option sets.</p></div>
                  <AppButton size="s" tone="outline" onClick={() => setSheetOpen(true)}>Open sheet</AppButton>
                </div>
              </DemoPanel>
            </div>
          </section>

          <footer className="showcase-footer">
            <div><strong>Ready to change the system?</strong><span>Edit a component in <code>src/</code>, then refresh this page.</span></div>
            <AppButton tone="ghost" size="s" rounded="m" onClick={() => navigate('overview')}>Back to overview <ArrowUpRight size={14} aria-hidden="true" /></AppButton>
          </footer>
        </main>
      </div>

      <AppDrawer
        id="showcase-mobile-drawer"
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        title="Component lab"
        subtitle="TT Players design system"
        width="min(88vw, 360px)"
      >
        <Navigation activeSection={activeSection} onNavigate={navigate} />
      </AppDrawer>

      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        eyebrow="Interactive state"
        title="More actions"
        description="This is a real shared overlay. It is here so its focus, escape, and close behaviour are easy to exercise."
        height="auto"
        footer={<AppButton full onClick={() => { setSheetOpen(false); showNotice('Sheet action completed.'); }}>Complete action</AppButton>}
      >
        <List divider="gap" paginate={false}>
          <ListItem leading={<IconCircle iconClassName="showcase-row-icon showcase-row-icon--open" tone="accent" />} title="Open component source" subtitle="Inspect the implementation in src/" onClick={() => showNotice('Source action selected.')} />
          <ListItem leading={<IconCircle iconClassName="showcase-row-icon showcase-row-icon--copy" tone="success" />} title="Copy usage example" subtitle="Keep the composition close at hand" onClick={() => void copyCommand()} />
          <ListItem leading={<IconCircle iconClassName="showcase-row-icon showcase-row-icon--close" tone="neutral" />} title="Close this surface" subtitle="Return to the component lab" onClick={() => setSheetOpen(false)} />
        </List>
      </BottomSheet>

      {notice ? <div className="showcase-toast" role="status"><Check size={15} aria-hidden="true" />{notice}</div> : null}
    </div>
  );
}
