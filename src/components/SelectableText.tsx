import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface SelectableTextProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  children: ReactNode;
}

/** Explicit opt-in for copyable content inside the non-selectable app shell. */
export function SelectableText({ children, className, ...props }: SelectableTextProps) {
  return (
    <span {...props} className={cn('tt-selectable-text', className)} data-selectable="true">
      {children}
    </span>
  );
}
