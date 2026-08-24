import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const primitivesCss = readFileSync(new URL('../styles/primitives.css', import.meta.url), 'utf8');

describe('PageSection surface padding contract', () => {
  it('applies compact density padding to raised and hero surfaces', () => {
    expect(primitivesCss).toContain(
      '.tt-section--compact.tt-section--raised,.tt-section--compact.tt-section--hero{padding:var(--tt-space-3)}',
    );
  });

  it('applies standard density padding to raised and hero surfaces', () => {
    expect(primitivesCss).toContain(
      '.tt-section--standard.tt-section--raised,.tt-section--standard.tt-section--hero{padding:var(--tt-space-4)}',
    );
  });
});
