import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MANAGED_MARKER,
  PACKAGE_NAME,
  SKILL_NAME,
  defaultPackageRoot,
  installAgentSkill,
} from './install-agent-skill.mjs';

const roots = [];

function temporaryProject() {
  const root = mkdtempSync(join(tmpdir(), 'tt-design-system-skill-'));
  roots.push(root);
  return root;
}

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop(), { recursive: true, force: true });
  }
});

describe('agent skill installer', () => {
  it('installs a managed skill and is idempotent for the same package content', () => {
    const projectRoot = temporaryProject();
    const first = installAgentSkill({ projectRoot, packageRoot: defaultPackageRoot });
    expect(first.status).toBe('installed');

    const destination = join(projectRoot, '.agents', 'skills', SKILL_NAME);
    expect(readFileSync(join(destination, 'SKILL.md'), 'utf8')).toContain('name: tt-design-system');
    const marker = JSON.parse(readFileSync(join(destination, MANAGED_MARKER), 'utf8'));
    expect(marker.managedBy).toBe(PACKAGE_NAME);
    expect(marker.skill).toBe(SKILL_NAME);
    expect(marker.contentHash).toMatch(/^[a-f0-9]{64}$/);

    const second = installAgentSkill({ projectRoot, packageRoot: defaultPackageRoot });
    expect(second.status).toBe('unchanged');
  });

  it('protects local changes inside a package-managed skill unless force is explicit', () => {
    const projectRoot = temporaryProject();
    installAgentSkill({ projectRoot, packageRoot: defaultPackageRoot });
    const skillPath = join(projectRoot, '.agents', 'skills', SKILL_NAME, 'SKILL.md');
    writeFileSync(skillPath, '# locally edited\n');

    const protectedResult = installAgentSkill({ projectRoot, packageRoot: defaultPackageRoot });
    expect(protectedResult.status).toBe('conflict');
    expect(readFileSync(skillPath, 'utf8')).toBe('# locally edited\n');

    const forced = installAgentSkill({ projectRoot, packageRoot: defaultPackageRoot, force: true });
    expect(forced.status).toBe('updated');
    expect(readFileSync(skillPath, 'utf8')).toContain('name: tt-design-system');
  });

  it('does not overwrite an unrelated existing skill directory', () => {
    const projectRoot = temporaryProject();
    const destination = join(projectRoot, '.agents', 'skills', SKILL_NAME);
    mkdirSync(destination, { recursive: true });
    writeFileSync(join(destination, 'SKILL.md'), '# custom skill\n');

    const result = installAgentSkill({ projectRoot, packageRoot: defaultPackageRoot });
    expect(result.status).toBe('conflict');
    expect(readFileSync(join(destination, 'SKILL.md'), 'utf8')).toBe('# custom skill\n');
  });

  it('treats a marker without a verifiable content hash as a conflict', () => {
    const projectRoot = temporaryProject();
    installAgentSkill({ projectRoot, packageRoot: defaultPackageRoot });
    const destination = join(projectRoot, '.agents', 'skills', SKILL_NAME);
    const markerPath = join(destination, MANAGED_MARKER);
    const marker = JSON.parse(readFileSync(markerPath, 'utf8'));
    delete marker.contentHash;
    writeFileSync(markerPath, `${JSON.stringify(marker, null, 2)}\n`);

    const result = installAgentSkill({ projectRoot, packageRoot: defaultPackageRoot });
    expect(result.status).toBe('conflict');
    expect(readFileSync(join(destination, 'SKILL.md'), 'utf8')).toContain('name: tt-design-system');
  });
});
