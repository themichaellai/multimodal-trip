import 'server-only';
import { preloadQuery } from 'convex/nextjs';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { api } from '../../../../convex/_generated/api';

export function preloadTrip(tripSlug: string) {
  return preloadQuery(
    api.trips.getBySlug,
    { slug: tripSlug },
    {
      token: convexAuthNextjsToken(),
    },
  );
}

export type PreloadedTrip = Awaited<ReturnType<typeof preloadTrip>>;

export function preloadTripSteps(tripSlug: string) {
  return preloadQuery(
    api.trips.getTransitTimeEstimateSteps,
    { tripSlug },
    {
      token: convexAuthNextjsToken(),
    },
  );
}
export type PreloadedTripSteps = Awaited<ReturnType<typeof preloadTripSteps>>;
