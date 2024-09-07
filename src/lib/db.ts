import { id, init, lookup, tx } from '@instantdb/react';

const INSTANT_APP_ID = process.env.NEXT_PUBLIC_INSTANT_DB_ID ?? '';

interface Schema {
  trips: {
    slug: string;
  };
  stops: {
    name: string;
    lat: number;
    lng: number;
  };
}

export const db = init<Schema>({ appId: INSTANT_APP_ID });

export function addStopToTrip(
  tripSlug: string,
  coords: { lat: number; lng: number },
) {
  const newStopId = id();
  db.transact([
    tx.trips[lookup('slug', tripSlug)].update({ slug: tripSlug }),
    tx.stops[newStopId].update({ lat: coords.lat, lng: coords.lng }),
    tx.trips[lookup('slug', tripSlug)].link({ stops: newStopId }),
  ]);
}
