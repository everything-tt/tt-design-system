import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/utils';

export interface PressableProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  /** Optional toggle state. When supplied, aria-pressed is emitted automatically. */
  pressed?: boolean;
}

/**
 * Low-level native button interaction primitive for mobile/PWA controls.
 * It owns touch target, focus, pressed/disabled and selection behaviour while
 * leaving product-specific visual treatment to a className or higher wrapper.
 */
export function Pressable({
  children,
  className,
  pressed,
  disabled,
  type = 'button',
  ...props
}: PressableProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      aria-pressed={pressed}
      data-pressable="true"
      data-state={disabled ? 'disabled' : pressed ? 'pressed' : 'idle'}
      className={cn('tt-pressable', className)}
    >
      {children}
    </button>
  );
}
