import 'server-only';

import { init, tx } from '@instantdb/admin';
import { Schema, StopWithId } from './db';

const INSTANT_APP_ID = process.env.NEXT_PUBLIC_INSTANT_DB_ID ?? '';
const INSTANT_DB_SECRET = process.env.INSTANT_DB_SECRET ?? '';

const db = init<Schema>({
  appId: INSTANT_APP_ID,
  adminToken: INSTANT_DB_SECRET,
});

export async function setStopName(stopId: string, name: string): Promise<void> {
  await db.transact([tx.stops[stopId].update({ name })]);
}

export async function getStopById(stopId: string): Promise<StopWithId | null> {
  const res = await db.query({
    stops: {
      $: {
        where: {
          id: stopId,
        },
      },
    },
  });
  if (res.stops.length === 0) {
    return null;
  }
  return res.stops[0];
}

export async function getSiblingStops(stopId: string): Promise<StopWithId[]> {
  const parentTrip = await db.query({
    trips: {
      $: {
        where: {
          'stops.id': stopId,
        },
      },
      stops: {},
    },
  });
  if (parentTrip.trips.length === 0) {
    return [];
  }
  return parentTrip.trips[0].stops.sort((a, b) => a.tripOrder - b.tripOrder);
}
