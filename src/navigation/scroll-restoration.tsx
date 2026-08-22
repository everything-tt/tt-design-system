import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefCallback,
} from 'react';

export type NavigationType = 'PUSH' | 'POP' | 'REPLACE';
export type NavigationRestorationAction = 'reset' | 'restore' | 'preserve';
export type ScrollRestorationTarget = HTMLElement | Window;

export interface ScrollAnchorSnapshot {
  id: string;
  /** Anchor top relative to the scroll container viewport when the snapshot was captured. */
  offset: number;
}

export interface ScrollSnapshot {
  scrollTop: number;
  anchor?: ScrollAnchorSnapshot;
}

/**
 * Optional bridge for virtualized lists. The design system asks the consumer to
 * make an item mountable, then retries normal anchor restoration on subsequent
 * animation frames. It deliberately does not depend on a virtualizer library.
 */
export interface ScrollRestorationAdapter {
  ensureAnchorVisible: (anchorId: string) => void;
}

export interface ScrollRestorationControllerOptions {
  maxEntries?: number;
}

export class ScrollRestorationController {
  private readonly snapshots = new Map<string, ScrollSnapshot>();
  private readonly maxEntries: number;

  constructor({ maxEntries = 100 }: ScrollRestorationControllerOptions = {}) {
    this.maxEntries = Math.max(1, Math.floor(maxEntries));
  }

  get size() {
    return this.snapshots.size;
  }

  get(key: string): ScrollSnapshot | undefined {
    const snapshot = this.snapshots.get(key);
    if (!snapshot) return undefined;

    // Touch the entry so cleanup follows least-recently-used behaviour.
    this.snapshots.delete(key);
    this.snapshots.set(key, snapshot);
    return cloneSnapshot(snapshot);
  }

  save(key: string, snapshot: ScrollSnapshot) {
    this.snapshots.delete(key);
    this.snapshots.set(key, cloneSnapshot(snapshot));

    while (this.snapshots.size > this.maxEntries) {
      const oldestKey = this.snapshots.keys().next().value as string | undefined;
      if (!oldestKey) break;
      this.snapshots.delete(oldestKey);
    }
  }

  delete(key: string) {
    this.snapshots.delete(key);
  }

  replaceKey(previousKey: string, nextKey: string) {
    if (previousKey === nextKey) return;
    const snapshot = this.snapshots.get(previousKey);
    this.snapshots.delete(previousKey);
    if (snapshot) this.save(nextKey, snapshot);
  }

  clear() {
    this.snapshots.clear();
  }
}

interface ScrollRestorationContextValue {
  navigationKey: string;
  navigationType: NavigationType;
  controller: ScrollRestorationController;
}

const ScrollRestorationContext = createContext<ScrollRestorationContextValue | null>(null);

export interface ScrollRestorationProviderProps {
  navigationKey: string;
  navigationType: NavigationType;
  children: ReactNode;
  controller?: ScrollRestorationController;
  maxEntries?: number;
  /** Set history.scrollRestoration='manual' while the provider is mounted. */
  manageBrowserRestoration?: boolean;
}

