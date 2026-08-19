import { cx } from '../utils/cx';

export interface DateTileProps {
  /** ISO date string (e.g. "2026-08-19"), Date object, or null/undefined. */
  date?: string | Date | null;
  /** Explicit 3-letter month abbreviation (e.g. "AUG"). Overrides parsed month from `date`. */
  month?: string;
  /** Explicit day number (e.g. "19"). Overrides parsed day from `date`. */
  day?: string | number;
  /** Tile status when date is processing, failed, or unknown. */
  status?: 'upcoming' | 'processing' | 'failed' | 'completed' | 'unknown';
  /** Accessible label for screen readers. */
  ariaLabel?: string;
  className?: string;
}

function parseDateParts(date: string | Date | null | undefined) {
  if (!date) return null;
  const value = typeof date === 'string' ? new Date(date.includes('T') ? date : `${date}T12:00:00`) : date;
  if (Number.isNaN(value.getTime())) return null;
  const month = value.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  const day = value.getDate();
  const fullLabel = value.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return { month, day, fullLabel };
}

export function DateTile({
  date,
  month: customMonth,
  day: customDay,
  status = 'upcoming',
  ariaLabel,
  className,
}: DateTileProps) {
  const parsed = parseDateParts(date);
  const displayMonth = customMonth ?? parsed?.month;
  const displayDay = customDay ?? parsed?.day;

  if (status === 'processing') {
    return (
      <span className={cx('tt-date-tile tt-date-tile--processing', className)} aria-label={ariaLabel ?? 'Processing date'}>
        <i className="fa fa-spinner fa-spin" aria-hidden="true" />
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span className={cx('tt-date-tile tt-date-tile--failed', className)} aria-label={ariaLabel ?? 'Date processing failed'}>
        <i className="fa fa-exclamation" aria-hidden="true" />
      </span>
    );
  }

  if (!displayMonth || displayDay == null) {
    return (
      <span className={cx('tt-date-tile tt-date-tile--unknown', className)} aria-label={ariaLabel ?? 'Date unavailable'}>
        <i className="fa fa-calendar" aria-hidden="true" />
      </span>
    );
  }

  const label = ariaLabel ?? parsed?.fullLabel ?? `${displayMonth} ${displayDay}`;

  return (
    <span className={cx('tt-date-tile', className)} aria-label={label} title={label}>
      <span className="tt-date-tile__month" aria-hidden="true">{displayMonth}</span>
      <span className="tt-date-tile__day" aria-hidden="true">{displayDay}</span>
    </span>
  );
}
