import type { ReactNode } from 'react';
import { AppButton, type AppButtonProps } from './AppButton';

export interface IconButtonProps extends Omit<AppButtonProps, 'children' | 'iconOnly' | 'aria-label'> {
  children: ReactNode;
  ariaLabel: string;
}

/** Icon-only action with a required accessible name and a 48px touch target. */
export function IconButton({ children, ariaLabel, size = 'm', ...props }: IconButtonProps) {
  return (
    <AppButton {...props} size={size} iconOnly aria-label={ariaLabel}>
      {children}
    </AppButton>
  );
}