export function ScrollRestorationProvider({
  navigationKey,
  navigationType,
  children,
  controller,
  maxEntries = 100,
  manageBrowserRestoration = true,
}: ScrollRestorationProviderProps) {
  const internalControllerRef = useRef<ScrollRestorationController | null>(null);
  if (!internalControllerRef.current) {
    internalControllerRef.current = new ScrollRestorationController({ maxEntries });
  }

  const activeController = controller ?? internalControllerRef.current;
  const value = useMemo<ScrollRestorationContextValue>(() => ({
    navigationKey,
    navigationType,
    controller: activeController,
  }), [activeController, navigationKey, navigationType]);

  useLayoutEffect(() => {
    if (!manageBrowserRestoration || typeof window === 'undefined') return undefined;
    if (!('scrollRestoration' in window.history)) return undefined;

    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, [manageBrowserRestoration]);

  return (
    <ScrollRestorationContext.Provider value={value}>
      {children}
    </ScrollRestorationContext.Provider>
  );
}

export function getNavigationRestorationAction(type: NavigationType): NavigationRestorationAction {
  if (type === 'PUSH') return 'reset';
  if (type === 'POP') return 'restore';
  return 'preserve';
}

export function getRestorationStorageKey(navigationKey: string, restorationId: string) {
  return `${navigationKey}::${restorationId}`;
}

function cloneSnapshot(snapshot: ScrollSnapshot): ScrollSnapshot {
  return {
    scrollTop: snapshot.scrollTop,
    anchor: snapshot.anchor ? { ...snapshot.anchor } : undefined,
  };
}

function isWindowTarget(target: ScrollRestorationTarget): target is Window {
  return typeof window !== 'undefined' && target === window;
}

function getScrollTop(target: ScrollRestorationTarget) {
  return isWindowTarget(target) ? window.scrollY : target.scrollTop;
}

function setScrollTop(target: ScrollRestorationTarget, scrollTop: number) {
  const top = Math.max(0, scrollTop);
  if (isWindowTarget(target)) {
    window.scrollTo({ top, left: window.scrollX, behavior: 'auto' });
  } else {
    target.scrollTop = top;
  }
}

function getViewportTop(target: ScrollRestorationTarget) {
  return isWindowTarget(target) ? 0 : target.getBoundingClientRect().top;
}

function getViewportHeight(target: ScrollRestorationTarget) {
  return isWindowTarget(target) ? window.innerHeight : target.clientHeight;
}

function getMaxScrollTop(target: ScrollRestorationTarget) {
  if (isWindowTarget(target)) {
    const documentHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body?.scrollHeight ?? 0,
    );
    return Math.max(0, documentHeight - window.innerHeight);
  }
  return Math.max(0, target.scrollHeight - target.clientHeight);
}

function getAnchorScope(target: ScrollRestorationTarget): ParentNode {
  return isWindowTarget(target) ? document : target;
}

function findAnchor(
  target: ScrollRestorationTarget,
  selector: string,
  anchorId?: string,
): HTMLElement | undefined {
  const anchors = getAnchorScope(target).querySelectorAll<HTMLElement>(selector);
  if (anchorId != null) {
    return Array.from(anchors).find((anchor) => anchor.dataset.scrollAnchor === anchorId);
  }

  const viewportTop = getViewportTop(target);
  const viewportBottom = viewportTop + getViewportHeight(target);
  return Array.from(anchors).find((anchor) => {
    const rect = anchor.getBoundingClientRect();
    return rect.bottom > viewportTop && rect.top < viewportBottom;
  });
}

export function captureScrollSnapshot(
  target: ScrollRestorationTarget,
  anchorSelector = '[data-scroll-anchor]',
): ScrollSnapshot {
  const anchor = findAnchor(target, anchorSelector);
  const viewportTop = getViewportTop(target);

  return {
    scrollTop: getScrollTop(target),
    anchor: anchor?.dataset.scrollAnchor
      ? {
          id: anchor.dataset.scrollAnchor,
          offset: anchor.getBoundingClientRect().top - viewportTop,
        }
      : undefined,
  };
}

export type RestoreAttemptResult = 'restored' | 'waiting';

export function restoreScrollSnapshot(
  target: ScrollRestorationTarget,
  snapshot: ScrollSnapshot,
  options: {
    anchorSelector?: string;
    adapter?: ScrollRestorationAdapter;
  } = {},
): RestoreAttemptResult {
  const anchorSelector = options.anchorSelector ?? '[data-scroll-anchor]';

  if (snapshot.anchor) {
    const anchor = findAnchor(target, anchorSelector, snapshot.anchor.id);
    if (anchor) {
      const currentOffset = anchor.getBoundingClientRect().top - getViewportTop(target);
      setScrollTop(target, getScrollTop(target) + currentOffset - snapshot.anchor.offset);
      return 'restored';
    }

    if (options.adapter) {
      options.adapter.ensureAnchorVisible(snapshot.anchor.id);
      return 'waiting';
    }
  }

  if (snapshot.scrollTop <= getMaxScrollTop(target) + 1) {
    setScrollTop(target, snapshot.scrollTop);
    return 'restored';
  }

  return 'waiting';
}

function forcePixelFallback(target: ScrollRestorationTarget, snapshot: ScrollSnapshot) {
  setScrollTop(target, Math.min(snapshot.scrollTop, getMaxScrollTop(target)));
}

function setRestoringState(target: ScrollRestorationTarget, restoring: boolean) {
  const element = isWindowTarget(target) ? document.documentElement : target;
  if (restoring) element.dataset.scrollRestoring = 'true';
  else delete element.dataset.scrollRestoring;
}

