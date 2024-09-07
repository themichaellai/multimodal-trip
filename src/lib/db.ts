import { id, init, lookup, tx } from '@instantdb/react';

const INSTANT_APP_ID = process.env.NEXT_PUBLIC_INSTANT_DB_ID ?? '';

export interface Schema {
  trips: {
    slug: string;
  };
  stops: {
    name?: string;
    lat: number;
    lng: number;
  };
}

export const db = init<Schema>({ appId: INSTANT_APP_ID });

export async function addStopToTrip(
  tripSlug: string,
  {
    coords,
    placeId,
  }: {
    coords: { lat: number; lng: number };
    placeId: string | null;
  },
): Promise<void> {
  const newStopId = id();
  await db.transact([
    tx.trips[lookup('slug', tripSlug)].update({ slug: tripSlug }),
    tx.stops[newStopId].update({
      lat: coords.lat,
      lng: coords.lng,
      ...(placeId == null ? { name: 'Place' } : {}),
    }),
    tx.trips[lookup('slug', tripSlug)].link({ stops: newStopId }),
  ]);
  await fetch('/api/get-place', {
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({ place_id: placeId, stop_id: newStopId }),
  });
}

export function removeStop(stopId: string) {
  db.transact([tx.stops[stopId].delete()]);
}
