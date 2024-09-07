import { i } from '@instantdb/core';

const INSTANT_APP_ID = '1165b118-fd8c-4d08-8eb8-aaec413f28f1';

const graph = i.graph(
  INSTANT_APP_ID,
  {
    trips: i.entity({
      slug: i.string().unique(),
    }),
    stops: i.entity({
      name: i.string(),
      lat: i.number(),
      lng: i.number(),
    }),
  },
  {
    tripStops: {
      forward: {
        on: 'trips',
        has: 'many',
        label: 'stops',
      },
      reverse: {
        on: 'stops',
        has: 'one',
        label: 'trip',
      },
    },
  },
);

export default graph;
