import React, { useId, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/utils';
import {
  ScrollRestorationRevealScope,
  useScrollRestorationRef,
  useScrollRestorationRevealRegistry,
  type ScrollRestorationAdapter,
} from '../navigation/scroll-restoration';

export interface ScrollAreaProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
  restoreScroll?: boolean;
  /** Stable within the navigation entry. Pass explicitly for independently restorable areas. */
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
  const revealRegistry = useScrollRestorationRevealRegistry(restorationAdapter);
  const restorationRef = useScrollRestorationRef<HTMLDivElement>({
    restorationId: stableRestorationId,
    enabled: restoreScroll,
    contentReady,
    anchorSelector,
    adapter: revealRegistry.adapter,
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
      <ScrollRestorationRevealScope register={revealRegistry.register}>
        {children}
      </ScrollRestorationRevealScope>
    </div>
  );
});

ScrollArea.displayName = 'ScrollArea';

export interface ScrollAnchorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  anchorId: string;
  children: ReactNode;
  /** Put the anchor attribute on the child itself, preserving direct-child list/grid structure. */
  asChild?: boolean;
}

export function ScrollAnchor({ anchorId, children, asChild = false, className, ...props }: ScrollAnchorProps) {
  if (asChild) {
    if (!React.isValidElement<Record<string, unknown>>(children)) {
      throw new Error('ScrollAnchor with asChild requires exactly one React element child.');
    }
    const childClassName = typeof children.props.className === 'string' ? children.props.className : undefined;
    return React.cloneElement(children, {
      ...props,
      className: cn(childClassName, className),
      'data-scroll-anchor': anchorId,
    });
  }
  return (
    <div {...props} className={className} data-scroll-anchor={anchorId}>
      {children}
    </div>
  );
}
