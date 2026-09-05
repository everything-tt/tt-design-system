export interface PWARepairRegistration {
  unregister(): Promise<boolean>;
}

export interface PWARepairEnvironment {
  getServiceWorkerRegistrations(): Promise<readonly PWARepairRegistration[]>;
  getCacheNames(): Promise<string[]>;
  deleteCache(name: string): Promise<boolean>;
  reloadFresh(): void;
}

export interface RunPWARepairOptions {
  environment: PWARepairEnvironment;
  onBeforeRepair?: () => void | Promise<void>;
  cacheFilter?: (cacheName: string) => boolean;
}

/**
 * Remove the service-worker/cache layer while deliberately leaving application
 * storage (localStorage and IndexedDB) alone, then load the current URL again.
 */
export async function runPWARepair({
  environment,
  onBeforeRepair,
  cacheFilter = () => true,
}: RunPWARepairOptions): Promise<void> {
  await onBeforeRepair?.();

  const registrations = await environment.getServiceWorkerRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  const cacheNames = await environment.getCacheNames();
  await Promise.all(
    cacheNames
      .filter(cacheFilter)
      .map((cacheName) => environment.deleteCache(cacheName)),
  );

  environment.reloadFresh();
}

export function createBrowserPWARepairEnvironment(
  cacheBustParam = '__pwa_repair',
): PWARepairEnvironment {
  return {
    async getServiceWorkerRegistrations() {
      if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return [];
      return navigator.serviceWorker.getRegistrations();
    },
    async getCacheNames() {
      if (typeof caches === 'undefined') return [];
      return caches.keys();
    },
    async deleteCache(name) {
      if (typeof caches === 'undefined') return false;
      return caches.delete(name);
    },
    reloadFresh() {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      url.searchParams.set(cacheBustParam, Date.now().toString());
      window.location.replace(url.toString());
    },
  };
}
