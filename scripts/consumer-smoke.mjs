import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distRoot = join(packageRoot, 'dist');
const consumerRoot = mkdtempSync(join(tmpdir(), 'tt-design-system-consumer-'));
let tarballPath;

try {
  const packed = JSON.parse(execFileSync(
    'npm',
    ['pack', distRoot, '--json'],
    { cwd: packageRoot, encoding: 'utf8' },
  ));
  tarballPath = join(packageRoot, packed[0].filename);

  writeFileSync(join(consumerRoot, 'package.json'), `${JSON.stringify({
    name: 'tt-design-system-consumer-smoke',
    private: true,
    type: 'module',
    scripts: {
      build: 'vite build',
      typecheck: 'tsc --noEmit',
    },
    dependencies: {
      '@everything-tt/tt-players-design-system': `file:${tarballPath}`,
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      'workbox-window': '^7.4.0',
    },
    devDependencies: {
      '@tailwindcss/vite': '^4.1.11',
      '@types/react': '^18.3.18',
      '@types/react-dom': '^18.3.5',
      '@vitejs/plugin-react': '^4.3.4',
      tailwindcss: '^4.1.11',
      typescript: '^5.7.3',
      vite: '^6.2.0',
      'vite-plugin-pwa': '^1.2.0',
    },
  }, null, 2)}\n`);

  writeFileSync(join(consumerRoot, 'tsconfig.json'), `${JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'bundler',
      jsx: 'react-jsx',
      strict: true,
      skipLibCheck: true,
      types: ['vite/client'],
    },
    include: ['src', 'vite.config.ts'],
  }, null, 2)}\n`);

  writeFileSync(join(consumerRoot, 'vite.config.ts'), `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { withPWADefaults } from '@everything-tt/tt-players-design-system/pwa/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA(withPWADefaults({
      manifest: {
        name: 'PWA Consumer Smoke',
        short_name: 'Smoke',
        display: 'standalone',
        theme_color: '#17382f',
      },
    })),
  ],
});
`);

  mkdirSync(join(consumerRoot, 'src'));
  writeFileSync(join(consumerRoot, 'src', 'main.tsx'), `import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  AppButton,
  AppTabBar,
  EmptyState,
  EntityHero,
  List,
  ListItem,
  MetricGrid,
  OutcomeBadge,
  Pill,
} from '@everything-tt/tt-players-design-system';
import {
  PWAInstallPrompt,
  PWAProvider,
  usePWA,
} from '@everything-tt/tt-players-design-system/pwa';
import '@everything-tt/tt-players-design-system/styles.css';

function PWACompatibilityProbe() {
  const { dismiss, dismissInstall } = usePWA();
  return (
    <div>
      <button onClick={dismiss}>Legacy dismiss</button>
      <button onClick={dismissInstall}>Named dismiss</button>
    </div>
  );
}

function App() {
  return (
    <main>
      <EntityHero eyebrow="Smoke" title="Published package" subtitle="Standalone consumer" />
      <MetricGrid ariaLabel="Metrics" columns={2} metrics={[{ label: 'Players', value: 12 }, { label: 'Tables', value: 4 }]} />
      <Pill tone="success">Online</Pill>
      <OutcomeBadge result="W" />
      <List divider="gap" size="lg">
        <ListItem title="Review tables" subtitle="4 configured" onClick={() => undefined} />
      </List>
      <EmptyState title="No active tables" message="Ready fixtures are in the queue." />
      <AppButton>Open queue</AppButton>
      <AppTabBar
        items={[{ id: 'home', label: 'Home', iconClassName: 'fa fa-home' }]}
        activeItemId="home"
        onItemClick={() => undefined}
      />
      <PWAInstallPrompt appName="Smoke App" />
      <PWACompatibilityProbe />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <PWAProvider>
    <App />
  </PWAProvider>,
);
`);

  writeFileSync(join(consumerRoot, 'index.html'), '<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n');

  // Keep dependency lifecycle scripts enabled here. This is the acceptance test
  // for the published package's actual postinstall contract, not only the helper.
  execFileSync(
    'npm',
    ['install', '--registry=https://registry.npmjs.org'],
    {
      cwd: consumerRoot,
      env: {
        ...process.env,
        TT_DESIGN_SYSTEM_SKIP_SKILL_INSTALL: '',
      },
      stdio: 'inherit',
    },
  );

  const installedPackageRoot = join(consumerRoot, 'node_modules', '@everything-tt', 'tt-players-design-system');
  const installerPath = join(installedPackageRoot, 'scripts', 'install-agent-skill.mjs');
  if (!existsSync(installerPath)) throw new Error('Packed package is missing the agent-skill installer.');

  const installedSkillRoot = join(consumerRoot, '.agents', 'skills', 'tt-design-system');
  if (!existsSync(join(installedSkillRoot, 'SKILL.md'))) {
    throw new Error('Packed package postinstall did not create .agents/skills/tt-design-system.');
  }
  const installedSkill = readFileSync(join(installedSkillRoot, 'SKILL.md'), 'utf8');
  if (!installedSkill.includes('name: tt-design-system')) {
    throw new Error('Packed package installed an invalid tt-design-system skill.');
  }
  const marker = JSON.parse(readFileSync(join(installedSkillRoot, '.tt-design-system-managed.json'), 'utf8'));
  const installedPackage = JSON.parse(readFileSync(join(installedPackageRoot, 'package.json'), 'utf8'));
  if (marker.version !== installedPackage.version || marker.managedBy !== installedPackage.name) {
    throw new Error('Installed skill marker does not match the packed package.');
  }
  if (!/^[a-f0-9]{64}$/.test(marker.contentHash ?? '')) {
    throw new Error('Installed skill marker is missing its package content hash.');
  }

  // The manual fallback must remain safe and idempotent even after postinstall.
  const binPath = join(consumerRoot, 'node_modules', '.bin', 'tt-design-system');
  execFileSync(binPath, ['install-skill'], { cwd: consumerRoot, stdio: 'inherit' });

  execFileSync('npm', ['run', 'typecheck'], { cwd: consumerRoot, stdio: 'inherit' });
  execFileSync('npm', ['run', 'build'], { cwd: consumerRoot, stdio: 'inherit' });

  const assetsDir = join(consumerRoot, 'dist', 'assets');
  const css = readdirSync(assetsDir)
    .filter((name) => name.endsWith('.css'))
    .map((name) => readFileSync(join(assetsDir, name), 'utf8'))
    .join('\n');

  for (const selector of [
    '.tt-list-item',
    '.tt-pill',
    '.tt-empty-state',
    '.tt-outcome',
    '.tt-entity-hero',
    '.tt-tab-bar',
    '.tt-pwa-sheet__content',
  ]) {
    if (!css.includes(selector)) {
      throw new Error(`Packed consumer CSS is missing ${selector}`);
    }
  }
} finally {
  if (tarballPath) rmSync(tarballPath, { force: true });
  rmSync(consumerRoot, { recursive: true, force: true });
}
