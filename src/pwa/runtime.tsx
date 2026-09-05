import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import {
  DEFAULT_INSTALL_PROMPT_COOLDOWN_MS,
  DEFAULT_INSTALL_PROMPT_STORAGE_KEY,
  isInstallPromptDue,
  isIOSUserAgent,
} from './install-policy';
import {
  clearPWAUpdateReloadMarker,
  consumePWAUpdateReloadMarker,
  createInitialPWAUiState,
  getPWAUpdateAction,
  pwaUiReducer,
  recordPWAUpdateReloadMarker,
  runPWAUpdate,
  type PWAUnsafeUpdateBehavior,
  type PWAUpdateStrategy,
} from './runtime-state';
import { createBrowserPWARepairEnvironment, runPWARepair } from './repair';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean };
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const DEFAULT_UPDATE_MARKER_STORAGE_KEY = 'tt:pwa:update-reload';

export type PWAUpdateState =
  | { status: 'idle' }
  | { status: 'updating' }
  | { status: 'repairing' }
  | { status: 'failed'; operation: 'update' | 'repair'; error: unknown };

export interface PWAContextValue {
  showInstallSheet: boolean;
  showIosSheet: boolean;
  showUpdateSheet: boolean;
  showUpdatedNotice: boolean;
  install: () => Promise<void>;
  /** Compatibility alias retained for consumers migrating from @tt-players/pwa. */
  dismiss: () => void;
  dismissInstall: () => void;
  triggerInstallPrompt: () => void;
  /** Returns false instead of throwing when activation fails. */
  updateApp: () => Promise<boolean>;
  /** Clears service workers and Cache Storage, preserves app data, then reloads fresh. */
  repairApp: () => Promise<boolean>;
  dismissUpdate: () => void;
  dismissUpdatedNotice: () => void;
  canInstall: boolean;
  canUpdate: boolean;
  isIOS: boolean;
  updateState: PWAUpdateState;
}

export interface PWAProviderProps {
  children: ReactNode;
  promptStorageKey?: string;
  promptCooldownMs?: number;
  onBeforeUpdate?: () => void | Promise<void>;
  /** Optional app-owned backup hook before a destructive PWA repair. Defaults to onBeforeUpdate. */
  onBeforeRepair?: () => void | Promise<void>;
  persistStorageBeforeUpdate?: boolean;
  onRegisterError?: (error: unknown) => void;
  /**
   * Controls how a downloaded service-worker update is activated.
   * `prompt` preserves the existing user-controlled update flow.
   * `auto` always activates immediately.
   * `auto-when-safe` activates only while `canReload` is true.
   */
  updateStrategy?: PWAUpdateStrategy;
  /** App-owned safety signal used by `auto-when-safe`. */
  canReload?: boolean;
  /** What to do while `auto-when-safe` cannot reload. */
  unsafeUpdateBehavior?: PWAUnsafeUpdateBehavior;
  /** Session-storage key used to show the one-time post-reload update notice. */
  updateMarkerStorageKey?: string;
  /** Restrict emergency cache removal when an origin hosts caches unrelated to this PWA. */
  repairCacheFilter?: (cacheName: string) => boolean;
}

const PWAContext = createContext<PWAContextValue | null>(null);

function getLocalStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getSessionStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as NavigatorWithStandalone).standalone);
}

function detectIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return isIOSUserAgent(navigator.userAgent, navigator.maxTouchPoints)
    && !(window as Window & { MSStream?: unknown }).MSStream;
}

function shouldPrompt(storage: StorageLike | null, key: string, cooldownMs: number): boolean {
  if (!storage) return true;
  try {
    return isInstallPromptDue(storage.getItem(key), Date.now(), cooldownMs);
  } catch {
    return true;
  }
}

function recordPromptDismissal(storage: StorageLike | null, key: string): void {
  try {
    storage?.setItem(key, Date.now().toString());
  } catch {
    return;
  }
}

