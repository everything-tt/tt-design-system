export interface PWAUiState {
  showInstallSheet: boolean;
  showIosSheet: boolean;
  showUpdateSheet: boolean;
  isStandalone: boolean;
}

export type PWAUiAction =
  | { type: 'install-prompt-available' }
  | { type: 'ios-prompt-available' }
  | { type: 'install-finished'; accepted: boolean }
  | { type: 'app-installed' }
  | { type: 'dismiss-install' }
  | { type: 'update-available' }
  | { type: 'dismiss-update' };

export type PWAUpdateStrategy = 'prompt' | 'auto' | 'auto-when-safe';
export type PWAUnsafeUpdateBehavior = 'prompt' | 'wait';
export type PWAUpdateAction = 'prompt' | 'update' | 'wait';

export interface GetPWAUpdateActionOptions {
  strategy: PWAUpdateStrategy;
  canReload: boolean;
  unsafeBehavior: PWAUnsafeUpdateBehavior;
}

export function getPWAUpdateAction({
  strategy,
  canReload,
  unsafeBehavior,
}: GetPWAUpdateActionOptions): PWAUpdateAction {
  if (strategy === 'prompt') return 'prompt';
  if (strategy === 'auto') return 'update';
  if (canReload) return 'update';
  return unsafeBehavior;
}

export interface PWAUpdateMarkerStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function recordPWAUpdateReloadMarker(
  storage: PWAUpdateMarkerStorage | null,
  key: string,
): void {
  try {
    storage?.setItem(key, '1');
  } catch {
    return;
  }
}

export function clearPWAUpdateReloadMarker(
  storage: PWAUpdateMarkerStorage | null,
  key: string,
): void {
  try {
    storage?.removeItem(key);
  } catch {
    return;
  }
}

export function consumePWAUpdateReloadMarker(
  storage: PWAUpdateMarkerStorage | null,
  key: string,
): boolean {
  if (!storage) return false;
  try {
    const wasUpdated = storage.getItem(key) === '1';
    if (wasUpdated) storage.removeItem(key);
    return wasUpdated;
  } catch {
    return false;
  }
}

export function createInitialPWAUiState(isStandalone: boolean): PWAUiState {
  return {
    showInstallSheet: false,
    showIosSheet: false,
    showUpdateSheet: false,
    isStandalone,
  };
}

export function pwaUiReducer(state: PWAUiState, action: PWAUiAction): PWAUiState {
  switch (action.type) {
    case 'install-prompt-available':
      return state.isStandalone ? state : { ...state, showInstallSheet: true };
    case 'ios-prompt-available':
      return state.isStandalone ? state : { ...state, showIosSheet: true };
    case 'install-finished':
      return {
        ...state,
        showInstallSheet: false,
        isStandalone: action.accepted || state.isStandalone,
      };
    case 'app-installed':
      return {
        ...state,
        showInstallSheet: false,
        showIosSheet: false,
        isStandalone: true,
      };
    case 'dismiss-install':
      return { ...state, showInstallSheet: false, showIosSheet: false };
    case 'update-available':
      return { ...state, showUpdateSheet: true };
    case 'dismiss-update':
      return { ...state, showUpdateSheet: false };
    default:
      return state;
  }
}

export interface RunPWAUpdateOptions {
  onBeforeUpdate?: () => void | Promise<void>;
  persistStorageBeforeUpdate: boolean;
  requestPersistentStorage: () => Promise<boolean>;
  activateUpdate: () => Promise<void>;
}

export async function runPWAUpdate({
  onBeforeUpdate,
  persistStorageBeforeUpdate,
  requestPersistentStorage,
  activateUpdate,
}: RunPWAUpdateOptions): Promise<void> {
  await onBeforeUpdate?.();
  if (persistStorageBeforeUpdate) await requestPersistentStorage();
  await activateUpdate();
}
