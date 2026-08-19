import type { ReactNode } from 'react';
import { DateTile, type DateTileProps } from './DateTile';
import { ListItem } from './List';
import { Pill, type PillProps } from './List';
import { cx } from '../utils/cx';

export interface EventListItemProps {
  /** Event title. */
  title: ReactNode;
  /** ISO date string or Date object. */
  date?: string | Date | null;
  /** Explicit month abbreviation (e.g. "AUG"). */
  month?: string;
  /** Explicit day number (e.g. "19"). */
  day?: string | number;
  /** Date tile status if date is processing or unknown. */
  dateStatus?: DateTileProps['status'];
  /** Subtitle or multi-line metadata description. */
  subtitle?: ReactNode;
  /** Venue, category, or location tag. */
  category?: string;
  /** Venue location or postcode. */
  location?: string;
  /** Status badge label (e.g. "Published", "Live", "Completed"). */
  statusLabel?: string;
  /** Status badge tone. */
  statusTone?: PillProps['tone'];
  /** Custom leading element (replaces default DateTile). */
  leading?: ReactNode;
  /** Custom trailing element or action controls. */
  trailing?: ReactNode;
  /** Click handler for selecting/opening the event. */
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

export function EventListItem({
  title,
  date,
  month,
  day,
  dateStatus,
  subtitle,
  category,
  location,
  statusLabel,
  statusTone = 'neutral',
  leading,
  trailing,
  onClick,
  active,
  disabled,
  className,
}: EventListItemProps) {
  const metadataParts = [
    category,
    location,
  ].filter(Boolean);

  const formattedSubtitle = subtitle ?? (
    metadataParts.length > 0 || statusLabel ? (
      <span className="tt-event-list-item__subtitle">
        {metadataParts.length > 0 ? (
          <span className="tt-event-list-item__details">{metadataParts.join(' · ')}</span>
        ) : null}
        {statusLabel ? (
          <Pill tone={statusTone} size="xs">{statusLabel}</Pill>
        ) : null}
      </span>
    ) : undefined
  );

  const dateTile = leading ?? (
    <DateTile date={date} month={month} day={day} status={dateStatus} />
  );

  return (
    <ListItem
      leading={dateTile}
      title={title}
      subtitle={formattedSubtitle}
      trailing={trailing}
      onClick={onClick}
      active={active}
      disabled={disabled}
      className={cx('tt-event-list-item', className)}
    />
  );
}
