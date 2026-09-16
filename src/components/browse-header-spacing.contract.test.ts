import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const browseHeaderCss = readFileSync(new URL('../styles/browse-header.css', import.meta.url), 'utf8');

describe('BrowseHeader spacing contract', () => {
  it('uses the compact root-content inset after the in-flow browse header', () => {
    expect(browseHeaderCss).toContain(`.tt-browse-page .tt-root-content,\n.tt-browse-header ~ .tt-root-content {\n  padding-top: var(--tt-space-1);\n}`);
    expect(browseHeaderCss).not.toContain(`.tt-browse-page .tt-root-content,\n.tt-browse-header ~ .tt-root-content {\n  padding-top: var(--tt-space-2);\n}`);
  });
});
