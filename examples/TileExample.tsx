import { Tile, ListItem, DesignList, PageSection, Pill } from '../src';

export function TileExample() {
  return (
    <PageSection title="Generic Tile & List Compositions" density="compact">
      <DesignList density="editorial" surface="grouped" divider="hairline" paginate={false}>
        {/* Date tile list item */}
        <ListItem
          leading={<Tile label="SEP" value={12} tone="accent" />}
          title="Batts U15 2* Grand Prix"
          subtitle={
            <span>
              <span>Junior 2* · Harlow</span> · <Pill tone="success" size="xs">Published</Pill>
            </span>
          }
          onClick={() => console.log('Open event')}
        />

        {/* Set / match count tile list item */}
        <ListItem
          leading={<Tile label="SET" value={3} tone="neutral" />}
          title="Jane Smith vs Alex Jones"
          subtitle="Table 4 · Semi-Final"
        />

        {/* Rank tile list item */}
        <ListItem
          leading={<Tile label="#" value={1} tone="warning" />}
          title="Top Rated Singles Player"
          subtitle="Rating 2140 · 42 wins"
        />

        {/* Loading / status tile list item */}
        <ListItem
          leading={<Tile icon={<i className="fa fa-spinner fa-spin" />} tone="neutral" />}
          title="Processing form submission…"
          subtitle="Google Forms import in progress"
        />
      </DesignList>
    </PageSection>
  );
}
