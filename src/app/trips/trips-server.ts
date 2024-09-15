import 'server-only';
import { preloadQuery } from 'convex/nextjs';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { api } from '../../../convex/_generated/api';

export function getUserTrips() {
  return preloadQuery(
    api.trips.getUserTrips,
    {},
    {
      token: convexAuthNextjsToken(),
    },
  );
}

export type PreloadedTrips = Awaited<ReturnType<typeof getUserTrips>>;
