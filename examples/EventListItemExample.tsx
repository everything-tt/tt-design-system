import { DateTile, EventListItem, DesignList, PageSection } from '../src';

export function EventListItemExample() {
  return (
    <PageSection title="Upcoming Tournaments" density="compact">
      <DesignList density="editorial" surface="grouped" divider="hairline" paginate={false}>
        <EventListItem
          title="Batts U15 2* Grand Prix"
          date="2026-09-12"
          category="Junior 2*"
          location="Harlow"
          statusLabel="Published"
          statusTone="success"
          onClick={() => console.log('Open tournament')}
        />
        <EventListItem
          title="Essex County Championships 2026"
          date="2026-10-04"
          category="Senior & Veteran"
          location="Colchester"
          statusLabel="Upcoming"
          statusTone="neutral"
          onClick={() => console.log('Open tournament')}
        />
        <EventListItem
          title="Processing Form Submission"
          dateStatus="processing"
          category="Google Forms"
          statusLabel="Processing"
          statusTone="accent"
        />
      </DesignList>
    </PageSection>
  );
}