function scheduleFrame(callback: FrameRequestCallback) {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(callback);
  return window.setTimeout(() => callback(Date.now()), 16);
}

function cancelScheduledFrame(frame: number | null) {
  if (frame == null) return;
  if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame);
  else window.clearTimeout(frame);
}

export interface ScrollRestorationOptions {
  restorationId: string;
  enabled?: boolean;
  contentReady?: boolean;
  anchorSelector?: string;
  adapter?: ScrollRestorationAdapter;
  /** Bounded layout retries after contentReady. */
  maxRestoreFrames?: number;
}

function useTargetScrollRestoration(
  getTarget: () => ScrollRestorationTarget | null,
  {
    restorationId,
    enabled = true,
    contentReady = true,
    anchorSelector = '[data-scroll-anchor]',
    adapter,
    maxRestoreFrames = 12,
  }: ScrollRestorationOptions,
) {
  const context = useContext(ScrollRestorationContext);
  const previousStorageKeyRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!context || !enabled) return undefined;
    const target = getTarget();
    if (!target) return undefined;

    const { navigationKey, navigationType, controller } = context;
    const storageKey = getRestorationStorageKey(navigationKey, restorationId);
    const previousStorageKey = previousStorageKeyRef.current;
    previousStorageKeyRef.current = storageKey;

    // REPLACE owns the current history entry rather than creating a second
    // restorable entry for the same visual screen.
    if (navigationType === 'REPLACE' && previousStorageKey && previousStorageKey !== storageKey) {
      controller.delete(previousStorageKey);
    }

    let cancelled = false;
    let pendingRestore = false;
    let scrollFrame: number | null = null;
    let restoreFrame: number | null = null;

    const save = () => {
      if (pendingRestore || cancelled) return;
      controller.save(storageKey, captureScrollSnapshot(target, anchorSelector));
    };

    const onScroll = () => {
      if (pendingRestore || scrollFrame != null) return;
      scrollFrame = scheduleFrame(() => {
        scrollFrame = null;
        save();
      });
    };

    target.addEventListener('scroll', onScroll, { passive: true });

    const action = getNavigationRestorationAction(navigationType);
    if (action === 'reset') {
      setScrollTop(target, 0);
      save();
    } else if (action === 'preserve') {
      save();
    } else {
      const snapshot = controller.get(storageKey);
      if (!snapshot) {
        setScrollTop(target, 0);
        save();
      } else {
        pendingRestore = true;
        setRestoringState(target, true);

        if (contentReady) {
          const frameLimit = Math.max(0, Math.floor(maxRestoreFrames));
          const attemptRestore = (attempt: number) => {
            if (cancelled) return;
            const result = restoreScrollSnapshot(target, snapshot, { anchorSelector, adapter });
            if (result === 'restored') {
              pendingRestore = false;
              setRestoringState(target, false);
              save();
              return;
            }

            if (attempt >= frameLimit) {
              forcePixelFallback(target, snapshot);
              pendingRestore = false;
              setRestoringState(target, false);
              save();
              return;
            }

            restoreFrame = scheduleFrame(() => attemptRestore(attempt + 1));
          };

          attemptRestore(0);
        }
      }
    }

    return () => {
      const wasPendingRestore = pendingRestore;
      cancelled = true;
      target.removeEventListener('scroll', onScroll);
      cancelScheduledFrame(scrollFrame);
      cancelScheduledFrame(restoreFrame);
      setRestoringState(target, false);
      if (!wasPendingRestore) {
        controller.save(storageKey, captureScrollSnapshot(target, anchorSelector));
      }
    };
  }, [
    adapter,
    anchorSelector,
    contentReady,
    context,
    enabled,
    getTarget,
    maxRestoreFrames,
    restorationId,
  ]);
}

export function useScrollRestorationRef<T extends HTMLElement>(
  options: ScrollRestorationOptions,
): RefCallback<T> {
  const elementRef = useRef<T | null>(null);
  const getTarget = useCallback(() => elementRef.current, []);
  useTargetScrollRestoration(getTarget, options);

  return useCallback((node: T | null) => {
    elementRef.current = node;
  }, []);
}

export function useWindowScrollRestoration(options: ScrollRestorationOptions) {
  const getTarget = useCallback<() => Window | null>(
    () => (typeof window === 'undefined' ? null : window),
    [],
  );
  useTargetScrollRestoration(getTarget, options);
}
