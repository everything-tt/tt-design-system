import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distRoot = join(packageRoot, 'dist');
const sourcePackage = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));

if (sourcePackage.name !== '@everything-tt/tt-players-design-system') {
  throw new Error(`Unexpected package name: ${sourcePackage.name}`);
}

function copyCssAssets(sourceDir, targetDir) {
  mkdirSync(targetDir, { recursive: true });
  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = join(sourceDir, entry.name);
    const targetPath = join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyCssAssets(sourcePath, targetPath);
    } else if (entry.isFile() && entry.name.endsWith('.css')) {
      cpSync(sourcePath, targetPath);
    }
  }
}

function verifyCompiledCssImports(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      verifyCompiledCssImports(path);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;

    const source = readFileSync(path, 'utf8');
    for (const match of source.matchAll(/(?:import|export)[^'\"]*['\"](\.[^'\"]+\.css)['\"]/g)) {
      const cssPath = resolve(dirname(path), match[1]);
      if (!existsSync(cssPath)) {
        throw new Error(`Missing published CSS asset for ${path}: ${match[1]}`);
      }
    }
  }
}

mkdirSync(distRoot, { recursive: true });
cpSync(join(packageRoot, 'src', 'styles'), join(distRoot, 'styles'), { recursive: true });
copyCssAssets(join(packageRoot, 'src', 'components'), join(distRoot, 'components'));
cpSync(join(packageRoot, 'README.md'), join(distRoot, 'README.md'));

const skillSource = join(packageRoot, '.agents', 'skills', 'tt-design-system');
if (!existsSync(join(skillSource, 'SKILL.md'))) {
  throw new Error('Missing package-owned .agents/skills/tt-design-system/SKILL.md');
}
cpSync(skillSource, join(distRoot, 'agent-skills', 'tt-design-system'), { recursive: true });
mkdirSync(join(distRoot, 'scripts'), { recursive: true });
cpSync(join(packageRoot, 'scripts', 'install-agent-skill.mjs'), join(distRoot, 'scripts', 'install-agent-skill.mjs'));

verifyCompiledCssImports(distRoot);

const publishedPackage = {
  name: sourcePackage.name,
  version: sourcePackage.version,
  description: 'Shared TT Players React design system for mobile-first PWAs.',
  type: 'module',
  main: './index.js',
  module: './index.js',
  types: './index.d.ts',
  bin: sourcePackage.bin,
  scripts: {
    postinstall: sourcePackage.scripts.postinstall,
  },
  exports: {
    '.': {
      types: './index.d.ts',
      import: './index.js',
      default: './index.js',
    },
    './primitives': {
      types: './components/ui/index.d.ts',
      import: './components/ui/index.js',
      default: './components/ui/index.js',
    },
    './styles.css': './styles/index.css',
    './utils': {
      types: './lib/utils.d.ts',
      import: './lib/utils.js',
      default: './lib/utils.js',
    },
    './pwa': {
      types: './pwa/index.d.ts',
      import: './pwa/index.js',
      default: './pwa/index.js',
    },
    './pwa/vite': {
      types: './pwa/vite.d.ts',
      import: './pwa/vite.js',
      default: './pwa/vite.js',
    },
    './package.json': './package.json',
  },
  sideEffects: ['**/*.css'],
  peerDependencies: sourcePackage.peerDependencies,
  dependencies: sourcePackage.dependencies,
  engines: {
    node: '>=18.0.0',
  },
  repository: {
    type: 'git',
    url: 'git+https://github.com/everything-tt/tt-design-system.git',
  },
  homepage: 'https://github.com/everything-tt/tt-design-system',
  publishConfig: {
    registry: 'https://npm.pkg.github.com',
  },
};

writeFileSync(
  join(distRoot, 'package.json'),
  `${JSON.stringify(publishedPackage, null, 2)}\n`,
);
