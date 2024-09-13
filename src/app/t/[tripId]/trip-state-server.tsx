import 'server-only';
import { preloadQuery } from 'convex/nextjs';
import { api } from '../../../../convex/_generated/api';

export function preloadTrip(tripSlug: string) {
  return preloadQuery(api.trips.getBySlug, { slug: tripSlug });
}

export type PreloadedTrip = Awaited<ReturnType<typeof preloadTrip>>;

export function preloadTripSteps(tripSlug: string) {
  return preloadQuery(api.trips.getTransitTimeEstimateSteps, { tripSlug });
}
export type PreloadedTripSteps = Awaited<ReturnType<typeof preloadTripSteps>>;
