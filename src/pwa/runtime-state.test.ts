import { describe, expect, it, vi } from 'vitest';
import {
  createInitialPWAUiState,
  getPWAUpdateAction,
  pwaUiReducer,
  runPWAUpdate,
} from './runtime-state';

describe('PWA runtime state', () => {
  it('opens and dismisses install prompts', () => {
    const initial = createInitialPWAUiState(false);
    const open = pwaUiReducer(initial, { type: 'install-prompt-available' });
    expect(open.showInstallSheet).toBe(true);
    expect(pwaUiReducer(open, { type: 'dismiss-install' }).showInstallSheet).toBe(false);
  });

  it('does not open install prompts in standalone mode', () => {
    const standalone = createInitialPWAUiState(true);
    expect(pwaUiReducer(standalone, { type: 'install-prompt-available' })).toEqual(standalone);
    expect(pwaUiReducer(standalone, { type: 'ios-prompt-available' })).toEqual(standalone);
  });

  it('marks accepted installs as standalone', () => {
    const open = pwaUiReducer(createInitialPWAUiState(false), { type: 'install-prompt-available' });
    const installed = pwaUiReducer(open, { type: 'install-finished', accepted: true });
    expect(installed.isStandalone).toBe(true);
    expect(installed.showInstallSheet).toBe(false);
  });

  it('opens and dismisses update prompts', () => {
    const update = pwaUiReducer(createInitialPWAUiState(false), { type: 'update-available' });
    expect(update.showUpdateSheet).toBe(true);
    expect(pwaUiReducer(update, { type: 'dismiss-update' }).showUpdateSheet).toBe(false);
  });
});

describe('getPWAUpdateAction', () => {
  it('always prompts when prompt strategy is selected', () => {
    expect(getPWAUpdateAction({
      strategy: 'prompt',
      canReload: true,
      unsafeBehavior: 'wait',
    })).toBe('prompt');
  });

  it('always updates when auto strategy is selected', () => {
    expect(getPWAUpdateAction({
      strategy: 'auto',
      canReload: false,
      unsafeBehavior: 'prompt',
    })).toBe('update');
  });

  it('updates automatically when auto-when-safe is safe', () => {
    expect(getPWAUpdateAction({
      strategy: 'auto-when-safe',
      canReload: true,
      unsafeBehavior: 'prompt',
    })).toBe('update');
  });

  it('uses the configured unsafe behaviour when auto-when-safe is not safe', () => {
    expect(getPWAUpdateAction({
      strategy: 'auto-when-safe',
      canReload: false,
      unsafeBehavior: 'prompt',
    })).toBe('prompt');
    expect(getPWAUpdateAction({
      strategy: 'auto-when-safe',
      canReload: false,
      unsafeBehavior: 'wait',
    })).toBe('wait');
  });
});

describe('runPWAUpdate', () => {
  it('backs up app state, requests persistence, then activates the update', async () => {
    const calls: string[] = [];
    await runPWAUpdate({
      onBeforeUpdate: async () => { calls.push('backup'); },
      persistStorageBeforeUpdate: true,
      requestPersistentStorage: async () => { calls.push('persist'); return true; },
      activateUpdate: async () => { calls.push('activate'); },
    });
    expect(calls).toEqual(['backup', 'persist', 'activate']);
  });

  it('can skip persistent-storage requests', async () => {
    const requestPersistentStorage = vi.fn(async () => true);
    const activateUpdate = vi.fn(async () => undefined);
    await runPWAUpdate({
      persistStorageBeforeUpdate: false,
      requestPersistentStorage,
      activateUpdate,
    });
    expect(requestPersistentStorage).not.toHaveBeenCalled();
    expect(activateUpdate).toHaveBeenCalledOnce();
  });
});
