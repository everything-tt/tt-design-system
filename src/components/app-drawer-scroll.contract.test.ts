import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const drawerSource = readFileSync(new URL('./AppDrawer.tsx', import.meta.url), 'utf8');
const shellCss = readFileSync(new URL('../styles/app-shell.css', import.meta.url), 'utf8');
const drawerPolishCss = readFileSync(new URL('../styles/drawer-polish.css', import.meta.url), 'utf8');

describe('AppDrawer scrolling contract', () => {
  it('owns scrolling in a dedicated drawer scroll region', () => {
    expect(drawerSource).toContain('<div className="tt-drawer__scroll">');
    expect(shellCss).toMatch(/\.tt-drawer__scroll\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;/s);
  });

  it('neutralises legacy nested drawer content scrollers', () => {
    expect(drawerPolishCss).toMatch(/\.tt-drawer__scroll\s*>\s*\.tt-drawer__content\s*\{[^}]*overflow:\s*visible\s*!important;[^}]*overscroll-behavior:\s*auto\s*!important;/s);
  });
});
