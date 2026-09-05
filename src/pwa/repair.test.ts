import { describe, expect, it, vi } from 'vitest';
import { runPWARepair, type PWARepairEnvironment } from './repair';

describe('runPWARepair', () => {
  it('backs up first, unregisters workers, clears matching caches, then reloads', async () => {
    const calls: string[] = [];
    const environment: PWARepairEnvironment = {
      getServiceWorkerRegistrations: async () => [
        { unregister: async () => { calls.push('unregister-a'); return true; } },
        { unregister: async () => { calls.push('unregister-b'); return true; } },
      ],
      getCacheNames: async () => ['workbox-precache', 'other-cache'],
      deleteCache: async (name) => { calls.push(`delete:${name}`); return true; },
      reloadFresh: () => { calls.push('reload'); },
    };

    await runPWARepair({
      environment,
      onBeforeRepair: () => { calls.push('backup'); },
      cacheFilter: (name) => name.startsWith('workbox-'),
    });

    expect(calls[0]).toBe('backup');
    expect(calls).toContain('unregister-a');
    expect(calls).toContain('unregister-b');
    expect(calls).toContain('delete:workbox-precache');
    expect(calls).not.toContain('delete:other-cache');
    expect(calls.at(-1)).toBe('reload');
  });

  it('does not reload when repair fails', async () => {
    const reloadFresh = vi.fn();
    const environment: PWARepairEnvironment = {
      getServiceWorkerRegistrations: async () => [
        { unregister: async () => { throw new Error('cannot unregister'); } },
      ],
      getCacheNames: async () => [],
      deleteCache: async () => true,
      reloadFresh,
    };

    await expect(runPWARepair({ environment })).rejects.toThrow('cannot unregister');
    expect(reloadFresh).not.toHaveBeenCalled();
  });
});
