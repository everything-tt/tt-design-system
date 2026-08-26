import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import { AppShellPage } from './AppShell';

interface BasePageLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  id?: string;
}

export interface BrowsePageProps extends BasePageLayoutProps {}
export interface DetailPageProps extends BasePageLayoutProps {}
export interface SubpagePageProps extends BasePageLayoutProps {
  /** Persistent peer-page navigation rendered immediately below the app header. */
  tabs: ReactNode;
}

export function BrowsePage({ children, header, footer, className, id = 'page' }: BrowsePageProps) {
  return (
    <AppShellPage id={id} className={cx('tt-browse-page', className)}>
      {header}
      {children}
      {footer}
    </AppShellPage>
  );
}

export function DetailPage({ children, header, footer, className, id = 'page' }: DetailPageProps) {
  return (
    <AppShellPage id={id} className={cx('tt-detail-page', className)}>
      {header}
      {children}
      {footer}
    </AppShellPage>
  );
}

/**
 * Detail-page shell for screens with peer subpages. The tabs stay pinned
 * directly below the fixed app header while the document content scrolls.
 */
export function SubpagePage({ children, header, tabs, footer, className, id = 'page' }: SubpagePageProps) {
  return (
    <AppShellPage id={id} className={cx('tt-detail-page', 'tt-subpage-page', className)}>
      {header}
      <div className="tt-subpage-page__tabs">{tabs}</div>
      {children}
      {footer}
    </AppShellPage>
  );
}
