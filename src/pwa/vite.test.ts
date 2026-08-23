import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PWA_ASSETS,
  DEFAULT_PWA_GLOB_PATTERNS,
  withPWADefaults,
} from './vite';

describe('withPWADefaults', () => {
  it('applies shared prompt, asset and Workbox defaults', () => {
    expect(withPWADefaults({})).toEqual({
      registerType: 'prompt',
      includeAssets: [...DEFAULT_PWA_ASSETS],
      workbox: { globPatterns: [...DEFAULT_PWA_GLOB_PATTERNS] },
    });
  });

  it('preserves app-specific options and overrides', () => {
    const configured = withPWADefaults({
      registerType: 'autoUpdate' as const,
      includeAssets: ['app.svg'],
      workbox: { globPatterns: ['**/*.js'] },
      manifest: { name: 'Example' },
    });

    expect(configured.registerType).toBe('autoUpdate');
    expect(configured.includeAssets).toEqual(['app.svg']);
    expect(configured.workbox.globPatterns).toEqual(['**/*.js']);
    expect(configured.manifest).toEqual({ name: 'Example' });
  });
});
