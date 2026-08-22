import React from 'react';
import { cn } from '../lib/utils';
import { Input, type InputProps } from './ui/input';

/**
 * Branded mobile input. Native input props are intentionally preserved so
 * consumers can set inputMode, type, enterKeyHint and autoComplete directly.
 */
export interface AppInputProps extends InputProps {}

export const AppInput = React.forwardRef<HTMLInputElement, AppInputProps>(({ className, ...props }, ref) => (
  <Input ref={ref} className={cn('tt-input', className)} {...props} />
));

AppInput.displayName = 'AppInput';
