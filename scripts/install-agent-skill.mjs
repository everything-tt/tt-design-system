#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PACKAGE_NAME = '@everything-tt/tt-players-design-system';
export const SKILL_NAME = 'tt-design-system';
export const MANAGED_MARKER = '.tt-design-system-managed.json';

const modulePath = fileURLToPath(import.meta.url);
export const defaultPackageRoot = dirname(dirname(modulePath));

function truthy(value) {
  return typeof value === 'string' && ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function listSkillFiles(directory, root = directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === MANAGED_MARKER) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listSkillFiles(path, root));
    else if (entry.isFile()) files.push({ path, relativePath: relative(root, path).split(sep).join('/') });
  }
  return files;
}

export function hashSkillDirectory(directory) {
  const hash = createHash('sha256');
  const files = listSkillFiles(directory).sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  for (const file of files) {
    hash.update(file.relativePath);
    hash.update('\0');
    hash.update(readFileSync(file.path));
    hash.update('\0');
  }
  return hash.digest('hex');
}

export function findSkillSource(packageRoot = defaultPackageRoot) {
  const candidates = [
    join(packageRoot, 'agent-skills', SKILL_NAME),
    join(packageRoot, '.agents', 'skills', SKILL_NAME),
  ];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'SKILL.md'))) return candidate;
  }
  throw new Error(`Bundled ${SKILL_NAME} skill was not found under ${packageRoot}`);
}

export function readPackageVersion(packageRoot = defaultPackageRoot) {
  const packageJson = readJson(join(packageRoot, 'package.json'));
  if (!packageJson || packageJson.name !== PACKAGE_NAME || typeof packageJson.version !== 'string') {
    throw new Error(`Cannot read ${PACKAGE_NAME} package version from ${packageRoot}`);
  }
  return packageJson.version;
}

export function resolveAutoProjectRoot(env = process.env) {
  if (truthy(env.TT_DESIGN_SYSTEM_SKIP_SKILL_INSTALL) || truthy(env.npm_config_global)) return null;
  const candidate = env.TT_DESIGN_SYSTEM_SKILL_ROOT || env.INIT_CWD;
  if (!candidate) return null;
  const root = resolve(candidate);
  if (root.split(sep).includes('node_modules')) return null;
  return root;
}

function managedMarker(version, contentHash) {
  return {
    managedBy: PACKAGE_NAME,
    skill: SKILL_NAME,
    version,
    contentHash,
  };
}

function isManagedMarker(value) {
  return value
    && value.managedBy === PACKAGE_NAME
    && value.skill === SKILL_NAME
    && typeof value.version === 'string';
}

export function installAgentSkill({
  projectRoot,
  packageRoot = defaultPackageRoot,
  force = false,
} = {}) {
  if (!projectRoot) return { status: 'skipped', reason: 'No project root was supplied.' };

  const source = findSkillSource(packageRoot);
  const project = resolve(projectRoot);
  const skillsRoot = join(project, '.agents', 'skills');
  const destination = join(skillsRoot, SKILL_NAME);

  if (resolve(source) === resolve(destination)) {
    return { status: 'source', destination, reason: 'The repository already contains the source skill.' };
  }

  const version = readPackageVersion(packageRoot);
  const sourceHash = hashSkillDirectory(source);
  let status = 'installed';

  if (existsSync(destination)) {
    const stat = lstatSync(destination);
    const marker = !stat.isSymbolicLink() && stat.isDirectory()
      ? readJson(join(destination, MANAGED_MARKER))
      : null;

    if (!isManagedMarker(marker)) {
      if (!force) {
        return {
          status: 'conflict',
          destination,
          reason: `Existing ${destination} is not package-managed; refusing to overwrite it.`,
        };
      }
      status = 'updated';
    } else {
      const currentHash = hashSkillDirectory(destination);
      if (marker.contentHash && marker.contentHash !== currentHash && !force) {
        return {
          status: 'conflict',
          destination,
          reason: `Package-managed ${destination} has local changes; refusing to overwrite them.`,
        };
      }
      if (!force && currentHash === sourceHash && marker.version === version) {
        return { status: 'unchanged', destination, version };
      }
      status = 'updated';
    }
  }

  mkdirSync(skillsRoot, { recursive: true });
  const staging = join(skillsRoot, `.${SKILL_NAME}.tmp-${process.pid}-${Date.now()}`);
  rmSync(staging, { recursive: true, force: true });

  try {
    cpSync(source, staging, { recursive: true });
    writeFileSync(
      join(staging, MANAGED_MARKER),
      `${JSON.stringify(managedMarker(version, sourceHash), null, 2)}\n`,
    );
    rmSync(destination, { recursive: true, force: true });
    renameSync(staging, destination);
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }

  return { status, destination, version };
}

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  if (index < 0) return undefined;
  return args[index + 1];
}

function printHelp() {
  console.log(`TT Design System agent skill\n\nUsage:\n  tt-design-system install-skill [--project-root <path>] [--force]\n\nEnvironment:\n  TT_DESIGN_SYSTEM_SKILL_ROOT=<path>   Override the auto-install project root.\n  TT_DESIGN_SYSTEM_SKIP_SKILL_INSTALL=1  Disable package postinstall copying.\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const auto = args.includes('--auto');
  const command = args.find((arg) => !arg.startsWith('-'));

  if (!auto && (!command || command === 'help' || args.includes('--help') || args.includes('-h'))) {
    printHelp();
    return;
  }
  if (!auto && command !== 'install-skill') {
    console.error(`[tt-design-system] Unknown command: ${command}`);
    printHelp();
    process.exitCode = 1;
    return;
  }

  if (auto && truthy(process.env.TT_DESIGN_SYSTEM_SKIP_SKILL_INSTALL)) return;

  const explicitRoot = valueAfter(args, '--project-root');
  const projectRoot = explicitRoot
    ? resolve(explicitRoot)
    : auto
      ? resolveAutoProjectRoot(process.env)
      : process.cwd();

  if (!projectRoot) return;

  try {
    const result = installAgentSkill({
      projectRoot,
      force: args.includes('--force'),
    });

    if (result.status === 'conflict') {
      const message = `[tt-design-system] ${result.reason} Run "tt-design-system install-skill --force" only if you want the package-managed copy.`;
      if (auto) console.warn(message);
      else {
        console.error(message);
        process.exitCode = 1;
      }
      return;
    }

    if (result.status === 'installed' || result.status === 'updated') {
      console.log(`[tt-design-system] ${result.status === 'installed' ? 'Installed' : 'Updated'} agent skill at ${result.destination}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (auto) console.warn(`[tt-design-system] Agent skill auto-install skipped: ${message}`);
    else {
      console.error(`[tt-design-system] Failed to install agent skill: ${message}`);
      process.exitCode = 1;
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(modulePath)) {
  void main();
}
