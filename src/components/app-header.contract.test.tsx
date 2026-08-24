import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AppHeader } from './AppShell';

describe('AppHeader title layout', () => {
  it('left aligns the title between occupied toolbar slots', () => {
    const noop = () => undefined;
    const markup = renderToStaticMarkup(
      <AppHeader
        title="Common opponents"
        heading
        leftAction={{
          iconClassName: 'fas fa-chevron-left',
          onClick: noop,
          position: 1,
          ariaLabel: 'Back',
        }}
        actions={[{
          iconClassName: 'fas fa-comment-dots',
          onClick: noop,
          position: 4,
          ariaLabel: 'Send feedback',
        }]}
      />,
    );

    expect(markup).toContain('left:55px');
    expect(markup).toContain('right:55px');
    expect(markup).toContain('text-align:left');
    expect(markup).toContain('text-overflow:ellipsis');
  });

  it('allows a wider action to reserve additional title space', () => {
    const markup = renderToStaticMarkup(
      <AppHeader
        title="My TT"
        actions={[{
          iconClassName: 'fab fa-google',
          onClick: () => undefined,
          position: 3,
          ariaLabel: 'Sign in with Google',
          titleInset: 120,
        }]}
      />,
    );

    expect(markup).toContain('right:120px');
  });
});
