import {
  AppPageContent,
  AppShellPage,
  EntityHero,
  List,
  ListItem,
  MetricGrid,
  Pill,
  SectionHeader,
  SelectableText,
  Surface,
} from '@everything-tt/tt-players-design-system';

interface AgentSkillDemoProps {
  onOpenShell: () => void;
  onOpenLab: () => void;
  onOpenMobile: () => void;
}

const installCommand = `pnpm add @everything-tt/tt-players-design-system

# Fallback when dependency lifecycle scripts are blocked:
pnpm exec tt-design-system install-skill`;

const skillPath = `.agents/skills/tt-design-system/
├── SKILL.md
├── references/
│   ├── component-selection.md
│   └── mobile-pwa-restoration.md
└── .tt-design-system-managed.json`;

function StepBadge({ children }: { children: string }) {
  return <span className="agent-skill-demo__step">{children}</span>;
}

export function AgentSkillDemo({ onOpenShell, onOpenLab, onOpenMobile }: AgentSkillDemoProps) {
  return (
    <AppShellPage id="agent-skill-demo" className="agent-skill-demo">
      <AppPageContent className="agent-skill-demo__content">
        <EntityHero
          eyebrow="PACKAGE-MANAGED AGENT SKILL"
          title="The design system ships its own usage playbook."
          subtitle="Installing the package gives coding agents the same component-selection, ownership, mobile/PWA, and navigation-restoration rules that maintainers use when reviewing TT applications."
          meta={<Pill tone="success">Ships with the package</Pill>}
          highlights={(
            <MetricGrid
              ariaLabel="Agent skill package contract"
              columns={3}
              separators
              valueSize="prominent"
              metrics={[
                { value: '1', label: 'Managed skill' },
                { value: '2', label: 'Focused references' },
                { value: '2', label: 'Install paths' },
              ]}
            />
          )}
          highlightsSeparated
          className="agent-skill-demo__hero"
        />

        <SectionHeader
          title="Install contract"
          description="Automatic when package lifecycle scripts are permitted; deterministic and explicit when a package manager or CI policy blocks them."
          emphasis="primary"
        />
        <div className="agent-skill-demo__grid">
          <Surface variant="accent" padding="standard" className="agent-skill-demo__panel">
            <span className="agent-skill-demo__eyebrow">CONSUMER INSTALL</span>
            <h2>One package, one managed skill.</h2>
            <div className="agent-skill-demo__steps">
              <div><StepBadge>1</StepBadge><p>Install or upgrade the shared design-system package.</p></div>
              <div><StepBadge>2</StepBadge><p><code>postinstall</code> attempts to create the project skill automatically.</p></div>
              <div><StepBadge>3</StepBadge><p>If dependency scripts are blocked, run the packaged CLI once.</p></div>
            </div>
            <pre className="agent-skill-demo__code"><SelectableText>{installCommand}</SelectableText></pre>
          </Surface>

          <Surface variant="raised" padding="standard" className="agent-skill-demo__panel">
            <span className="agent-skill-demo__eyebrow">INSTALLED SHAPE</span>
            <h2>Visible in the project, owned upstream.</h2>
            <p className="agent-skill-demo__muted">The marker records the package version and a content hash. Upgrades only replace a verifiably package-managed, unedited copy.</p>
            <pre className="agent-skill-demo__code agent-skill-demo__code--compact"><SelectableText>{skillPath}</SelectableText></pre>
            <div className="agent-skill-demo__guardrails">
              <Pill tone="success">Idempotent</Pill>
              <Pill tone="accent">Hash protected</Pill>
              <Pill tone="neutral">Force is explicit</Pill>
            </div>
          </Surface>
        </div>

        <SectionHeader
          title="What the skill teaches"
          description="The goal is not more generated UI. It is more consistent use of the public design-system contract."
          emphasis="primary"
        />
        <Surface variant="raised" padding="none">
          <List divider="hairline" paginate={false}>
            <ListItem
              leading={<StepBadge>01</StepBadge>}
              title="Public API first"
              subtitle="Choose the narrowest branded public primitive and verify its installed TypeScript API before inventing props or copying internals."
              trailing={<Pill tone="accent">Components</Pill>}
              hideChevron
            />
            <ListItem
              leading={<StepBadge>02</StepBadge>}
              title="Keep ownership boundaries clear"
              subtitle="The design system owns reusable semantics and interaction; the application owns domain state, routing, fetching, filters and product decisions."
              trailing={<Pill tone="neutral">Architecture</Pill>}
              hideChevron
            />
            <ListItem
              leading={<StepBadge>03</StepBadge>}
              title="Do not style shared internals"
              subtitle="Compose public components and app-owned wrappers instead of reaching into .tt-* DOM internals from product CSS."
              trailing={<Pill tone="neutral">CSS</Pill>}
              hideChevron
            />
            <ListItem
              leading={<StepBadge>04</StepBadge>}
              title="Move reusable gaps upstream"
              subtitle="If multiple TT products need a missing behaviour, add a bounded design-system API with tests and showcase coverage rather than forking it locally."
              trailing={<Pill tone="success">Reuse</Pill>}
              hideChevron
            />
          </List>
        </Surface>

        <SectionHeader
          title="Mobile / PWA practices"
          description="The skill carries the migration rules introduced by this PR so consumers do not accidentally undo them."
          emphasis="primary"
        />
        <div className="agent-skill-demo__grid">
          <Surface variant="raised" padding="standard" className="agent-skill-demo__panel">
            <span className="agent-skill-demo__eyebrow">SCROLL + HISTORY</span>
            <h2>Restore user context, not router implementation details.</h2>
            <ul className="agent-skill-demo__bullets">
              <li>Document scrolling remains the compatibility default.</li>
              <li><code>viewport="contained"</code> is an intentional migration.</li>
              <li>Use logical <code>PUSH / POP / REPLACE</code> semantics.</li>
              <li>Wait for real async content before <code>contentReady=true</code>.</li>
            </ul>
          </Surface>

          <Surface variant="raised" padding="standard" className="agent-skill-demo__panel">
            <span className="agent-skill-demo__eyebrow">LONG LISTS + OVERLAYS</span>
            <h2>Use stable identities and shared mobile mechanics.</h2>
            <ul className="agent-skill-demo__bullets">
              <li>Anchor rows with stable domain IDs via <code>scrollAnchorId</code>.</li>
              <li>Let progressive lists reveal deep saved anchors.</li>
              <li>Give restorable nested <code>ScrollArea</code>s stable IDs.</li>
              <li>Let shared Radix-backed overlays own focus and scroll locking.</li>
            </ul>
          </Surface>
        </div>

        <SectionHeader title="Package safety" emphasis="secondary" />
        <Surface variant="subtle" padding="standard" className="agent-skill-demo__safety">
          <strong>The package never silently replaces an unrelated or locally edited skill.</strong>
          <p>Automatic installation warns and leaves the existing directory untouched. Manual replacement requires an explicit <code>--force</code>. Set <code>TT_DESIGN_SYSTEM_SKIP_SKILL_INSTALL=1</code> when a consumer intentionally does not want the package-managed copy.</p>
        </Surface>
      </AppPageContent>

      <div className="showcase-root-switch" aria-label="Showcase views">
        <button type="button" onClick={onOpenShell}>App shell</button>
        <button type="button" onClick={onOpenLab}>Component lab</button>
        <button type="button" onClick={onOpenMobile}>Mobile / PWA</button>
      </div>
    </AppShellPage>
  );
}
