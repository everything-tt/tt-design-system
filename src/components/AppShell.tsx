import React, { MouseEventHandler, ReactNode } from 'react';
import { cx } from '../utils/cx';
import {
  useScrollRestorationRef,
  type ScrollRestorationAdapter,
} from '../navigation/scroll-restoration';

export type HeaderIconPosition = 1 | 2 | 3 | 4;
export type HeaderClearSize = 'small' | 'medium' | 'large';

export interface AppHeaderAction {
  iconClassName: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  position: HeaderIconPosition;
  ariaLabel: string;
  className?: string;
  badgeContent?: ReactNode;
}

export interface AppShellPageProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export interface AppPageContentProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Own page scrolling inside the 100dvh app shell. Defaults to true. */
  scrollable?: boolean;
  /** Restore this page container from navigation history when a provider is present. */
  restoreScroll?: boolean;
  restorationId?: string;
  contentReady?: boolean;
  anchorSelector?: string;
  restorationAdapter?: ScrollRestorationAdapter;
  maxRestoreFrames?: number;
}

export interface AppHeaderSpacerProps {
  size?: HeaderClearSize;
}

export interface AppHeaderProps {
  title?: ReactNode;
  /** When true, render the title as an <h1> so the route exposes a page landmark heading. */
  heading?: boolean;
  onTitleClick?: MouseEventHandler<HTMLButtonElement>;
  leftAction?: AppHeaderAction;
  rightAction?: AppHeaderAction;
  actions?: AppHeaderAction[];
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  ref?: React.Ref<HTMLElement>;
}

function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

export function AppHeaderActionLink({ iconClassName, onClick, position, ariaLabel, className, badgeContent }: AppHeaderAction) {
  return (
    <button
      type="button"
      className={cx('header-icon', `header-icon-${position}`, 'tt-app-header__action', className)}
      aria-label={ariaLabel}
      onClick={onClick}
      data-pressable="true"
    >
      <i className={iconClassName} aria-hidden="true" />
      {badgeContent}
    </button>
  );
}

export function AppShellPage({ children, className, id = 'page' }: AppShellPageProps) {
  return (
    <div
      id={id}
      className={cx('app-shell-page', 'tt-app-shell', className)}
      data-app-ui="true"
      data-app-viewport="true"
    >
      {children}
    </div>
  );
}

export function AppHeaderSpacer({ size = 'medium' }: AppHeaderSpacerProps) {
  return <div className={cx(`header-clear-${size}`, 'tt-app-header-spacer')} aria-hidden="true" />;
}

export const AppPageContent = React.forwardRef<HTMLElement, AppPageContentProps>(({
  children,
  className,
  style,
  scrollable = true,
  restoreScroll = false,
  restorationId = 'page',
  contentReady = true,
  anchorSelector,
  restorationAdapter,
  maxRestoreFrames,
}, forwardedRef) => {
  const restorationRef = useScrollRestorationRef<HTMLElement>({
    restorationId,
    enabled: restoreScroll,
    contentReady,
    anchorSelector,
    adapter: restorationAdapter,
    maxRestoreFrames,
  });

  return (
    <main
      ref={(node) => {
        restorationRef(node);
        assignRef(forwardedRef, node);
      }}
      className={cx(
        'page-content',
        'tt-page-content',
        scrollable && 'tt-page-content--scrollable',
        className,
      )}
      style={style}
      data-scroll-container={scrollable ? restorationId : undefined}
    >
      {children}
    </main>
  );
});

AppPageContent.displayName = 'AppPageContent';

export const AppHeader = React.forwardRef<HTMLElement, AppHeaderProps>(({
  title,
  heading = false,
  onTitleClick,
  leftAction,
  rightAction,
  actions = [],
  children,
  className,
  style,
  ariaLabel = 'Application header',
}, ref) => {
  return (
    <header
      ref={ref}
      style={style}
      className={cx('header header-fixed header-logo-center', 'tt-app-header', className)}
      aria-label={ariaLabel}
    >
      {children ? (
        children
      ) : (
        <>
          {onTitleClick ? (
            <button type="button" className="header-title tt-app-header__title" onClick={onTitleClick} data-pressable="true">{title}</button>
          ) : heading ? (
            <h1 className="header-title tt-app-header__title">{title}</h1>
          ) : (
            <span className="header-title tt-app-header__title">{title}</span>
          )}
          {leftAction ? <AppHeaderActionLink {...leftAction} /> : null}
          {rightAction ? <AppHeaderActionLink {...rightAction} /> : null}
          {actions.map((action, index) => (
            <AppHeaderActionLink key={`${action.position}-${action.ariaLabel}-${index}`} {...action} />
          ))}
        </>
      )}
    </header>
  );
});

AppHeader.displayName = 'AppHeader';
