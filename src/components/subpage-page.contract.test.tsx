import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SegmentedToggle, SubpagePage } from '../index';

const layoutCss = readFileSync(new URL('../styles/page-layouts.css', import.meta.url), 'utf8');

describe('SubpagePage navigation contract', () => {
  it('renders peer-page navigation between the header and scrolling page content', () => {
    const markup = renderToStaticMarkup(
      <SubpagePage header={<header>Toolbar</header>} tabs={<nav>Sections</nav>}>
        <main>Profile</main>
      </SubpagePage>,
    );

    expect(markup).toContain('tt-detail-page tt-subpage-page');
    expect(markup).toContain('<div class="tt-subpage-page__tabs"><nav>Sections</nav></div>');
    expect(markup.indexOf('Toolbar')).toBeLessThan(markup.indexOf('Sections'));
    expect(markup.indexOf('Sections')).toBeLessThan(markup.indexOf('Profile'));
  });

  it('pins tabs below the toolbar and removes legacy spacer padding', () => {
    expect(layoutCss).toMatch(/\.tt-app-header-spacer\s*\{[^}]*padding:\s*0\s*!important;/s);
    expect(layoutCss).toMatch(/\.tt-subpage-page__tabs\s*\{[^}]*position:\s*sticky;[^}]*top:\s*var\(--tt-subpage-tabs-top,/s);
  });

  it('supports horizontally scrollable one-line tabs', () => {
    const markup = renderToStaticMarkup(
      <SegmentedToggle
        ariaLabel="Sections"
        options={[
          { value: 'profile', label: 'Profile' },
          { value: 'journal', label: 'Journal' },
          { value: 'entries', label: 'Tournament entries' },
        ]}
        value="profile"
        onChange={() => undefined}
        variant="tab"
        full
        scrollable
      />,
    );

    expect(markup).toContain('tt-segmented--scrollable');
    expect(layoutCss).toMatch(/\.tt-segmented--scrollable\s*\{[^}]*overflow-x:\s*auto;/s);
    expect(layoutCss).toMatch(/\.tt-segmented--scrollable \.tt-segmented__btn\s*\{[^}]*white-space:\s*nowrap;/s);
  });
});
