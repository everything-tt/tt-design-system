import React, { useId, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/utils';
import {
  useScrollRestorationRef,
  type ScrollRestorationAdapter,
} from '../navigation/scroll-restoration';

export interface ScrollAreaProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
  restoreScroll?: boolean;
  /** Stable within the navigation entry. Required when multiple areas are restorable. */
  restorationId?: string;
  contentReady?: boolean;
  anchorSelector?: string;
  restorationAdapter?: ScrollRestorationAdapter;
  maxRestoreFrames?: number;
}

function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

/** Mobile scroll container with overscroll containment and optional history restoration. */
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(({
  children,
  className,
  restoreScroll = false,
  restorationId,
  contentReady = true,
  anchorSelector,
  restorationAdapter,
  maxRestoreFrames,
  ...props
}, forwardedRef) => {
  const generatedId = useId();
  const stableRestorationId = restorationId ?? `scroll-area:${generatedId}`;
  const restorationRef = useScrollRestorationRef<HTMLDivElement>({
    restorationId: stableRestorationId,
    enabled: restoreScroll,
    contentReady,
    anchorSelector,
    adapter: restorationAdapter,
    maxRestoreFrames,
  });

  return (
    <div
      {...props}
      ref={(node) => {
        restorationRef(node);
        assignRef(forwardedRef, node);
      }}
      className={cn('tt-scroll-area', className)}
      data-scroll-container={stableRestorationId}
    >
      {children}
    </div>
  );
});

ScrollArea.displayName = 'ScrollArea';

export interface ScrollAnchorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  anchorId: string;
  children: ReactNode;
}

/** Stable logical item used by anchor + offset scroll restoration. */
export function ScrollAnchor({ anchorId, children, ...props }: ScrollAnchorProps) {
  return (
    <div {...props} data-scroll-anchor={anchorId}>
      {children}
    </div>
  );
}
