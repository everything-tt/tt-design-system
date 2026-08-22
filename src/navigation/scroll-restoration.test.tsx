import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  ScrollRestorationController,
  ScrollRestorationProvider,
  captureScrollSnapshot,
  getNavigationRestorationAction,
  restoreScrollSnapshot,
} from './scroll-restoration';
import { ScrollAnchor, ScrollArea } from '../components/ScrollArea';
import { SelectableText } from '../components/SelectableText';
import { IconButton } from '../components/IconButton';

const snapshot = (scrollTop: number, id?: string) => ({
  scrollTop,
  anchor: id ? { id, offset: 12 } : undefined,
});

function fakeAnchor(id: string, top: number, height = 40): HTMLElement {
  return {
    dataset: { scrollAnchor: id },
    getBoundingClientRect: () => ({
      top,
      bottom: top + height,
      left: 0,
      right: 0,
      width: 100,
      height,
      x: 0,
      y: top,
      toJSON: () => ({}),
    } as DOMRect),
  } as HTMLElement;
}

function fakeTarget({
  scrollTop = 0,
  scrollHeight = 1600,
  clientHeight = 300,
  top = 100,
  anchors = [],
}: {
  scrollTop?: number;
  scrollHeight?: number;
  clientHeight?: number;
  top?: number;
  anchors?: HTMLElement[];
} = {}): HTMLElement {
  return {
    scrollTop,
    scrollHeight,
    clientHeight,
    dataset: {},
    getBoundingClientRect: () => ({
      top,
      bottom: top + clientHeight,
      left: 0,
      right: 0,
      width: 300,
      height: clientHeight,
      x: 0,
      y: top,
      toJSON: () => ({}),
    } as DOMRect),
    querySelectorAll: () => anchors as unknown as NodeListOf<HTMLElement>,
  } as HTMLElement;
}

describe('scroll restoration foundations', () => {
  it('defines PUSH, POP and REPLACE semantics explicitly', () => {
    expect(getNavigationRestorationAction('PUSH')).toBe('reset');
    expect(getNavigationRestorationAction('POP')).toBe('restore');
    expect(getNavigationRestorationAction('REPLACE')).toBe('preserve');
  });

  it('bounds restoration state using least-recently-used cleanup', () => {
    const controller = new ScrollRestorationController({ maxEntries: 2 });
    controller.save('a', snapshot(10));
    controller.save('b', snapshot(20));
    expect(controller.get('a')?.scrollTop).toBe(10);

    controller.save('c', snapshot(30));
    expect(controller.size).toBe(2);
    expect(controller.get('b')).toBeUndefined();
    expect(controller.get('a')?.scrollTop).toBe(10);
    expect(controller.get('c')?.scrollTop).toBe(30);
  });

  it('moves an entry when history REPLACE changes its key', () => {
    const controller = new ScrollRestorationController();
    controller.save('old', snapshot(320, 'player:42'));
    controller.replaceKey('old', 'new');

    expect(controller.get('old')).toBeUndefined();
    expect(controller.get('new')).toEqual(snapshot(320, 'player:42'));
  });

  it('captures the first visible stable anchor and its relative offset', () => {
    const target = fakeTarget({
      scrollTop: 640,
      top: 100,
      clientHeight: 200,
      anchors: [
        fakeAnchor('player:1', 40),
        fakeAnchor('player:42', 130),
        fakeAnchor('player:43', 180),
      ],
    });

    expect(captureScrollSnapshot(target)).toEqual({
      scrollTop: 640,
      anchor: { id: 'player:42', offset: 30 },
    });
  });

  it('restores by logical anchor before using the raw pixel fallback', () => {
    const anchor = fakeAnchor('player:42', 280);
    const target = fakeTarget({ scrollTop: 600, top: 100, anchors: [anchor] });

    const result = restoreScrollSnapshot(target, {
      scrollTop: 920,
      anchor: { id: 'player:42', offset: 40 },
    });

    expect(result).toBe('restored');
    expect(target.scrollTop).toBe(740);
  });

  it('falls back to raw pixels when a saved anchor is no longer mounted', () => {
    const target = fakeTarget({ scrollTop: 100, scrollHeight: 1800, clientHeight: 300 });

    const result = restoreScrollSnapshot(target, {
      scrollTop: 700,
      anchor: { id: 'removed-player', offset: 20 },
    });

    expect(result).toBe('restored');
    expect(target.scrollTop).toBe(700);
  });

  it('asks a virtualizer adapter to mount an unavailable anchor before retrying', () => {
    const ensureAnchorVisible = vi.fn();
    const target = fakeTarget();

    const result = restoreScrollSnapshot(
      target,
      { scrollTop: 900, anchor: { id: 'player:78', offset: 25 } },
      { adapter: { ensureAnchorVisible } },
    );

    expect(result).toBe('waiting');
    expect(ensureAnchorVisible).toHaveBeenCalledWith('player:78');
  });

  it('renders selectable, anchor, nested-scroll and accessible icon contracts', () => {
    const markup = renderToStaticMarkup(
      <ScrollRestorationProvider navigationKey="entry-1" navigationType="PUSH">
        <ScrollArea restoreScroll restorationId="results">
          <ScrollAnchor anchorId="player:42">
            <SelectableText>Registration 123456</SelectableText>
          </ScrollAnchor>
          <IconButton ariaLabel="Open actions">•••</IconButton>
        </ScrollArea>
      </ScrollRestorationProvider>,
    );

    expect(markup).toContain('class="tt-scroll-area"');
    expect(markup).toContain('data-scroll-container="results"');
    expect(markup).toContain('data-scroll-anchor="player:42"');
    expect(markup).toContain('data-selectable="true"');
    expect(markup).toContain('aria-label="Open actions"');
    expect(markup).toContain('tt-btn--icon-only');
  });
});
