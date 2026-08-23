import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INSTALL_PROMPT_COOLDOWN_MS,
  isInstallPromptDue,
  isIOSUserAgent,
} from './install-policy';

describe('PWA install policy', () => {
  it('allows a prompt when no previous dismissal exists', () => {
    expect(isInstallPromptDue(null, 1000)).toBe(true);
  });

  it('honours the dismissal cooldown', () => {
    const now = 2 * DEFAULT_INSTALL_PROMPT_COOLDOWN_MS;
    expect(isInstallPromptDue(String(now - 1000), now)).toBe(false);
    expect(isInstallPromptDue(String(now - DEFAULT_INSTALL_PROMPT_COOLDOWN_MS), now)).toBe(true);
  });

  it('treats malformed timestamps as promptable', () => {
    expect(isInstallPromptDue('not-a-number', 1000)).toBe(true);
  });

  it('detects iPhone and iPad user agents', () => {
    expect(isIOSUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe(true);
    expect(isIOSUserAgent('Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)')).toBe(true);
  });

  it('detects modern iPad desktop-class user agents by touch capability', () => {
    expect(isIOSUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(true);
    expect(isIOSUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(false);
  });
});