function clearPromptDismissal(storage: StorageLike | null, key: string): void {
  try {
    storage?.removeItem(key);
  } catch {
    return;
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  if (!('storage' in navigator) || typeof navigator.storage.persist !== 'function') return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export function PWAProvider({
  children,
  promptStorageKey = DEFAULT_INSTALL_PROMPT_STORAGE_KEY,
  promptCooldownMs = DEFAULT_INSTALL_PROMPT_COOLDOWN_MS,
  onBeforeUpdate,
  onBeforeRepair,
  persistStorageBeforeUpdate = true,
  onRegisterError,
  updateStrategy = 'prompt',
  canReload = false,
  unsafeUpdateBehavior = 'prompt',
  updateMarkerStorageKey = DEFAULT_UPDATE_MARKER_STORAGE_KEY,
  repairCacheFilter,
}: PWAProviderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [uiState, dispatch] = useReducer(
    pwaUiReducer,
    undefined,
    () => createInitialPWAUiState(isStandaloneMode()),
  );
  const [isIOS] = useState(detectIOS);
  const [showUpdatedNotice, setShowUpdatedNotice] = useState(false);
  const [updateState, setUpdateState] = useState<PWAUpdateState>({ status: 'idle' });
  const updateInFlightRef = useRef<Promise<boolean> | null>(null);
  const repairInFlightRef = useRef<Promise<boolean> | null>(null);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {},
    onRegisterError(error) {
      onRegisterError?.(error);
    },
  });

  useEffect(() => {
    if (consumePWAUpdateReloadMarker(getSessionStorage(), updateMarkerStorageKey)) {
      setShowUpdatedNotice(true);
    }
  }, [updateMarkerStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const storage = getLocalStorage();
    const installPromptHandler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      if (shouldPrompt(storage, promptStorageKey, promptCooldownMs)) {
        dispatch({ type: 'install-prompt-available' });
      }
    };
    const installedHandler = () => {
      setDeferredPrompt(null);
      dispatch({ type: 'app-installed' });
    };

    window.addEventListener('beforeinstallprompt', installPromptHandler);
    window.addEventListener('appinstalled', installedHandler);

    if (isIOS && !uiState.isStandalone && shouldPrompt(storage, promptStorageKey, promptCooldownMs)) {
      dispatch({ type: 'ios-prompt-available' });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', installPromptHandler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, [isIOS, promptCooldownMs, promptStorageKey, uiState.isStandalone]);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === 'dismissed') {
      recordPromptDismissal(getLocalStorage(), promptStorageKey);
    }
    dispatch({ type: 'install-finished', accepted: choice.outcome === 'accepted' });
  }, [deferredPrompt, promptStorageKey]);

  const dismissInstall = useCallback(() => {
    recordPromptDismissal(getLocalStorage(), promptStorageKey);
    dispatch({ type: 'dismiss-install' });
  }, [promptStorageKey]);

  const triggerInstallPrompt = useCallback(() => {
    if (uiState.isStandalone) return;
    clearPromptDismissal(getLocalStorage(), promptStorageKey);
    if (isIOS) {
      dispatch({ type: 'ios-prompt-available' });
    } else if (deferredPrompt) {
      dispatch({ type: 'install-prompt-available' });
    }
  }, [deferredPrompt, isIOS, promptStorageKey, uiState.isStandalone]);

  const updateApp = useCallback((): Promise<boolean> => {
    if (updateInFlightRef.current) return updateInFlightRef.current;

    const storage = getSessionStorage();
    recordPWAUpdateReloadMarker(storage, updateMarkerStorageKey);
    setUpdateState({ status: 'updating' });

    const updatePromise = runPWAUpdate({
      onBeforeUpdate,
      persistStorageBeforeUpdate,
      requestPersistentStorage,
      activateUpdate: () => updateServiceWorker(true),
    })
      .then(() => {
        setUpdateState({ status: 'idle' });
        return true;
      })
      .catch((error: unknown) => {
        clearPWAUpdateReloadMarker(storage, updateMarkerStorageKey);
        setUpdateState({ status: 'failed', operation: 'update', error });
        dispatch({ type: 'update-available' });
        return false;
      })
      .finally(() => {
        if (updateInFlightRef.current === updatePromise) {
          updateInFlightRef.current = null;
        }
      });

    updateInFlightRef.current = updatePromise;
    return updatePromise;
  }, [onBeforeUpdate, persistStorageBeforeUpdate, updateMarkerStorageKey, updateServiceWorker]);

  const repairApp = useCallback((): Promise<boolean> => {
    if (repairInFlightRef.current) return repairInFlightRef.current;

    const storage = getSessionStorage();
    recordPWAUpdateReloadMarker(storage, updateMarkerStorageKey);
    setUpdateState({ status: 'repairing' });

    const repairPromise = runPWARepair({
      environment: createBrowserPWARepairEnvironment(),
      cacheFilter: repairCacheFilter,
      onBeforeRepair: async () => {
        await (onBeforeRepair ?? onBeforeUpdate)?.();
        if (persistStorageBeforeUpdate) await requestPersistentStorage();
      },
    })
      .then(() => {
        setUpdateState({ status: 'idle' });
        return true;
      })
      .catch((error: unknown) => {
        clearPWAUpdateReloadMarker(storage, updateMarkerStorageKey);
        setUpdateState({ status: 'failed', operation: 'repair', error });
        dispatch({ type: 'update-available' });
        return false;
      })
      .finally(() => {
        if (repairInFlightRef.current === repairPromise) {
          repairInFlightRef.current = null;
        }
      });

    repairInFlightRef.current = repairPromise;
    return repairPromise;
  }, [onBeforeRepair, onBeforeUpdate, persistStorageBeforeUpdate, repairCacheFilter, updateMarkerStorageKey]);

  useEffect(() => {
    if (!needRefresh) return;

    const action = getPWAUpdateAction({
      strategy: updateStrategy,
      canReload,
      unsafeBehavior: unsafeUpdateBehavior,
    });

    if (action === 'prompt') {
      dispatch({ type: 'update-available' });
      return;
    }

    if (action === 'wait') {
      dispatch({ type: 'dismiss-update' });
      return;
    }

    dispatch({ type: 'dismiss-update' });
    void updateApp();
  }, [canReload, needRefresh, unsafeUpdateBehavior, updateApp, updateStrategy]);

  const dismissUpdate = useCallback(() => {
    dispatch({ type: 'dismiss-update' });
    setUpdateState((current) => current.status === 'failed' ? { status: 'idle' } : current);
  }, []);

  const dismissUpdatedNotice = useCallback(() => {
    setShowUpdatedNotice(false);
  }, []);

  const canInstall = !uiState.isStandalone && (Boolean(deferredPrompt) || isIOS);

  return (
    <PWAContext.Provider
      value={{
        showInstallSheet: uiState.showInstallSheet,
        showIosSheet: uiState.showIosSheet,
        showUpdateSheet: uiState.showUpdateSheet,
        showUpdatedNotice,
        install,
        dismiss: dismissInstall,
        dismissInstall,
        triggerInstallPrompt,
        updateApp,
        repairApp,
        dismissUpdate,
        dismissUpdatedNotice,
        canInstall,
        canUpdate: needRefresh,
        isIOS,
        updateState,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA(): PWAContextValue {
  const context = useContext(PWAContext);
  if (!context) throw new Error('usePWA must be used within PWAProvider');
  return context;
}
