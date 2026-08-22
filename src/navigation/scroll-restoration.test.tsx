import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  ScrollRestorationController,
  ScrollRestorationProvider,
  getNavigationRestorationAction,
} from './scroll-restoration';
import { ScrollAnchor, ScrollArea } from '../components/ScrollArea';
import { SelectableText } from '../components/SelectableText';
import { IconButton } from '../components/IconButton';

const snapshot = (scrollTop: number, id?: string) => ({
  scrollTop,
  anchor: id ? { id, offset: 12 } : undefined,
});

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
