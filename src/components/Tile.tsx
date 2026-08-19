import type { ReactNode } from 'react';
import { cx } from '../utils/cx';

export interface TileProps {
  /** Small top label or eyebrow (e.g. "AUG", "SET", "RANK"). */
  label?: ReactNode;
  /** Main bold value or number (e.g. 19, 3, 1). */
  value?: ReactNode;
  /** Icon element or status fallback (e.g. spinner, check icon). */
  icon?: ReactNode;
  /** Tone variant for background and label accent styling. */
  tone?: 'accent' | 'neutral' | 'success' | 'danger' | 'warning';
  /** Accessible label for screen readers. */
  ariaLabel?: string;
  className?: string;
}

/**
 * Generic square/compact tile badge.
 * Used for date tiles, match set counts, rating ranks, or status indicators.
 */
export function Tile({
  label,
  value,
  icon,
  tone = 'neutral',
  ariaLabel,
  className,
}: TileProps) {
  const labelText = typeof label === 'string' || typeof label === 'number' ? String(label) : '';
  const valueText = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  const computedAriaLabel = ariaLabel ?? (labelText && valueText ? `${labelText} ${valueText}` : undefined);

  return (
    <span
      className={cx('tt-tile', `tt-tile--${tone}`, className)}
      aria-label={computedAriaLabel}
      title={computedAriaLabel}
    >
      {icon ? (
        <span className="tt-tile__icon" aria-hidden="true">{icon}</span>
      ) : (
        <>
          {label != null ? <span className="tt-tile__label" aria-hidden="true">{label}</span> : null}
          {value != null ? <span className="tt-tile__value" aria-hidden="true">{value}</span> : null}
        </>
      )}
    </span>
  );
}
