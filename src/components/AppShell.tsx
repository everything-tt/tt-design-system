import React, { MouseEventHandler, ReactNode } from 'react';
import { cx } from '../utils/cx';
import {
  ScrollRestorationRevealScope,
  useScrollRestorationRef,
  useScrollRestorationRevealRegistry,
  type ScrollRestorationAdapter,
} from '../navigation/scroll-restoration';

export type HeaderIconPosition = 1 | 2 | 3 | 4;
export type HeaderClearSize = 'small' | 'medium' | 'large';
export type AppViewportMode = 'document' | 'contained';

export interface AppHeaderAction {
  iconClassName: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  position: HeaderIconPosition;
  ariaLabel: string;
  className?: string;
  badgeContent?: ReactNode;
  /** Optional edge space reserved for this action when laying out the header title. */
  titleInset?: number;
}

export interface AppShellPageProps {
  children: ReactNode;
  className?: string;
  id?: string;
  /** `document` preserves the legacy window scroller. `contained` opts into the 100dvh owned viewport. */
  viewport?: AppViewportMode;
}

export interface AppPageContentProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Own page scrolling inside a contained app shell. Defaults to true when restoreScroll is enabled. */
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

export function AppShellPage({ children, className, id = 'page', viewport = 'document' }: AppShellPageProps) {
  return (
    <div
      id={id}
      className={cx(
        'app-shell-page',
        'tt-app-shell',
        viewport === 'contained' && 'tt-app-shell--contained',
        className,
      )}
      data-app-ui="true"
      data-app-viewport={viewport}
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
  scrollable,
  restoreScroll = false,
  restorationId = 'page',
  contentReady = true,
  anchorSelector,
  restorationAdapter,
  maxRestoreFrames,
}, forwardedRef) => {
  const ownsScroll = scrollable ?? restoreScroll;
  const revealRegistry = useScrollRestorationRevealRegistry(restorationAdapter);
  const restorationRef = useScrollRestorationRef<HTMLElement>({
    restorationId,
    enabled: restoreScroll,
    contentReady,
    anchorSelector,
    adapter: revealRegistry.adapter,
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
        ownsScroll && 'tt-page-content--scrollable',
        className,
      )}
      style={style}
      data-scroll-container={ownsScroll ? restorationId : undefined}
    >
      <ScrollRestorationRevealScope register={revealRegistry.register}>
        {children}
      </ScrollRestorationRevealScope>
    </main>
  );
});

AppPageContent.displayName = 'AppPageContent';

function titleInsetForActions(actions: AppHeaderAction[]) {
  let left = 15;
  let right = 15;

  actions.forEach((action) => {
    const defaultInset = action.position === 1 || action.position === 4 ? 55 : 100;
    const inset = action.titleInset ?? defaultInset;

    if (action.position <= 2) left = Math.max(left, inset);
    else right = Math.max(right, inset);
  });

  return { left, right };
}

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
  const renderedActions = [leftAction, rightAction, ...actions].filter(
    (action): action is AppHeaderAction => Boolean(action),
  );
  const titleInset = titleInsetForActions(renderedActions);
  const titleStyle: React.CSSProperties = {
    left: titleInset.left,
    right: titleInset.right,
    width: 'auto',
    marginLeft: 0,
    textAlign: 'left',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

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
            <button type="button" className="header-title tt-app-header__title" style={titleStyle} onClick={onTitleClick} data-pressable="true">{title}</button>
          ) : heading ? (
            <h1 className="header-title tt-app-header__title" style={titleStyle}>{title}</h1>
          ) : (
            <span className="header-title tt-app-header__title" style={titleStyle}>{title}</span>
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
